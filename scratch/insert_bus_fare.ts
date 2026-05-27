import pool from '../src/lib/mysql';

async function insertBusFare() {
  try {
    console.log("Checking if 'bus' exists in fare_matrix...");
    const [rows]: any = await pool.query("SELECT id FROM fare_matrix WHERE vehicle_type = 'bus'");
    if (rows && rows.length > 0) {
      console.log("'bus' already exists in fare_matrix.");
    } else {
      console.log("Inserting default 'bus' fare rule...");
      await pool.query(
        "INSERT INTO fare_matrix (vehicle_type, base_fare, base_km, succeeding_km_rate, discount_rate) VALUES (?, ?, ?, ?, ?)",
        ['bus', 15.00, 4.00, 2.20, 0.20]
      );
      console.log("Successfully inserted default 'bus' fare rule!");
    }
  } catch (err: any) {
    console.error("Error inserting bus fare:", err);
  } finally {
    process.exit(0);
  }
}

insertBusFare();
