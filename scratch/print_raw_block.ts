import { query } from '../src/lib/mysql';

async function run() {
  const blocks = await query<any[]>('SELECT path_coordinates FROM route_blocks WHERE id = 14');
  if (blocks.length > 0) {
    console.log('Raw path_coordinates of Block 14:');
    console.log(blocks[0].path_coordinates);
  } else {
    console.log('Block 14 not found');
  }
  process.exit(0);
}

run().catch(console.error);
