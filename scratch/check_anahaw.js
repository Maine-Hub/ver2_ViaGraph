const mysql = require('mysql2/promise');
async function check() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'viagraph_experiment'
  });
  const [rows] = await db.execute('SELECT source_id, target_id, route_name, SUBSTRING(path_coordinates, 1, 100) as coords_start FROM route_blocks WHERE target_id = ?', ['anahaw-amphitheater']);
  console.log(JSON.stringify(rows, null, 2));
  await db.end();
}
check();
