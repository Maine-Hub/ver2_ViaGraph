import { query } from '../src/lib/mysql';

async function main() {
  const blocks = await query<any[]>('SELECT id, source_id, target_id, path_coordinates FROM route_blocks WHERE id = 12');
  if (blocks.length > 0) {
    const b = blocks[0];
    console.log(`ID: ${b.id} | ${b.source_id} -> ${b.target_id}`);
    console.log('Raw coordinates length:', b.path_coordinates ? b.path_coordinates.length : 0);
    console.log('Raw coordinates:', b.path_coordinates);
  } else {
    console.log('Block ID 12 not found.');
  }
  process.exit(0);
}

main().catch(console.error);
