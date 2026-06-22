import pool from '../src/lib/mysql';

async function main() {
  try {
    const [blocks]: any = await pool.query(`
      SELECT source_id, target_id 
      FROM route_blocks 
      WHERE is_archived = 0 AND is_history = 0
    `);

    const sources = new Set<string>();
    const targets = new Set<string>();

    blocks.forEach((b: any) => {
      sources.add(b.source_id);
      targets.add(b.target_id);
    });

    const overlap: string[] = [];
    sources.forEach(s => {
      if (targets.has(s)) {
        overlap.push(s);
      }
    });

    console.log("Sources count:", sources.size);
    console.log("Targets count:", targets.size);
    console.log("Nodes appearing as BOTH source and target count:", overlap.length);
    console.log("\nList of overlapping nodes:");
    
    const [nodes]: any = await pool.query("SELECT id, name FROM nodes");
    const nameMap: Record<string, string> = {};
    nodes.forEach((n: any) => nameMap[n.id] = n.name);

    overlap.forEach(id => {
      console.log(`- ${nameMap[id] || id} (${id})`);
    });

  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
