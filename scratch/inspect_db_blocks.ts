import { query } from '../src/lib/mysql';

async function inspect() {
  const blocks = await query<any[]>('SELECT * FROM route_blocks');
  console.log('--- ALL ROUTE BLOCKS IN DB ---');
  blocks.forEach(b => {
    console.log(`ID: ${b.id}`);
    console.log(`  Source: ${b.source_id}`);
    console.log(`  Target: ${b.target_id}`);
    console.log(`  Route: ${b.route_name}`);
    console.log(`  Distance: ${b.distance}`);
    console.log(`  Fare: ${b.regular_fare}`);
    if (b.path_coordinates) {
      try {
        const parsed = JSON.parse(b.path_coordinates);
        if (Array.isArray(parsed)) {
          console.log(`  Path Coordinates: Legacy Array (${parsed.length} points)`);
        } else {
          console.log(`  Path Coordinates: Object`);
          console.log(`    ridingCoords length: ${parsed.ridingCoords?.length || 0}`);
          console.log(`    walkingCoords length: ${parsed.walkingCoords?.length || 0}`);
          console.log(`    ridingDist: ${parsed.ridingDist}`);
          console.log(`    walkingDist: ${parsed.walkingDist}`);
        }
      } catch (e) {
        console.log(`  Path Coordinates: Invalid JSON / Raw (${b.path_coordinates.length} chars)`);
      }
    } else {
      console.log(`  Path Coordinates: NULL/Empty`);
    }
    console.log('----------------------------');
  });
  process.exit(0);
}
inspect();
