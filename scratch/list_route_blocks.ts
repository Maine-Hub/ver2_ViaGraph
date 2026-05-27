import pool from '../src/lib/mysql';

async function listRouteBlocks() {
  try {
    const [blocks]: any = await pool.query(
      "SELECT id, source_id, target_id, route_name, vehicle_type, distance, regular_fare, discounted_fare, note FROM route_blocks ORDER BY route_name, id"
    );
    console.log(JSON.stringify(blocks, null, 2));
  } catch (err: any) {
    console.error("Error listing route blocks:", err);
  } finally {
    process.exit(0);
  }
}

listRouteBlocks();
