import { findShortestPath } from '../src/lib/routing';
import { findRouteAction } from '../src/lib/actions';

async function run() {
  console.log('--- FINDING SHORTEST PATH ---');
  const rawResult = await findShortestPath('gaisano-mall', 'anahaw-amphitheater');
  console.log('Raw Result path length:', rawResult?.path.length);
  rawResult?.path.forEach((b, idx) => {
    console.log(`Leg ${idx + 1}: ${b.source_id} -> ${b.target_id} via ${b.route_name}`);
  });

  console.log('\n--- RUNNING SERVER ACTION ---');
  const formData = new FormData();
  formData.append('startLocation', 'gaisano-mall');
  formData.append('endLocation', 'anahaw-amphitheater');

  const actionResult = await findRouteAction({ message: '' }, formData);
  if (actionResult.result) {
    const path = actionResult.result.path;
    console.log('Action Result path segments:', path.length);
    path.forEach((seg, idx) => {
      console.log(`Segment ${idx + 1}:`);
      console.log(`  from: ${seg.from} | to: ${seg.to}`);
      console.log(`  routeName: ${seg.routeName}`);
      console.log(`  distance: ${seg.distance}`);
      console.log(`  regularFare: ${seg.regularFare}`);
      if (seg.pathCoordinates) {
        console.log(`  ridingCoords count: ${seg.pathCoordinates.ridingCoords?.length}`);
        console.log(`  walkingCoords count: ${seg.pathCoordinates.walkingCoords?.length}`);
        console.log(`  ridingDist: ${seg.pathCoordinates.ridingDist}`);
        console.log(`  walkingDist: ${seg.pathCoordinates.walkingDist}`);
      } else {
        console.log(`  pathCoordinates is NULL`);
      }
    });
  } else {
    console.log('Action Result failed:', actionResult.message);
  }
  process.exit(0);
}

run().catch(console.error);
