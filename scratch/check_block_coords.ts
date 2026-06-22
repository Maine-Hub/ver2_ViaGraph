import { query } from '../src/lib/mysql';

async function checkBlockCoords() {
  try {
    const blocks = await query<any[]>("SELECT id, source_id, target_id, route_name, distance, path_coordinates FROM route_blocks WHERE source_id = 'msu-iit' OR target_id = 'gaisano-mall'");
    console.log(`Found ${blocks.length} blocks:`);
    blocks.forEach(b => {
      console.log(`\nID: ${b.id}`);
      console.log(`Source: ${b.source_id}`);
      console.log(`Target: ${b.target_id}`);
      console.log(`Route Name: ${b.route_name}`);
      console.log(`Distance: ${b.distance} km`);
      if (b.path_coordinates) {
        console.log(`Path Coordinates (first 100 chars): ${b.path_coordinates.substring(0, 100)}...`);
        try {
          const parsed = JSON.parse(b.path_coordinates);
          console.log(`Parsed type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`);
          if (!Array.isArray(parsed)) {
            console.log(`Keys: ${Object.keys(parsed).join(', ')}`);
          }
        } catch (e) {
          console.log(`JSON parse error: ${e.message}`);
        }
      } else {
        console.log(`Path Coordinates is NULL`);
      }
    });
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
  process.exit(0);
}

checkBlockCoords();
