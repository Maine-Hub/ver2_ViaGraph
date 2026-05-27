import { query } from '../src/lib/mysql';

async function run() {
  const blocks = await query<any[]>("SELECT * FROM route_blocks WHERE route_name = 'Palao-City Proper' OR source_id = 'unicity' OR target_id = 'anahaw-amphitheater'");
  console.log('--- MATCHING BLOCKS ---');
  blocks.forEach(b => {
    console.log(`ID: ${b.id} | ${b.route_name} | ${b.source_id} -> ${b.target_id} | vehicle: ${b.vehicle_type} | distance: ${b.distance}`);
    if (b.path_coordinates) {
      try {
        const parsed = JSON.parse(b.path_coordinates);
        console.log('  ridingCoords len:', parsed.ridingCoords?.length);
        console.log('  walkingCoords len:', parsed.walkingCoords?.length);
        console.log('  ridingDist:', parsed.ridingDist);
        console.log('  walkingDist:', parsed.walkingDist);
      } catch {
        console.log('  not JSON');
      }
    }
  });
  process.exit(0);
}

run().catch(console.error);
