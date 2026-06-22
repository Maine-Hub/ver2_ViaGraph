import pool from '../src/lib/mysql';

async function main() {
  try {
    // We only query active, non-archived, non-walking blocks belonging to active routes
    const [blocks]: any = await pool.query(`
      SELECT source_id, target_id, route_name 
      FROM route_blocks 
      WHERE is_archived = 0 AND is_history = 0
    `);
    
    // Group blocks by route name to see which ones are present
    const routeBlockCounts: Record<string, number> = {};
    const nodeRoutes: Record<string, Set<string>> = {};
    
    blocks.forEach((b: any) => {
      const r = b.route_name;
      if (!r || r.toLowerCase().includes('walk') || r.toLowerCase() === 'just walk') return;
      
      routeBlockCounts[r] = (routeBlockCounts[r] || 0) + 1;
      
      if (!nodeRoutes[b.source_id]) nodeRoutes[b.source_id] = new Set();
      if (!nodeRoutes[b.target_id]) nodeRoutes[b.target_id] = new Set();
      
      nodeRoutes[b.source_id].add(r);
      nodeRoutes[b.target_id].add(r);
    });

    console.log("=== Active Routes and Block Counts in DB ===");
    let totalBlocks = 0;
    Object.keys(routeBlockCounts).forEach(r => {
      console.log(`- ${r}: ${routeBlockCounts[r]} blocks`);
      totalBlocks += routeBlockCounts[r];
    });
    console.log("Total Vehicle Route Blocks in DB:", totalBlocks);

    // Filter nodes that are transfer-capable (served by >= 2 distinct vehicle routes)
    let transferNodesCount = 0;
    const transferNodes: any[] = [];
    
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

    console.log("\nTotal Transfer Capable Nodes (served by >= 2 distinct routes):", transferNodesCount);
    console.log("Details:");
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
