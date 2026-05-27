const XLSX = require('xlsx');
const fs = require('fs');

// Load nodes for snapping and ID mapping
const nodesCache = JSON.parse(fs.readFileSync('nodes_cache.json', 'utf8'));
const nameToId = {};
const nodeCoords = {};
nodesCache.forEach(n => {
  nameToId[n.name.toLowerCase()] = n.id;
  nameToId[n.id.toLowerCase()] = n.id;
  nodeCoords[n.id] = [n.coordinates.latitude, n.coordinates.longitude];
});

const aliases = {
  'gaisano': 'gaisano-mall',
  'robinson': 'robinsons-mall',
  'msu-iit': 'msu-iit',
  'iit': 'msu-iit',
  'tambo terminal': 'tambo-terminal',
  'tambo market': 'tambo-market',
  'paseo': 'paseo-santaigo',
  'plaza': 'public-plaza',
  'city hall': 'iligan-cityhall',
  'wet market': 'wet-market',
  'gaisano mall': 'gaisano-mall',
  'robinsons': 'robinsons-mall',
  'cathedral': 'st.michael-cathedral',
  'st. michael college': 'st.michael\'s-college',
  'psa': 'psa-office',
  'philhealth': 'philhealth-office',
  'red cross': 'red-cross',
  'port of iligan': 'iligan-port',
  'children\'s park': 'childrens-park',
  'centennial park': 'centennial-park',
  'night market': 'night-market',
  'zoey': "zoey's-cafe",
  'suki club': 'gaisano-sukiclub',
  'regs / soda beach': 'soda-beach',
  'soda': 'soda-beach',
  'crown paper': 'v-crown-paper',
  'robinsons mall': 'robinsons-mall',
  'st michael cathedral': 'st.michael-cathedral',
  'st michael college': 'st.michael\'s-college',
  'jollibee aguinaldo': 'v-jollibee-aguinaldo',
  'desmark': 'v-desmark'
};

function normalizeName(name) {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  if (aliases[n]) return aliases[n];
  n = n.replace(/iligan\s+/g, '').replace(/\s+proper/g, '').replace(/^from\s+/i, '').replace(/\s+to\s+.*$/i, '').replace(/’/g, "'");
  if (aliases[n]) return aliases[n];
  return n;
}

function getBestId(name) {
  const norm = normalizeName(name);
  if (nameToId[norm]) return nameToId[norm];
  for (const key in nameToId) {
    if (key.includes(norm) || norm.includes(key)) return nameToId[key];
  }
  return norm.replace(/\s+/g, '-');
}

function getHaversineDistance(coords) {
  if (!coords || coords.length < 2) return 0;
  let totalDist = 0;
  const R = 6371; 
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDist += R * c;
  }
  return totalDist;
}

function snapCoords(coords, sourceId, targetId) {
  if (!coords || coords.length === 0) return [];
  const snapped = [...coords];
  const startNode = nodeCoords[sourceId];
  const endNode = nodeCoords[targetId];

  if (startNode) {
    const dist = getHaversineDistance([startNode, snapped[0]]);
    if (dist > 0.005) snapped.unshift(startNode);
    else snapped[0] = startNode;
  }
  if (endNode) {
    const dist = getHaversineDistance([snapped[snapped.length - 1], endNode]);
    if (dist > 0.005) snapped.push(endNode);
    else snapped[snapped.length - 1] = endNode;
  }
  return snapped;
}

function parseDistance(distStr) {
  if (!distStr) return [];
  const parts = distStr.toString().split(/\n+/).filter(p => p.trim());
  return parts.map(p => {
    const match = p.match(/(\d+(\.\d+)?)/);
    if (!match) return 0;
    let val = parseFloat(match[1]);
    if (p.toLowerCase().includes('km')) return val;
    if (val > 50) return val / 1000;
    return val;
  });
}

