import { findRouteAction } from '../src/lib/actions';

async function main() {
  // Test 1: Forward
  console.log('=== TEST 1: FORWARD ===');
  const formData1 = new FormData();
  formData1.append('startLocation', 'tambo-terminal');
  formData1.append('endLocation', 'anahaw-amphitheater');
  await runTest(formData1);

  // Test 2: Reverse
  console.log('\n=== TEST 2: REVERSE ===');
  const formData2 = new FormData();
  formData2.append('startLocation', 'anahaw-amphitheater');
  formData2.append('endLocation', 'tambo-terminal');
  await runTest(formData2);

  process.exit(0);
}

async function runTest(formData: FormData) {
  const response = await findRouteAction({ message: '' }, formData);
  console.log('--- RESPONSE MESSAGE ---');
  console.log(response.message);
  if (response.error) {
    console.log('Error occurred');
    process.exit(1);
  }

  if (response.result) {
    console.log('\n--- PATH SEGMENTS ---');
    response.result.path.forEach((seg: any, i) => {
      console.log(`Segment ${i + 1}: ${seg.from} -> ${seg.to} via ${seg.routeName}`);
      console.log(`  Distance: ${seg.distance} km`);
      console.log(`  Regular Fare: PHP ${seg.regularFare}`);
      if (seg.pathCoordinates) {
        console.log(`  Coords type: ${Array.isArray(seg.pathCoordinates) ? 'Array' : typeof seg.pathCoordinates}`);
        if (Array.isArray(seg.pathCoordinates)) {
          console.log(`  Coords length: ${seg.pathCoordinates.length}`);
          if (seg.pathCoordinates.length > 0) {
            console.log(`  First coordinate: ${JSON.stringify(seg.pathCoordinates[0])}`);
            console.log(`  Last coordinate: ${JSON.stringify(seg.pathCoordinates[seg.pathCoordinates.length - 1])}`);
          }
        } else {
          console.log(`  ridingCoords length: ${seg.pathCoordinates.ridingCoords?.length}`);
          console.log(`  walkingCoords length: ${seg.pathCoordinates.walkingCoords?.length}`);
          if (seg.pathCoordinates.ridingCoords?.length > 0) {
            console.log(`  First riding coord: ${JSON.stringify(seg.pathCoordinates.ridingCoords[0])}`);
            console.log(`  Last riding coord: ${JSON.stringify(seg.pathCoordinates.ridingCoords[seg.pathCoordinates.ridingCoords.length - 1])}`);
          }
        }
      } else {
        console.log(`  No coordinates found.`);
      }
    });

    console.log(`\nTotal Distance: ${response.result.totalDistance} km`);
    console.log(`Total Fare: PHP ${response.result.totalFare}`);
  }
}

main().catch(console.error);
