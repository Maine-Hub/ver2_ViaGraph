import { findShortestPath } from '../src/lib/routing';

async function run() {
  const result = await findShortestPath('gaisano-mall', 'anahaw-amphitheater');
  if (result) {
    console.log("RECOMMENDED PATH:");
    result.path.forEach((leg, i) => {
      console.log(`Leg ${i+1}: ${leg.source_id} -> ${leg.target_id} via ${leg.route_name} (${leg.distance} km)`);
      try {
        const coords = JSON.parse(leg.path_coordinates);
        console.log(`  Coordinates type: ${typeof coords}, isArray: ${Array.isArray(coords)}`);
        if (coords && typeof coords === 'object') {
          console.log(`  Riding Coords length: ${coords.ridingCoords?.length || 0}`);
          console.log(`  Walking Coords length: ${coords.walkingCoords?.length || 0}`);
          console.log(`  ridingDist: ${coords.ridingDist}, walkingDist: ${coords.walkingDist}`);
        }
      } catch (e) {
        console.log(`  Coordinates (raw string length): ${leg.path_coordinates?.length || 0}`);
      }
    });
    console.log(`Total distance: ${result.totalDistance} km, Total fare: ${result.totalFare}`);
  } else {
    console.log("No route found!");
  }
  process.exit(0);
}
run();
