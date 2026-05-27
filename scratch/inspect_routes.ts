import { query } from '../src/lib/mysql';

async function run() {
  const routes = await query<any[]>('SELECT * FROM routes');
  console.log('--- ALL ROUTES IN DB ---');
  routes.forEach(r => {
    console.log(`Route: ${r.name} | color: ${r.color}`);
  });
  process.exit(0);
}

run().catch(console.error);
