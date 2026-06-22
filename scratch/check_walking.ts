import { query } from '../src/lib/mysql';

async function checkWalking() {
  try {
    const blocks = await query<any[]>('SELECT id, source_id, target_id, route_name, distance, path_coordinates FROM route_blocks');
    console.log(`Checking ${blocks.length} route blocks for walking coordinates...`);
    
    blocks.forEach(b => {
      let hasWalking = false;
      let walkDist = 0;
      let ridingDist = 0;
      try {
        if (b.path_coordinates) {
          const parsed = JSON.parse(b.path_coordinates);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            walkDist = parsed.walkingDist || 0;
            ridingDist = parsed.ridingDist || 0;
            if (walkDist > 0) {
              hasWalking = true;
            }
          }
        }
      } catch (e) {}

      if (hasWalking || b.route_name.toLowerCase().includes('walk')) {
        console.log(`\nBlock ID: ${b.id}`);
        console.log(`- Source: ${b.source_id}`);
        console.log(`- Target: ${b.target_id}`);
        console.log(`- Route Name: ${b.route_name}`);
        console.log(`- Total Distance: ${b.distance} km`);
        console.log(`- Stored Riding Dist: ${ridingDist} km`);
        console.log(`- Stored Walking Dist: ${walkDist} km`);
      }
    });
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
  process.exit(0);
}

checkWalking();
