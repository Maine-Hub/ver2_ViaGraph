import { query } from './src/lib/mysql';

async function setup() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS route_blocks (
        id VARCHAR(300) PRIMARY KEY,
        source_id VARCHAR(100) NOT NULL,
        target_id VARCHAR(100) NOT NULL,
        route_name VARCHAR(255) NOT NULL,
        distance DOUBLE NOT NULL,
        regular_fare DECIMAL(10,2),
        path_coordinates LONGTEXT,
        block_order INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table route_blocks created successfully.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

setup();
