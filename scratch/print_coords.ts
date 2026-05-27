import { query } from '../src/lib/mysql';

async function main() {
  const blocks = await query<any[]>('SELECT id, source_id, target_id, route_name, path_coordinates FROM route_blocks WHERE id IN (5, 13, 14)');
  for (const b of blocks) {
    console.log(`\nID: ${b.id} | ${b.source_id} -> ${b.target_id}`);
    console.log('Raw coordinates length:', b.path_coordinates ? b.path_coordinates.length : 0);
    try {
      const parsed = JSON.parse(b.path_coordinates);
      console.log('Is Array?', Array.isArray(parsed));
      if (Array.isArray(parsed)) {
        console.log('First 3 coordinates:', parsed.slice(0, 3));
        console.log('Last 3 coordinates:', parsed.slice(-3));
      } else {
        console.log('Keys of parsed object:', Object.keys(parsed));
        console.log('ridingCoords length:', parsed.ridingCoords?.length);
        console.log('walkingCoords length:', parsed.walkingCoords?.length);
      }
    } catch (e: any) {
      console.error('Error parsing:', e.message);
    }
  }
  process.exit(0);
}

main().catch(console.error);
