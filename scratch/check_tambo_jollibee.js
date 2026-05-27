const mysql = require('mysql2/promise');
async function check() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'viagraph_experiment'
  });
  const [rows] = await db.execute('SELECT source_id, target_id, route_name, SUBSTRING(path_coordinates, LENGTH(path_coordinates)-200) as coords_end FROM route_blocks WHERE source_id = ? AND target_id = ?', ['tambo-terminal', 'v-jollibee-aguinaldo']);
  console.log(JSON.stringify(rows, null, 2));
  await db.end();
}
check();
