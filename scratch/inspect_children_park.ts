import { query } from '../src/lib/mysql';

async function check() {
  const nodes = await query<any[]>('SELECT * FROM nodes WHERE id LIKE "%children%" OR id LIKE "%cathedral%"');
  console.log('--- Matching Nodes ---');
  console.log(JSON.stringify(nodes, null, 2));

  const blocks = await query<any[]>(`
    SELECT rb.id, rb.source_id, rb.target_id, rb.route_name, rb.vehicle_type, rb.distance, rb.path_coordinates
    FROM route_blocks rb
    WHERE rb.source_id LIKE "%children%" OR rb.target_id LIKE "%children%" 
       OR rb.source_id LIKE "%cathedral%" OR rb.target_id LIKE "%cathedral%"
  `);
  console.log('\n--- Matching Route Blocks ---');
  blocks.forEach(b => {
    console.log(`ID: ${b.id}`);
    console.log(`  Source: ${b.source_id}`);
    console.log(`  Target: ${b.target_id}`);
    console.log(`  Route: ${b.route_name}`);
    console.log(`  Vehicle: ${b.vehicle_type}`);
    console.log(`  Distance: ${b.distance}`);
    try {
      const pc = JSON.parse(b.path_coordinates);
      if (Array.isArray(pc)) {
        console.log(`  Path Coords: Array (${pc.length} points)`);
        if (pc.length > 0) {
          console.log(`    First: ${JSON.stringify(pc[0])}, Last: ${JSON.stringify(pc[pc.length - 1])}`);
        }
      } else {
        console.log(`  Path Coords: Object`);
        console.log(`    ridingCoords length: ${pc.ridingCoords?.length || 0}`);
        console.log(`    walkingCoords length: ${pc.walkingCoords?.length || 0}`);
        if (pc.ridingCoords?.length > 0) {
          console.log(`    First Riding: ${JSON.stringify(pc.ridingCoords[0])}, Last: ${JSON.stringify(pc.ridingCoords[pc.ridingCoords.length - 1])}`);
        }
        if (pc.walkingCoords?.length > 0) {
          console.log(`    First Walking: ${JSON.stringify(pc.walkingCoords[0])}, Last: ${JSON.stringify(pc.walkingCoords[pc.walkingCoords.length - 1])}`);
        }
      }
    } catch {
      console.log(`  Path Coords: Invalid/String (${b.path_coordinates?.length || 0} chars)`);
    }
    console.log('------------------');
  });
  process.exit(0);
}
check().catch(console.error);
