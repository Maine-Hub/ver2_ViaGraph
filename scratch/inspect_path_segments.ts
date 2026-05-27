import { findRouteAction } from '../src/lib/actions';

async function run() {
  const formData = new FormData();
  formData.append('startLocation', 'gaisano-mall');
  formData.append('endLocation', 'anahaw-amphitheater');

  const actionResult = await findRouteAction({ message: '' }, formData);
  const path = actionResult.result?.path;
  
  if (!path) {
    console.log('No path found');
    process.exit(1);
  }

  path.forEach((segment: any, index: number) => {
    console.log(`Segment ${index + 1} (${segment.routeName}):`);
    console.log(`  from: ${segment.from} -> to: ${segment.to}`);
    if (segment.pathCoordinates) {
      const hasWalking = segment.pathCoordinates.walkingDist > 0;
      console.log(`  hasWalking: ${hasWalking}`);
      console.log(`  walkingCoords length: ${segment.pathCoordinates.walkingCoords?.length}`);
      console.log(`  ridingCoords length: ${segment.pathCoordinates.ridingCoords?.length}`);
    }
  });
  process.exit(0);
}

run().catch(console.error);
