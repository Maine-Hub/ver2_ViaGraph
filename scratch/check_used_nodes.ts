import pool from '../src/lib/mysql';

async function checkUsedNodes() {
  try {
    const [nodes]: any = await pool.query("SELECT id, name FROM nodes");
    const [blocks]: any = await pool.query("SELECT source_id, target_id FROM route_blocks");
    
    const usedIds = new Set<string>();
    blocks.forEach((b: any) => {
      usedIds.add(b.source_id);
      usedIds.add(b.target_id);
    });

    console.log("Total Nodes in DB:", nodes.length);
    console.log("Total Used Nodes in route_blocks:", usedIds.size);

    const unusedNodes = nodes.filter((n: any) => !usedIds.has(n.id));
    console.log("\n--- UNUSED NODES (not connected to any route block) ---");
    unusedNodes.forEach((n: any) => {
      console.log(`[${n.id}] ${n.name}`);
    });

    console.log("\n--- USED NODES ---");
    const usedNodes = nodes.filter((n: any) => usedIds.has(n.id));
    usedNodes.forEach((n: any) => {
      console.log(`[${n.id}] ${n.name}`);
    });

  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

checkUsedNodes();
