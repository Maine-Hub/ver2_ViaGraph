import { query } from '../src/lib/mysql';

async function checkBlock44() {
  try {
    const blocks = await query<any[]>("SELECT id, source_id, target_id, route_name, distance, path_coordinates FROM route_blocks WHERE id = 44");
    if (blocks.length > 0) {
      const b = blocks[0];
      console.log(`Block ID: ${b.id}`);
      console.log(`Source: ${b.source_id}`);
      console.log(`Target: ${b.target_id}`);
      console.log(`Route Name: ${b.route_name}`);
      console.log(`Distance: ${b.distance} km`);
      const parsed = JSON.parse(b.path_coordinates);
      console.log(`Riding Dist: ${parsed.ridingDist}`);
      console.log(`Walking Dist: ${parsed.walkingDist}`);
      console.log(`Riding Coords Count: ${parsed.ridingCoords?.length}`);
      console.log(`Walking Coords Count: ${parsed.walkingCoords?.length}`);
      console.log(`Walking Coords:`, parsed.walkingCoords);
    } else {
      console.log('Block 44 not found.');
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
  process.exit(0);
}

checkBlock44();
