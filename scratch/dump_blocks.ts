import { query } from '../src/lib/mysql';

async function main() {
  const blocks = await query<any[]>('SELECT id, source_id, target_id, route_name, distance, regular_fare, path_coordinates FROM route_blocks');
  console.log('--- ROUTE BLOCKS IN DB ---');
  for (const b of blocks) {
    let coordsCount = 0;
    try {
      if (b.path_coordinates) {
        const parsed = JSON.parse(b.path_coordinates);
        if (Array.isArray(parsed)) {
          coordsCount = parsed.length;
        } else if (parsed && typeof parsed === 'object') {
          coordsCount = (parsed.ridingCoords?.length || 0) + (parsed.walkingCoords?.length || 0);
        }
      }
    } catch (e) {
      console.log(`Failed to parse coordinates for block ${b.id}`);
    }
    console.log(`ID: ${b.id} | Route: ${b.route_name} | ${b.source_id} -> ${b.target_id} | Dist: ${b.distance} km | Fare: ${b.regular_fare} | Coords: ${coordsCount}`);
  }
  process.exit(0);
}

main().catch(console.error);
