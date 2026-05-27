import { query } from '../src/lib/mysql';

async function run() {
  const blocks = await query<any[]>('SELECT * FROM route_blocks WHERE id IN (13, 14)');
  blocks.forEach(b => {
    console.log(`ID: ${b.id} | ${b.route_name} | ${b.source_id} -> ${b.target_id}`);
    if (b.path_coordinates) {
      const parsed = JSON.parse(b.path_coordinates);
      console.log('  ridingCoords sample:', parsed.ridingCoords?.slice(0, 3));
      console.log('  walkingCoords sample:', parsed.walkingCoords?.slice(0, 3));
    }
  });
  process.exit(0);
}

run().catch(console.error);
