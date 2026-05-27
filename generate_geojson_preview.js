const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Fare rules
const fareRules = {
  jeepney: { base: 13.0, firstKm: 4, succeeding: 1.8, discount: 0.20 },
  minibus: { base: 15.0, firstKm: 4, succeeding: 2.2, discount: 0.20 },
  walking: { base: 0, firstKm: 0, succeeding: 0, discount: 0 }
};

function calculateFare(distance, type = 'jeepney') {
  if (type === 'walking') return 0;
  const rule = fareRules[type] || fareRules.jeepney;
  if (distance <= 0) return 0;
  let raw = rule.base;
  if (distance > rule.firstKm) {
    raw += (distance - rule.firstKm) * rule.succeeding;
  }
  return Math.round(raw / 0.25) * 0.25;
}

function calculateDiscountedFare(distance, type = 'jeepney') {
  if (type === 'walking') return 0;
  const rule = fareRules[type] || fareRules.jeepney;
  if (distance <= 0) return 0;
  let rawRegular = rule.base;
  if (distance > rule.firstKm) {
    rawRegular += (distance - rule.firstKm) * rule.succeeding;
  }
  const rawDiscounted = rawRegular * (1 - rule.discount);
  return Math.round(rawDiscounted / 0.25) * 0.25;
}

// Haversine distance in KM
function getHaversineDistance(coords) {
  if (!coords || coords.length < 2) return 0;
  let totalDist = 0;
  const R = 6371; // Radius of the earth in km
  
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDist += R * c;
  }
  return totalDist;
}

// Node mapping
const nodesCache = JSON.parse(fs.readFileSync('nodes_cache.json', 'utf8'));
const nameToId = {};
const nodeCoords = {};
nodesCache.forEach(n => {
  nameToId[n.name.toLowerCase()] = n.id;
  nameToId[n.id.toLowerCase()] = n.id;
  nodeCoords[n.id] = [n.coordinates.latitude, n.coordinates.longitude];
});

// Manual aliases for mapping
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

