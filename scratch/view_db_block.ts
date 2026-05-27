import { query } from '../src/lib/mysql';

async function main() {
  const rows = await query<any[]>("SELECT * FROM route_blocks WHERE source_id='unicity' AND target_id='anahaw-amphitheater'");
  console.log("Raw DB Rows found:", rows.length);
  rows.forEach((row, idx) => {
    console.log(`\nRow ${idx+1}:`);
    console.log(`  id: ${row.id}`);
    console.log(`  route_name: ${row.route_name}`);
    console.log(`  distance: ${row.distance}`);
    console.log(`  path_coordinates: ${row.path_coordinates}`);
  });
  process.exit(0);
}

main().catch(console.error);
