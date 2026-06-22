import pool from '../src/lib/mysql';

async function main() {
  try {
    const [vehicleCounts]: any = await pool.query(`
      SELECT vehicle_type, COUNT(*) as count 
      FROM route_blocks 
      WHERE is_archived = 0 
      GROUP BY vehicle_type
    `);
    
    console.log("=== Active Route Blocks by Vehicle Type ===");
    vehicleCounts.forEach((row: any) => {
      console.log(`${row.vehicle_type}: ${row.count}`);
    });
    
    const [totalBlocks]: any = await pool.query("SELECT COUNT(*) as count FROM route_blocks WHERE is_archived = 0");
    console.log("Total Active Route Blocks:", totalBlocks[0].count);

    const [totalNodes]: any = await pool.query("SELECT COUNT(*) as count FROM nodes WHERE is_archived = 0");
    console.log("Total Active Nodes:", totalNodes[0].count);

    const [totalRoutes]: any = await pool.query("SELECT COUNT(*) as count FROM routes WHERE is_archived = 0");
    console.log("Total Active Routes:", totalRoutes[0].count);

  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