function parseDistance(distStr) {
  if (!distStr) return null;
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

function parseFare(fareStr) {
  if (!fareStr) return [];
  const parts = fareStr.toString().split(/\n+/).filter(p => p.trim());
  return parts.map(p => {
    const match = p.toUpperCase().match(/REGULAR\s*=\s*(\d+(\.\d+)?)/);
    if (match) return parseFloat(match[1]);
    return null;
  });
}

function snapCoords(coords, sourceId, targetId) {
  if (!coords || coords.length === 0) return [];
  const snapped = [...coords];
  const startNode = nodeCoords[sourceId];
  const endNode = nodeCoords[targetId];

  if (startNode) {
    // If first point is more than 5m away, prepend node coord
    const dist = getHaversineDistance([startNode, snapped[0]]);
    if (dist > 0.005) {
      snapped.unshift(startNode);
    } else {
      snapped[0] = startNode; // Snap perfectly
    }
  }

  if (endNode) {
    // If last point is more than 5m away, append node coord
    const dist = getHaversineDistance([snapped[snapped.length - 1], endNode]);
    if (dist > 0.005) {
      snapped.push(endNode);
    } else {
      snapped[snapped.length - 1] = endNode; // Snap perfectly
    }
  }

  return snapped;
}

function processExcel() {
  const filePath = 'origin-destination (1).xlsx';
  const workbook = XLSX.readFile(filePath);
  const allRouteBlocks = [];

  workbook.SheetNames.forEach(sheetName => {
    if (sheetName === 'r') return;
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length < 1) return;

    let startIndex = 1;
    if (data[0] && String(data[0][0]).toLowerCase().includes('location')) {
      startIndex = 1;
    }

    const rows = data.slice(startIndex);

    rows.forEach((row, rowIndex) => {
      if (row.length === 0) return;

      const locationStr = String(row[0] || '');
      const routesJsonStr = String(row[1] || '');
      const jeepneyLine = String(row[2] || '');
      const stopAndTransfer = String(row[3] || '');
      const distStr = String(row[4] || '');
      const fareStr = String(row[5] || '');
      
      if (!routesJsonStr.includes('LineString')) return;

      let mainSource = '';
      let mainTarget = '';
      if (locationStr.includes('->')) {
        [mainSource, mainTarget] = locationStr.split('->').map(s => s.trim());
      } else if (locationStr.toLowerCase().includes(' to ')) {
        const parts = locationStr.split(/\s+to\s+/i);
        if (parts.length >= 2) {
          mainTarget = parts[parts.length - 1].trim();
          mainSource = parts.slice(0, parts.length - 1).join(' to ').replace(/^from\s+/i, '').trim();
        }
      }

      let features = [];
      try {
        const geojson = JSON.parse(routesJsonStr);
        features = geojson.type === 'FeatureCollection' ? geojson.features : [{ geometry: geojson }];
      } catch (e) {}

      const distances = parseDistance(distStr) || [];
      const regularFares = parseFare(fareStr) || [];
      
      if (features.length > 1 && stopAndTransfer.toUpperCase().includes('TRANSFER')) {
        const stopMatch = stopAndTransfer.match(/STOP at\s+([^=]+)/i);
        const intermediateName = stopMatch ? stopMatch[1].trim() : 'Transfer Point';
        const intermediateId = getBestId(intermediateName);
        
        const transferMatch = stopAndTransfer.match(/TRANSFER to\s+([^(\n]+)/i);
        const secondJeepneyLine = transferMatch ? transferMatch[1].trim() : jeepneyLine;

        features.forEach((f, fIdx) => {
          if (!f.geometry || f.geometry.type !== 'LineString') return;
          
          let rawCoords = f.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          const sourceId = fIdx === 0 ? getBestId(mainSource) : intermediateId;
          const targetId = fIdx === features.length - 1 ? getBestId(mainTarget) : intermediateId;
          
          const snapped = snapCoords(rawCoords, sourceId, targetId);
          let dist = distances[fIdx] || getHaversineDistance(snapped);
          let vehicleType = (fIdx === 0 ? jeepneyLine : secondJeepneyLine).toLowerCase().includes('bus') ? 'minibus' : 'jeepney';
          let fare = regularFares[fIdx] || calculateFare(dist, vehicleType);
          
          allRouteBlocks.push({
            source_id: sourceId,
            target_id: targetId,
            source_name: fIdx === 0 ? mainSource : intermediateName,
            target_name: fIdx === features.length - 1 ? mainTarget : intermediateName,
            route_name: fIdx === 0 ? jeepneyLine : secondJeepneyLine,
            vehicle_type: vehicleType,
            distance: Number(dist.toFixed(3)),
            regular_fare: fare,
            discounted_fare: calculateDiscountedFare(dist, vehicleType),
            path_coordinates: JSON.stringify(snapped),
            ready_for_insert: true,
            notes: `Sheet: ${sheetName}, Row: ${rowIndex + startIndex + 1}, Leg: ${fIdx + 1}`,
            stop_and_transfer: fIdx === 0 ? stopAndTransfer : ""
          });
        });
      } else {
        features.forEach(f => {
           if (!f.geometry || f.geometry.type !== 'LineString') return;
           let rawCoords = f.geometry.coordinates.map(coord => [coord[1], coord[0]]);
           const sourceId = getBestId(mainSource);
           const targetId = getBestId(mainTarget);
           const snapped = snapCoords(rawCoords, sourceId, targetId);

           let dist = (distances[0] || getHaversineDistance(snapped));
           let vehicleType = jeepneyLine.toLowerCase().includes('bus') ? 'minibus' : (jeepneyLine.toLowerCase().includes('walk') ? 'walking' : 'jeepney');
           let fare = regularFares[0] || calculateFare(dist, vehicleType);

           allRouteBlocks.push({
             source_id: sourceId,
             target_id: targetId,
             source_name: mainSource,
             target_name: mainTarget,
             route_name: jeepneyLine || sheetName,
             vehicle_type: vehicleType,
             distance: Number(dist.toFixed(3)),
             regular_fare: fare,
             discounted_fare: calculateDiscountedFare(dist, vehicleType),
             path_coordinates: JSON.stringify(snapped),
             ready_for_insert: true,
             notes: `Sheet: ${sheetName}, Row: ${rowIndex + startIndex + 1}`,
             stop_and_transfer: stopAndTransfer
           });
        });
      }
    });
  });

  fs.writeFileSync('excel_geojson_route_blocks_preview.json', JSON.stringify(allRouteBlocks, null, 2));
  console.log(`Successfully generated preview with ${allRouteBlocks.length} snapped route blocks.`);
}

processExcel();
