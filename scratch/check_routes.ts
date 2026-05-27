import { query } from '../src/lib/mysql';

async function checkRoutes() {
  const routes = await query<any[]>('SELECT * FROM routes');
  console.log('--- Routes in DB ---');
  routes.forEach(r => {
    console.log(r);
  });
  process.exit(0);
}

checkRoutes().catch(console.error);
