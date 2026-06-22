import { findShortestPath, findRawDijkstraPath } from '../src/lib/routing';
import { query } from '../src/lib/mysql';

async function runComparison() {
  const nodes = await query<any[]>('SELECT id FROM nodes');
  const nodeIds = nodes.map(n => n.id);

  console.log(`Searching through ${nodeIds.length} nodes (${nodeIds.length * nodeIds.length} pairs) for differences...`);
  
  let foundDiff = 0;

  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = 0; j < nodeIds.length; j++) {
      if (i === j) continue;
      const from = nodeIds[i];
      const to = nodeIds[j];

      try {
        const rec = await findShortestPath(from, to);
        const raw = await findRawDijkstraPath(from, to);

        if (rec && raw) {
          const recPathStr = rec.path.map(b => b.id).join('->');
          const rawPathStr = raw.path.map(b => b.id).join('->');

          if (recPathStr !== rawPathStr) {
            foundDiff++;
            console.log(`\n========================================`);
            console.log(`Difference #${foundDiff}: ${from} -> ${to}`);
            console.log(`========================================`);
            
            console.log(`[RECOMMENDED ROUTE]`);
            console.log(`- Distance: ${rec.totalDistance.toFixed(3)} km`);
            console.log(`- Ride Count: ${rec.rideCount}`);
            rec.path.forEach((b, idx) => {
              console.log(`  Leg ${idx + 1}: ${b.source_id} -> ${b.target_id} via ${b.route_name}`);
            });

            console.log(`[RAW DIJKSTRA ROUTE]`);
            console.log(`- Distance: ${raw.totalDistance.toFixed(3)} km`);
            raw.path.forEach((b, idx) => {
              console.log(`  Leg ${idx + 1}: ${b.source_id} -> ${b.target_id} via ${b.route_name}`);
            });
            
            if (foundDiff >= 5) {
              console.log('\nFound 5 differences. Exiting.');
              process.exit(0);
            }
          }
        }
      } catch (err) {
        // ignore errors
      }
    }
  }

  if (foundDiff === 0) {
    console.log('No differences found in the entire network graph.');
  }
  process.exit(0);
}

runComparison();
