const XLSX = require('xlsx');
const fs = require('fs');

async function extractNodeInfo() {
  const filePath = 'origin-destination (1).xlsx';
  const nodesCache = JSON.parse(fs.readFileSync('nodes_cache.json', 'utf8'));
  const nodesMap = new Map(nodesCache.map(n => [n.name.toLowerCase().trim(), n.id]));
  
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['DATA'] || workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const unmatched = [
    '167 HyperMart', 'Port of Iligan', 'Iligan Medical Center Hospital', 
    'Landbank Iligan Main', 'PSA', 'PhilHealth', 'Regs / Soda Beach',
    'Children\'s Park', 'Iligan Medical Center College', 'Unicity'
  ];

  const nodeInfo = {};
  unmatched.forEach(name => {
    nodeInfo[name] = { coords: null, sourceRow: null };
  });

  for (let row of data) {
    const locStr = (row['LOCATION (source-target)'] || '').toString().trim();
    const geoJsonStr = (row['ROUTES\n(json)'] || row['ROUTES (json)'] || '').toString().trim();
    
    const match = locStr.match(/from\s+(.+?)\s+to\s+(.+)/i);
    let sourceName = match ? match[1].trim() : '';
    let targetName = match ? match[2].trim() : '';

    const extractCoords = (name, isSource) => {
      if (unmatched.includes(name) && !nodeInfo[name].coords) {
        try {
          const jsonMatch = geoJsonStr.match(/\{[\s\S]+\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            let coords = [];
            if (parsed.features && parsed.features.length > 0) {
              coords = parsed.features[0].geometry.coordinates;
            } else if (parsed.geometry && parsed.geometry.coordinates) {
              coords = parsed.geometry.coordinates;
            }
            
            if (coords.length > 0) {
              const point = isSource ? coords[0] : coords[coords.length - 1];
              nodeInfo[name].coords = { lat: point[1], lng: point[0] };
              nodeInfo[name].sourceRow = locStr;
            }
          }
        } catch (e) {}
      }
    };

    extractCoords(sourceName, true);
    extractCoords(targetName, false);
  }

  console.log(JSON.stringify(nodeInfo, null, 2));
}

extractNodeInfo();
