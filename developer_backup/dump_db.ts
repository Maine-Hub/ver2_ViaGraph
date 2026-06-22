import { query } from './src/lib/mysql';

async function dump() {
  try {
    const nodes = await query('SELECT * FROM nodes LIMIT 20');
    console.log('--- NODES ---');
    console.table(nodes);

    const edges = await query('SELECT id, source, target, distance, route_name FROM edges LIMIT 20');
    console.log('--- EDGES ---');
    console.table(edges);

    const routes = await query('SELECT * FROM routes');
    console.log('--- ROUTES ---');
    console.table(routes);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

dump();
