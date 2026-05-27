import { query } from './src/lib/mysql';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

interface NodeInfo {
  id: string;
  name: string;
}

interface ExcelRow {
  'LOCATION (source-target)'?: string;
  'ROUTES\n(json)'?: string;
  'ROUTES (json)'?: string;
  'JEEPNEY Line'?: string;
  'DISTANCE (kms.)'?: string;
  'FARE'?: string;
  'STOP or Transfer (if any)'?: string;
}

async function fixIngestion() {
  const filePath = 'origin-destination (1).xlsx';
  const nodesCache = JSON.parse(fs.readFileSync('nodes_cache.json', 'utf8')) as NodeInfo[];
  const nodesMap = new Map<string, string>();
  
  nodesCache.forEach((n: NodeInfo) => {
    nodesMap.set(n.name.toLowerCase().trim(), n.id);
    nodesMap.set(n.id.toLowerCase().trim(), n.id);
  });

  const aliases: Record<string, string> = {
    'tambo terminal': 'tambo-terminal',
    'msu-iit': 'msu-iit',
    'gaisano mall': 'gaisano-mall',
    'centennial park': 'centennial-park',
    'paseo': 'paseo-santaigo',
    'city proper': 'public-plaza',
    'iligan proper': 'public-plaza',
    'tambo market': 'tambo-market',
    'cathedral': 'st.michael-cathedral',
    'st. michael college': "st.michael's-college",
    'robinson mall': 'robinsons-mall',
    'icnhs': 'icnhs',
    'icc': 'icc',
    'southbound terminal': 'south-bound',
    'wet market': 'wet-market',
    'night market': 'night-market',
    'city public plaza': 'public-plaza',
    'city hospital': 'city-hospital',
    'deped': 'deped',
    'zoey': "zoey's-cafe",
    'regs / soda beach': 'soda-beach',
    'iligan medical center college': 'imch',
    'imcc': 'imch',
    '167 hypermart': 'hypermart-167',
    'port of iligan': 'iligan-port',
    'iligan medical center hospital': 'imch',
    'landbank iligan main': 'landbank-main',
    'psa': 'psa-office',
    'philhealth': 'philhealth-office',
    'highway 30': 'v-highway-30',
    'mastertech': 'v-mastertech',
    'jollibee aguinaldo': 'v-jollibee-aguinaldo',
    'crown paper': 'v-crown-paper',
    'desmark iligan': 'v-desmark',
    'children\'s park': 'childrens-park',
    'unicity': 'unicity',
    'red cross': 'red-cross'
  };

  Object.entries(aliases).forEach(([alias, id]) => {
    nodesMap.set(alias.toLowerCase().trim(), id);
  });

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['DATA'] || workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet) as ExcelRow[];

  console.log(`Total rows in Excel: ${data.length}`);
  
  // Clear existing route_blocks first to start fresh and avoid duplicates/ghost edges
  console.log('Clearing existing route_blocks...');
  await query('DELETE FROM route_blocks');

  let insertedBlocks = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (i === 1) continue; // Skip Row 3

    const locStr = (row['LOCATION (source-target)'] || '').toString().trim();
    const geoJsonStr = (row['ROUTES\n(json)'] || row['ROUTES (json)'] || '').toString().trim();
    const baseRouteName = (row['JEEPNEY Line'] || 'Unknown').toString().trim();
    const distStr = (row['DISTANCE (kms.)'] || '').toString().trim();
    const fareStr = (row['FARE'] || '').toString().trim();
    const transferInfo = (row['STOP or Transfer (if any)'] || '').toString().trim();

    const match = locStr.match(/from\s+(.+?)\s+to\s+(.+)/i);
    let startName = match ? match[1].trim() : '';
    let endName = match ? match[2].trim() : '';
    
    if (!startName || !endName) continue;

    const startId = nodesMap.get(startName.toLowerCase().trim());
    const endId = nodesMap.get(endName.toLowerCase().trim());

    if (!startId || !endId) continue;

    // Parse GeoJSON features
    let features: any[] = [];
    try {
      if (geoJsonStr) {
        const jsonMatch = geoJsonStr.match(/\{[\s\S]+\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          features = parsed.features || (parsed.geometry ? [parsed] : []);
        }
      }
    } catch (e) {}

    if (features.length === 0) continue;

    // Parse distances with units
    const rawDistances = distStr.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const distances: number[] = rawDistances.map(s => {
        const valMatch = s.match(/(\d+(\.\d+)?)/);
        if (!valMatch) return 0;
        let val = parseFloat(valMatch[1]);
        if (s.toLowerCase().includes('m') && !s.toLowerCase().includes('km')) {
            val = val / 1000; // Convert meters to km
        }
        return val;
    });

    const fares = (fareStr.match(/(\d+(\.\d+)?)/g) || []).map(Number);

    // Identify intermediate nodes from transferInfo
    const intermediateNodeNames: string[] = [];
    const stopMatches = Array.from(transferInfo.matchAll(/STOP\s+at\s+([^=\n]+)/gi));
    stopMatches.forEach(m => intermediateNodeNames.push(m[1].trim()));

    // Identify route changes from transferInfo
    const routeChanges: { index: number, name: string }[] = [];
    const transferMatches = Array.from(transferInfo.matchAll(/TRANSFER\s+to\s+([^(\n]+)/gi));
    transferMatches.forEach((m, idx) => {
        routeChanges.push({ index: idx + 1, name: m[1].trim() });
    });

    let currentSourceId = startId;
    let currentRouteName = baseRouteName;

    for (let fIdx = 0; fIdx < features.length; fIdx++) {
        const feature = features[fIdx];
        const coords = feature.geometry ? feature.geometry.coordinates : feature.coordinates;
        
        if (!coords || coords.length === 0) continue;

        let currentTargetId: string;
        if (fIdx === features.length - 1) {
            currentTargetId = endId;
        } else {
            const nextNodeName = intermediateNodeNames[fIdx] || `v-int-${i}-${fIdx}`;
            currentTargetId = nodesMap.get(nextNodeName.toLowerCase().trim()) || nextNodeName;
        }

        // Update route name if there was a transfer
        const change = routeChanges.find(c => c.index === fIdx);
        if (change) currentRouteName = change.name;

        // Special case: if this is the last segment and the transferInfo ends with "WALK"
        // and we have more distances than intermediate nodes, the last distance might be the walk.
        if (fIdx === features.length - 1 && transferInfo.toLowerCase().endsWith('walk')) {
            currentRouteName = 'JUST WALK';
        }

        const distance = distances[fIdx] || 0;
        let fare = fares[fIdx] || 0;

        // Walking is free
        if (currentRouteName === 'JUST WALK') {
            fare = 0;
        }

        // Skip 0km edges that are not JUST WALK
        if (distance <= 0 && !currentRouteName.toLowerCase().includes('walk')) {
            console.log(`Skipping 0km edge: ${currentSourceId} -> ${currentTargetId} (${currentRouteName})`);
            continue;
        }

        const blockId = `${currentSourceId}-${currentTargetId}-${currentRouteName.toLowerCase().replace(/\s+/g, '-')}-${i}-${fIdx}`.slice(0, 255);

        try {
            await query(
                `INSERT INTO route_blocks (id, source_id, target_id, route_name, distance, regular_fare, path_coordinates, block_order) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [blockId, currentSourceId, currentTargetId, currentRouteName, distance, fare, JSON.stringify(coords), fIdx + 1]
            );
            insertedBlocks++;
        } catch (err: any) {
            console.error(`Error inserting block ${blockId}:`, err.message);
        }

        currentSourceId = currentTargetId;
    }
  }

  console.log(`\nDone. Inserted ${insertedBlocks} route blocks.`);
  process.exit(0);
}

fixIngestion();
