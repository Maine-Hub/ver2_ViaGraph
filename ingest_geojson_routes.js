const mysql = require('mysql2/promise');
const fs = require('fs');

async function ingestRoutes() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'viagraph_experiment'
  });

  console.log('Connected to database: viagraph_experiment');

  // 1. Ensure columns exist in route_blocks
  console.log('Ensuring schema is up to date...');
  await connection.execute(`ALTER TABLE route_blocks ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'jeepney'`);
  await connection.execute(`ALTER TABLE route_blocks ADD COLUMN IF NOT EXISTS discounted_fare DECIMAL(10,2)`);
  await connection.execute(`ALTER TABLE route_blocks ADD COLUMN IF NOT EXISTS stop_and_transfer TEXT`);

  // 2. Clear existing routes if needed (Optional: maybe just truncate for clean state as requested in previous turn's logic)
  // The user said "let's implement it" after seeing the 302 blocks. 
  // To avoid confusion, I'll clear the table and insert the official ones.
  console.log('Clearing existing route_blocks...');
  await connection.execute('TRUNCATE TABLE route_blocks');

  // 3. Load preview data
  const data = JSON.parse(fs.readFileSync('excel_geojson_route_blocks_preview.json', 'utf8'));
  const validRoutes = data.filter(r => r.ready_for_insert);

  console.log(`Inserting ${validRoutes.length} route blocks...`);

  const query = `
    INSERT INTO route_blocks 
    (id, source_id, target_id, route_name, distance, regular_fare, discounted_fare, vehicle_type, path_coordinates, stop_and_transfer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  let count = 0;
  for (const route of validRoutes) {
    const id = `${route.source_id}-${route.target_id}-${route.route_name.replace(/\s+/g, '-')}-${count++}`;
    await connection.execute(query, [
      id,
      route.source_id,
      route.target_id,
      route.route_name,
      route.distance,
      route.regular_fare,
      route.discounted_fare,
      route.vehicle_type,
      route.path_coordinates,
      route.stop_and_transfer
    ]);
  }

  console.log('Ingestion completed successfully.');
  await connection.end();
}

ingestRoutes().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
