const XLSX = require('xlsx');
const fs = require('fs');

async function dryRunIngestion() {
  const filePath = 'origin-destination (1).xlsx';
  const nodesCache = JSON.parse(fs.readFileSync('nodes_cache.json', 'utf8'));
  const nodesMap = new Map();
  
  nodesCache.forEach(n => {
    nodesMap.set(n.name.toLowerCase().trim(), n.id);
    nodesMap.set(n.id.toLowerCase().trim(), n.id);
  });

  const aliases = {
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
    // New Aliases from user request
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
  const data = XLSX.utils.sheet_to_json(sheet);

  const preview = [];
  const unmatchedNodes = new Set();
  const virtualNodesNeeded = new Set();
  let invalidGeoJSON = 0;
  let missingFareOrDistance = 0;
  let matchedNodesCount = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const locStr = (row['LOCATION (source-target)'] || '').toString().trim();
    const geoJsonStr = (row['ROUTES\n(json)'] || row['ROUTES (json)'] || '').toString().trim();
    const routeName = (row['JEEPNEY Line'] || 'Unknown').toString().trim();
    const distStr = (row['DISTANCE (kms.)'] || '').toString().trim();
    const fareStr = (row['FARE'] || '').toString().trim();
    const transferInfo = (row['STOP or Transfer (if any)'] || '').toString().trim();

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

    const cleanName = (n) => n.replace(/\u00a0/g, ' ').toLowerCase().trim();

    const sourceId = nodesMap.get(cleanName(sourceName));
    const targetId = nodesMap.get(cleanName(targetName));

    if (sourceId) matchedNodesCount++; else if (sourceName) unmatchedNodes.add(sourceName.trim());
    if (targetId) matchedNodesCount++; else if (targetName) unmatchedNodes.add(targetName.trim());

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
    } catch (e) {
      invalidGeoJSON++;
    }

    const distanceMatch = distStr.match(/(\d+(\.\d+)?)/);
    const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;

    const regularFareMatch = fareStr.match(/REGULAR\s*=\s*(\d+(\.\d+)?)/i) || fareStr.match(/(\d+(\.\d+)?)/);
    const regularFare = regularFareMatch ? parseFloat(regularFareMatch[1]) : 0;

    if (!distStr || !fareStr) {
      missingFareOrDistance++;
    }

    preview.push({
      rowIndex: i + 2,
      sourceName: sourceName.trim(),
      sourceId: sourceId || null,
      targetName: targetName.trim(),
      targetId: targetId || null,
      routeName,
      distance,
      regularFare,
      coordinateCount: coordinates.length,
      isConvertible: !!(sourceId && targetId && coordinates.length > 0),
      hasErrors: !sourceId || !targetId || coordinates.length === 0
    });
  }

  const result = {
    summary: {
      totalRows: data.length,
      convertibleRows: preview.filter(p => p.isConvertible).length,
      matchedNodesCount,
      unmatchedNodes: Array.from(unmatchedNodes).sort(),
      invalidGeoJSON,
      missingFareOrDistance,
      possibleRouteBlocks: preview.length
    },
    samplePreview: preview.slice(0, 20),
    allRows: preview
  };

  fs.writeFileSync('ingestion_preview.json', JSON.stringify(result, null, 2));
  console.log('Dry-run complete. Preview saved to ingestion_preview.json');
  
  console.log('--- Summary ---');
  console.log(`Total Rows: ${result.summary.totalRows}`);
  console.log(`Convertible: ${result.summary.convertibleRows}`);
  console.log(`Matched ID Instances: ${result.summary.matchedNodesCount}`);
  console.log(`Unmatched Unique Names: ${result.summary.unmatchedNodes.length}`);
}

dryRunIngestion();
