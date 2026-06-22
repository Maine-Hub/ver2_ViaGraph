import { findShortestPath } from '../src/lib/routing';

async function runTest(from: string, to: string) {
  console.log(`\n--- Running Pathfinding Test: ${from} -> ${to} ---`);
  try {
    const result = await findShortestPath(from, to);
    if (result) {
      console.log('✅ Shortest Path Result:');
      console.log(`   Ride Count (computed in Dijkstra): ${result.rideCount}`);
      console.log(`   Total Distance: ${result.totalDistance} km`);
      console.log(`   Total Fare (raw sum of blocks): PHP ${result.totalFare}`);
      console.log('   Path blocks:');
      result.path.forEach((b, i) => {
        console.log(`      Block ${i+1}: ${b.source_id} -> ${b.target_id} via "${b.route_name}"`);
      });
      
      // Let's also simulate the actions.ts processPath logic to see if they merge
      console.log('\n--- Simulating processPath merging logic ---');
      const { areRoutesCompatible } = require('../src/lib/routing');
      const segments: any[] = [];
      for (const b of result.path) {
        const isVehicle = b.route_name.toLowerCase() !== 'just walk' && !b.route_name.toLowerCase().includes('walk');
        if (segments.length > 0 && isVehicle && areRoutesCompatible(segments[segments.length - 1].routeName, b.route_name)) {
          const last = segments[segments.length - 1];
          last.to = b.target_id;
          last.distance += Number(b.distance);
          const prevLower = last.routeName.toLowerCase();
          const nextLower = b.route_name.toLowerCase();
          if (prevLower.includes('any city proper') && !nextLower.includes('any city proper')) {
            last.routeName = b.route_name;
          }
        } else {
          segments.push({
            from: b.source_id,
            to: b.target_id,
            routeName: b.route_name,
            distance: Number(b.distance)
          });
        }
      }
      console.log(`   Merged Segments count: ${segments.length}`);
      segments.forEach((seg, i) => {
        console.log(`      Segment ${i+1}: ${seg.from} -> ${seg.to} via "${seg.routeName}" (Distance: ${seg.distance} km)`);
      });
    } else {
      console.log('❌ No Path Found.');
    }
  } catch (e: any) {
    console.error(`💥 Error running test: ${e.message}`);
  }
}

async function main() {
  await runTest('tambo-terminal', 'hypermart-167');
  await runTest('tambo-terminal', 'anahaw-amphitheater');
  process.exit(0);
}

main().catch(console.error);
