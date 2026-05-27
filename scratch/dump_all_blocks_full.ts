import { query } from '../src/lib/mysql';

async function main() {
  const blocks = await query<any[]>("SELECT * FROM route_blocks");
  console.log(`Total Route Blocks: ${blocks.length}`);
  blocks.forEach(b => {
    let ridingLen = 0;
    let walkingLen = 0;
    let walkingDist = 0;
    if (b.path_coordinates) {
      try {
        const parsed = JSON.parse(b.path_coordinates);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          ridingLen = parsed.ridingCoords?.length || 0;
          walkingLen = parsed.walkingCoords?.length || 0;
          walkingDist = parsed.walkingDist || 0;
        } else if (Array.isArray(parsed)) {
          ridingLen = parsed.length;
        }
      } catch (e) {}
    }
    console.log(`ID ${b.id.toString().padEnd(3)}: [${b.route_name.padEnd(20)}] ${b.source_id.padEnd(25)} -> ${b.target_id.padEnd(25)} | Dist: ${b.distance.toString().padEnd(5)} | Riding Coords: ${ridingLen.toString().padEnd(3)} | Walking Coords: ${walkingLen.toString().padEnd(3)} | Walking Dist: ${walkingDist}`);
  });
  process.exit(0);
}

main().catch(console.error);