function convert() {
  const filePath = 'origin-destination (1).xlsx';
  const workbook = XLSX.readFile(filePath);
  
  const finalNodes = nodesCache.map(n => ({
    id: n.id,
    name: n.name,
    latitude: n.coordinates.latitude,
    longitude: n.coordinates.longitude,
    aliases: ''
  }));

  const finalRouteBlocks = [];

  workbook.SheetNames.forEach(sheetName => {
    if (sheetName === 'r') return;
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const rows = data.slice(1);

    rows.forEach((row, rowIndex) => {
      if (row.length === 0) return;
      const locationStr = String(row[0] || '');
      const routesJsonStr = String(row[1] || '');
      const jeepneyLine = String(row[2] || '');
      const stopAndTransfer = String(row[3] || '');
      const distStr = String(row[4] || '');

      if (!routesJsonStr.includes('LineString')) return;

      let mainSource = '';
      let mainTarget = '';
      if (locationStr.toLowerCase().includes(' to ')) {
        const parts = locationStr.split(/\s+to\s+/i);
        mainTarget = parts[parts.length - 1].trim();
        mainSource = parts.slice(0, parts.length - 1).join(' to ').replace(/^from\s+/i, '').trim();
      }

      let features = [];
      try {
        const geojson = JSON.parse(routesJsonStr);
        features = geojson.type === 'FeatureCollection' ? geojson.features : [{ geometry: geojson }];
      } catch (e) {}

      const distances = parseDistance(distStr);

      if (features.length > 1 && stopAndTransfer.toUpperCase().includes('TRANSFER')) {
        const stopMatch = stopAndTransfer.match(/STOP at\s+([^=]+)/i);
        const intermediateName = stopMatch ? stopMatch[1].trim() : 'Transfer Point';
        const intermediateId = getBestId(intermediateName);
        
        const transferMatch = stopAndTransfer.match(/TRANSFER to\s+([^(\n]+)/i);
        const secondJeepneyLine = transferMatch ? transferMatch[1].trim() : jeepneyLine;

        features.forEach((f, fIdx) => {
          if (!f.geometry || f.geometry.type !== 'LineString') return;
          let rawCoords = f.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          const sId = fIdx === 0 ? getBestId(mainSource) : intermediateId;
          const tId = fIdx === features.length - 1 ? getBestId(mainTarget) : intermediateId;
          const snapped = snapCoords(rawCoords, sId, tId);
          const dist = distances[fIdx] || getHaversineDistance(snapped);
          
          finalRouteBlocks.push({
            source_node_id: sId,
            target_node_id: tId,
            route_name: fIdx === 0 ? jeepneyLine : secondJeepneyLine,
            vehicle_type: (fIdx === 0 ? jeepneyLine : secondJeepneyLine).toLowerCase().includes('bus') ? 'minibus' : 'jeepney',
            distance_km: Number(dist.toFixed(3)),
            path_geojson: JSON.stringify(snapped),
            original_excel_ref: `Sheet: ${sheetName}, Row: ${rowIndex + 2}, Leg: ${fIdx + 1}`
          });
        });
      } else {
        features.forEach(f => {
          if (!f.geometry || f.geometry.type !== 'LineString') return;
          let rawCoords = f.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          const sId = getBestId(mainSource);
          const tId = getBestId(mainTarget);
          const snapped = snapCoords(rawCoords, sId, tId);
          const dist = distances[0] || getHaversineDistance(snapped);

          finalRouteBlocks.push({
            source_node_id: sId,
            target_node_id: tId,
            route_name: jeepneyLine || sheetName,
            vehicle_type: jeepneyLine.toLowerCase().includes('bus') ? 'minibus' : (jeepneyLine.toLowerCase().includes('walk') ? 'walking' : 'jeepney'),
            distance_km: Number(dist.toFixed(3)),
            path_geojson: JSON.stringify(snapped),
            original_excel_ref: `Sheet: ${sheetName}, Row: ${rowIndex + 2}`
          });
        });
      }
    });
  });

  const fareMatrixData = [
    { vehicle_type: 'jeepney', base_fare: 13.0, base_km: 4.0, succeeding_km_rate: 1.8, discount_rate: 0.20 },
    { vehicle_type: 'minibus', base_fare: 15.0, base_km: 4.0, succeeding_km_rate: 2.2, discount_rate: 0.20 },
    { vehicle_type: 'walking', base_fare: 0, base_km: 0, succeeding_km_rate: 0, discount_rate: 0 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finalNodes), 'Nodes');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finalRouteBlocks), 'RouteBlocks');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fareMatrixData), 'FareMatrix');

  const outputName = 'ViaGraph_Final_Standardized_Source.xlsx';
  XLSX.writeFile(wb, outputName);
  console.log(`Successfully converted origin-destination.xlsx into ${outputName}`);
}

convert();
