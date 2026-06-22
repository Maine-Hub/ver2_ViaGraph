import pool from '../src/lib/mysql';

async function main() {
  try {
    const [blocks]: any = await pool.query("SELECT source_id, target_id, route_name FROM route_blocks WHERE is_archived = 0");
    
    // Map each node ID to a set of distinct route names that serve it
    const nodeRoutes: Record<string, Set<string>> = {};
    
    blocks.forEach((b: any) => {
      const route = b.route_name;
      if (!route || route.toLowerCase().includes('walk') || route.toLowerCase() === 'just walk') {
        return; // skip walking
      }
      
      if (!nodeRoutes[b.source_id]) nodeRoutes[b.source_id] = new Set();
      if (!nodeRoutes[b.target_id]) nodeRoutes[b.target_id] = new Set();
      
      nodeRoutes[b.source_id].add(route);
      nodeRoutes[b.target_id].add(route);
    });

    let transferNodesCount = 0;
    const transferNodes: any[] = [];
    
    // Fetch node names
    const [nodes]: any = await pool.query("SELECT id, name FROM nodes");
    const nodeNameMap: Record<string, string> = {};
    nodes.forEach((n: any) => {
      nodeNameMap[n.id] = n.name;
    });

    for (const nodeId of Object.keys(nodeRoutes)) {
      const routesSet = nodeRoutes[nodeId];
      if (routesSet.size >= 2) {
        transferNodesCount++;
        transferNodes.push({
          id: nodeId,
          name: nodeNameMap[nodeId] || nodeId,
          routesCount: routesSet.size,
          routes: Array.from(routesSet)
        });
      }
    }

    console.log("Total Nodes served by distinct vehicle routes:", Object.keys(nodeRoutes).length);
    console.log("Total Transfer Capable Nodes (served by >= 2 distinct vehicle routes):", transferNodesCount);
    console.log("\nTransfer capable nodes list:");
    transferNodes.forEach(tn => {
      console.log(`- ${tn.name} (${tn.id}): served by ${tn.routesCount} routes [${tn.routes.join(', ')}]`);
    });

  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
