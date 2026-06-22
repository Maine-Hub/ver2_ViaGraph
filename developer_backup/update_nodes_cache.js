const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateCache() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'viagraph_experiment'
  });
  const [rows] = await db.execute('SELECT id, name, latitude, longitude FROM nodes');
  const cache = rows.map(r => ({
    id: r.id,
    name: r.name,
    coordinates: {
      latitude: r.latitude,
      longitude: r.longitude
    }
  }));
  fs.writeFileSync('nodes_cache.json', JSON.stringify(cache, null, 2));
  console.log(`Updated nodes_cache.json with ${cache.length} nodes.`);
  await db.end();
}
updateCache();
