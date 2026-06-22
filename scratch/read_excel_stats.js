const XLSX = require('xlsx');

function main() {
  const filePath = 'ViaGraph_Final_Standardized_Source.xlsx';
  console.log('Inspecting:', filePath);
  const workbook = XLSX.readFile(filePath);
  
  console.log('Sheets:', workbook.SheetNames);
  
  const nodesSheet = workbook.Sheets['Nodes'];
  const nodesData = XLSX.utils.sheet_to_json(nodesSheet);
  console.log('Nodes count in Excel:', nodesData.length);
  
  const blocksSheet = workbook.Sheets['RouteBlocks'];
  const blocksData = XLSX.utils.sheet_to_json(blocksSheet);
  console.log('RouteBlocks count in Excel:', blocksData.length);
  
  const fareSheet = workbook.Sheets['FareMatrix'];
  const fareData = XLSX.utils.sheet_to_json(fareSheet);
  console.log('FareMatrix count in Excel:', fareData.length);

  // Analyze route names
  const routes = new Set();
  blocksData.forEach(row => {
    if (row.route_name) {
      routes.add(row.route_name);
    }
  });
  console.log('Distinct route names in Excel:', routes.size);

  // Count transfer-capable nodes in Excel
  const nodeRoutes = {};
  blocksData.forEach(row => {
    const route = row.route_name;
    if (!route || route.toLowerCase().includes('walk') || route.toLowerCase() === 'just walk') {
      return;
    }
    const s = row.source_node_id;
    const t = row.target_node_id;
    
    if (!nodeRoutes[s]) nodeRoutes[s] = new Set();
    if (!nodeRoutes[t]) nodeRoutes[t] = new Set();
    
    nodeRoutes[s].add(route);
    nodeRoutes[t].add(route);
  });

  let transferNodesCount = 0;
  const transferNodes = [];
  nodesData.forEach(n => {
    const sId = n.id;
    const routesSet = nodeRoutes[sId];
    if (routesSet && routesSet.size >= 2) {
      transferNodesCount++;
      transferNodes.push({
        id: sId,
        name: n.name,
        count: routesSet.size,
        routes: Array.from(routesSet)
      });
    }
  });

  console.log('Transfer Capable Nodes in Excel (served by >= 2 distinct vehicle routes):', transferNodesCount);
  console.log('Transfer nodes details:');
  transferNodes.forEach(tn => {
    console.log(`- ${tn.name} (${tn.id}): served by ${tn.count} routes [${tn.routes.join(', ')}]`);
  });
}

main();
