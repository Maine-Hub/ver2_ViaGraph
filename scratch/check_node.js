const mysql = require('mysql2/promise');
async function check() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'viagraph_experiment'
  });
  const [rows] = await db.execute('SELECT id, name, latitude, longitude FROM nodes WHERE id IN (?, ?, ?)', ['anahaw-amphitheater', 'v-crown-paper', 'v-jollibee-aguinaldo']);
  console.log(JSON.stringify(rows, null, 2));
  await db.end();
}
check();
