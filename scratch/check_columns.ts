import { query } from '../src/lib/mysql';

async function run() {
  const columns = await query<any[]>('DESCRIBE route_blocks');
  console.log('--- route_blocks columns ---');
  columns.forEach(c => console.log(`${c.Field}: ${c.Type}`));
  process.exit(0);
}
run().catch(console.error);
