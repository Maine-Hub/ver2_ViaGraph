import { query } from '../src/lib/mysql';

async function main() {
  const rows = await query<any[]>("SELECT * FROM route_blocks");
  let count = 0;
  rows.forEach((row) => {
    if (row.path_coordinates) {
      try {
        const parsed = JSON.parse(row.path_coordinates);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          if (parsed.walkingDist > 0 || (parsed.walkingCoords && parsed.walkingCoords.length > 0)) {
            console.log(`Found block with walking coords: ${row.id} (${row.source_id} -> ${row.target_id} via ${row.route_name})`);
            console.log(`  walkingDist: ${parsed.walkingDist}`);
            console.log(`  walkingCoords len: ${parsed.walkingCoords?.length || 0}`);
            count++;
          }
        }
      } catch (e) {}
    }
  });
  console.log(`Total blocks with walking coords/dist: ${count}`);
  process.exit(0);
}

main().catch(console.error);
