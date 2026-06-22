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
}

async function finalIngestion() {
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
    'desmark iligan': 'v-desmark'
  };

  Object.entries(aliases).forEach(([alias, id]) => {
    nodesMap.set(alias.toLowerCase().trim(), id);
  });

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['DATA'] || workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet) as ExcelRow[];

  console.log(`Total rows in Excel: ${data.length}`);

  let insertedCount = 0;
  let skippedCount = 0;
  const sampleRows: any[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const locStr = (row['LOCATION (source-target)'] || '').toString().trim();
    const geoJsonStr = (row['ROUTES\n(json)'] || row['ROUTES (json)'] || '').toString().trim();
    const routeName = (row['JEEPNEY Line'] || 'Unknown').toString().trim();
    const distStr = (row['DISTANCE (kms.)'] || '').toString().trim();
    const fareStr = (row['FARE'] || '').toString().trim();

    // Skip Row 3 explicitly if it matches the known issue
    if (i === 1) { // Index 1 is Row 3 (Index 0 is Row 2)
        console.log('Skipping Row 3 (Index 1) as requested due to invalid GeoJSON.');
        skippedCount++;
        continue;
    }

    const match = locStr.match(/from\s+(.+?)\s+to\s+(.+)/i);
    let sourceName = match ? match[1].trim() : '';
    let targetName = match ? match[2].trim() : '';

    if (!sourceName || !targetName) {
      const parts = locStr.split(/\s+to\s+/i);
      if (parts.length === 2) {
        sourceName = parts[0].replace(/from\s+/i, '').trim();
        targetName = parts[1].trim();
      }
    }

    const cleanName = (n: string) => n.replace(/\u00a0/g, ' ').toLowerCase().trim();

    const sourceId = nodesMap.get(cleanName(sourceName));
    const targetId = nodesMap.get(cleanName(targetName));

    let coordinates = [];
    try {
      if (geoJsonStr) {
        const jsonMatch = geoJsonStr.match(/\{[\s\S]+\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.features && parsed.features.length > 0) {
            coordinates = parsed.features[0].geometry.coordinates;
          } else if (parsed.geometry && parsed.geometry.coordinates) {
            coordinates = parsed.geometry.coordinates;
          }
        }
      }
    } catch (e) {}

    const isConvertible = !!(sourceId && targetId && coordinates.length > 0);

    if (isConvertible) {
      const distanceMatch = distStr.match(/(\d+(\.\d+)?)/);
      const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;
      const regularFareMatch = fareStr.match(/REGULAR\s*=\s*(\d+(\.\d+)?)/i) || fareStr.match(/(\d+(\.\d+)?)/);
      const regularFare = regularFareMatch ? parseFloat(regularFareMatch[1]) : 0;

      // Stable ID for upsert
      const blockId = `${sourceId}-${targetId}-${routeName.toLowerCase().replace(/\s+/g, '-')}`.slice(0, 255);

      try {
        await query(
          `INSERT INTO route_blocks (id, source_id, target_id, route_name, distance, regular_fare, path_coordinates, block_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
           distance = VALUES(distance), 
           regular_fare = VALUES(regular_fare), 
           path_coordinates = VALUES(path_coordinates)`,
          [blockId, sourceId, targetId, routeName, distance, regularFare, JSON.stringify(coordinates), 1]
        );
        insertedCount++;
        if (sampleRows.length < 5) {
          sampleRows.push({ sourceId, targetId, routeName, distance, regularFare });
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`Error inserting Row ${i + 2}:`, error.message);
        skippedCount++;
      }
    } else {
      console.log(`Skipping Row ${i + 2}: Incomplete data (Src: ${sourceId}, Tgt: ${targetId}, Coords: ${coordinates.length})`);
      skippedCount++;
    }
  }

  console.log('\n--- Final Ingestion Results ---');
  console.log(`Total Rows Processed: ${data.length}`);
  console.log(`Successfully Inserted/Updated: ${insertedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log('\n--- Sample Inserted Rows ---');
  console.table(sampleRows);

  process.exit(0);
}

finalIngestion();
