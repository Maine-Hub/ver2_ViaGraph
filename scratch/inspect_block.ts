import { query } from '../src/lib/mysql';

async function inspect() {
  const blocks = await query<any[]>('SELECT * FROM route_blocks');
  console.log('--- ALL BLOCKS IN DB ---');
  blocks.forEach(b => {
    console.log(`ID: ${b.id} | ${b.route_name} | ${b.source_id} -> ${b.target_id} | vehicle: ${b.vehicle_type} | distance: ${b.distance}`);
    if (b.path_coordinates) {
      try {
        const parsed = JSON.parse(b.path_coordinates);
        console.log('  path_coordinates keys:', Object.keys(parsed));
        if (parsed.ridingCoords) console.log('    ridingCoords len:', parsed.ridingCoords.length);
        if (parsed.walkingCoords) console.log('    walkingCoords len:', parsed.walkingCoords.length);
      } catch {
        console.log('  path_coordinates is not JSON:', b.path_coordinates.substring(0, 100));
      }
    } else {
      console.log('  path_coordinates is NULL');
    }
  });
  process.exit(0);
}

inspect().catch(console.error);
