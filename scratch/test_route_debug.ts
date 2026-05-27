import { findShortestPath } from '../src/lib/routing';

async function testRoute() {
  const result = await findShortestPath('gaisano-mall', 'anahaw-amphitheater');
  if (!result) {
    console.log('No route found');
    process.exit(0);
  }
  console.log('--- Shortest Route Found ---');
  console.log(`Total Distance: ${result.totalDistance} km`);
  console.log(`Total Fare: ${result.totalFare}`);
  console.log(`Ride Count: ${result.rideCount}`);
  
  result.path.forEach((seg, i) => {
    console.log(`\nSegment ${i + 1}:`);
    console.log(`  From: ${seg.source_id}`);
    console.log(`  To: ${seg.target_id}`);
    console.log(`  Route: ${seg.route_name}`);
    console.log(`  Distance: ${seg.distance}`);
    console.log(`  Fare: ${seg.regular_fare}`);
    console.log(`  Coords (trimmed): ${seg.path_coordinates ? seg.path_coordinates.substring(0, 100) + '...' : 'null'}`);
    if (seg.path_coordinates) {
      try {
        const parsed = JSON.parse(seg.path_coordinates);
        console.log(`  Parsed keys:`, Object.keys(parsed));
        if (parsed.ridingCoords) console.log(`  ridingCoords length: ${parsed.ridingCoords.length}`);
        if (parsed.walkingCoords) console.log(`  walkingCoords length: ${parsed.walkingCoords.length}`);
        console.log(`  ridingDist: ${parsed.ridingDist}, walkingDist: ${parsed.walkingDist}`);
      } catch (e) {
        console.log('  Not valid JSON or legacy format');
      }
    }
  });
  process.exit(0);
}

testRoute().catch(console.error);
