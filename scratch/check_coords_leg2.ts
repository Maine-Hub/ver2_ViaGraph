import { query } from '../src/lib/mysql';

// Distance between two coords in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

async function main() {
  const nodes = await query<any[]>("SELECT * FROM nodes");
  const block = (await query<any[]>("SELECT * FROM route_blocks WHERE source_id='unicity' AND target_id='anahaw-amphitheater'"))[0];
  
  if (!block) {
    console.log("Block not found.");
    process.exit(1);
  }

  const coords = JSON.parse(block.path_coordinates);
  const riding = coords.ridingCoords || [];
  const walking = coords.walkingCoords || [];

  console.log(`Riding Coords (${riding.length}):`);
  riding.forEach((c: [number, number], idx: number) => {
    let closestNode = null;
    let minDist = Infinity;
    nodes.forEach(n => {
      const dist = getDistance(c[0], c[1], Number(n.latitude), Number(n.longitude));
      if (dist < minDist) {
        minDist = dist;
        closestNode = n;
      }
    });
    if (minDist < 0.05) { // within 50 meters
      console.log(`  Point ${idx}: [${c[0]}, ${c[1]}] is near ${closestNode.id} (${closestNode.name}) - dist: ${(minDist * 1000).toFixed(1)}m`);
    }
  });

  console.log(`\nWalking Coords (${walking.length}):`);
  walking.forEach((c: [number, number], idx: number) => {
    let closestNode = null;
    let minDist = Infinity;
    nodes.forEach(n => {
      const dist = getDistance(c[0], c[1], Number(n.latitude), Number(n.longitude));
      if (dist < minDist) {
        minDist = dist;
        closestNode = n;
      }
    });
    if (minDist < 0.05) {
      console.log(`  Point ${idx}: [${c[0]}, ${c[1]}] is near ${closestNode.id} (${closestNode.name}) - dist: ${(minDist * 1000).toFixed(1)}m`);
    }
  });

  process.exit(0);
}

main().catch(console.error);
