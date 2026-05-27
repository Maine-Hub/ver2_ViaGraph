const mysql = require('mysql2/promise');

async function checkSchema() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'viagraph_experiment'
  });
  
  const [nodes] = await db.execute('DESCRIBE nodes');
  console.log('--- NODES ---');
  console.table(nodes);

  const [routeBlocks] = await db.execute('DESCRIBE route_blocks');
  console.log('--- ROUTE_BLOCKS ---');
  console.table(routeBlocks);

  try {
      const [fareMatrix] = await db.execute('DESCRIBE fare_matrix');
      console.log('--- FARE_MATRIX ---');
      console.table(fareMatrix);
  } catch (e) {
      console.log('--- FARE_MATRIX ---');
      console.log('Table does not exist.');
  }

  await db.end();
}

checkSchema();
