import { query } from '../src/lib/mysql';

async function main() {
  const rows = await query<any[]>("SELECT * FROM route_blocks WHERE route_name LIKE '%walk%' OR vehicle_type='walking'");
  console.log("Walking DB Rows found:", rows.length);
  rows.forEach((row, idx) => {
    console.log(`\nRow ${idx+1}:`);
    console.log(`  id: ${row.id}`);
    console.log(`  source_id: ${row.source_id}`);
    console.log(`  target_id: ${row.target_id}`);
    console.log(`  route_name: ${row.route_name}`);
    console.log(`  vehicle_type: ${row.vehicle_type}`);
    console.log(`  distance: ${row.distance}`);
  });
  process.exit(0);
}

main().catch(console.error);
