import { query } from './src/lib/mysql';
import * as fs from 'fs';

async function dump() {
  try {
    const nodes = await query('SELECT * FROM nodes');
    const edges = await query('SELECT id, source, target, distance, route_name FROM edges');
    const routes = await query('SELECT * FROM routes');

    const result = {
      nodes,
      edges,
      routes
    };

    fs.writeFileSync('db_dump.json', JSON.stringify(result, null, 2));
    console.log('Dumped to db_dump.json');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

dump();
