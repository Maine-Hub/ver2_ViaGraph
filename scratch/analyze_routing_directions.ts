import pool from '../src/lib/mysql';

async function analyzeDirections() {
  try {
    const [nodes]: any = await pool.query("SELECT id, name FROM nodes");
    const nodeNameMap = new Map<string, string>();
    nodes.forEach((n: any) => nodeNameMap.set(n.id, n.name));

    const [blocks]: any = await pool.query(
      "SELECT id, source_id, target_id, route_name, vehicle_type, distance FROM route_blocks"
    );

    // Track existing edges
    const explicitEdges = new Set<string>();
    blocks.forEach((b: any) => {
      explicitEdges.add(`${b.source_id}->${b.target_id}->${b.route_name.toLowerCase().trim()}`);
    });

    const doubleTraced: any[] = [];
    const singleTraced: any[] = [];

    const processed = new Set<string>();

    blocks.forEach((b: any) => {
      const forwardKey = `${b.source_id}->${b.target_id}->${b.route_name.toLowerCase().trim()}`;
      const reverseKey = `${b.target_id}->${b.source_id}->${b.route_name.toLowerCase().trim()}`;

      if (processed.has(forwardKey)) return;

      const sourceName = nodeNameMap.get(b.source_id) || b.source_id;
      const targetName = nodeNameMap.get(b.target_id) || b.target_id;

      if (explicitEdges.has(reverseKey)) {
        doubleTraced.push({
          routeName: b.route_name,
          vehicleType: b.vehicle_type,
          nodeA: sourceName,
          nodeB: targetName,
          distance: b.distance
        });
        processed.add(forwardKey);
        processed.add(reverseKey);
      } else {
        singleTraced.push({
          routeName: b.route_name,
          vehicleType: b.vehicle_type,
          from: sourceName,
          to: targetName,
          distance: b.distance
        });
        processed.add(forwardKey);
      }
    });

    console.log("--- DOUBLE-TRACED SEGMENTS (Traced in both directions in DB) ---");
    console.log(JSON.stringify(doubleTraced, null, 2));

    console.log("\n--- SINGLE-TRACED SEGMENTS (Dijkstra generates the reverse at runtime) ---");
    console.log(JSON.stringify(singleTraced, null, 2));

  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

analyzeDirections();
