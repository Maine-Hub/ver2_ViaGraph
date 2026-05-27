const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'viagraph_experiment',
  });

  const [rows] = await pool.execute('SELECT * FROM fare_matrix');
  console.log('Fare Matrix:');
  rows.forEach(r => console.log(JSON.stringify(r, null, 2)));

  // Simulate calculation for 5.06 km
  console.log('\n--- Fare simulation for 5.060 km ---');
  rows.forEach(r => {
    const dist = 5.060;
    const base_fare = Number(r.base_fare);
    const base_km = Number(r.base_km);
    const rate = Number(r.succeeding_km_rate);
    const discount = Number(r.discount_rate);

    let rawFare = base_fare;
    if (dist > base_km) {
      rawFare += (dist - base_km) * rate;
    }
    const rounded = Math.round(rawFare / 0.25) * 0.25;
    console.log(`[${r.vehicle_type}] Base ₱${base_fare} for ${base_km}km + ₱${rate}/km after = Raw ₱${rawFare.toFixed(4)} → Rounded ₱${rounded}`);
  });

  await pool.end();
}

check().catch(console.error);
