import { findShortestPath } from './src/lib/routing';

async function runTests() {
  const tests = [
    { from: 'tambo-terminal', to: 'anahaw-amphitheater', label: 'Tambo -> Anahaw' },
    { from: 'msu-iit', to: 'anahaw-amphitheater', label: 'MSU-IIT -> Anahaw' },
    { from: 'anahaw-amphitheater', to: 'tambo-terminal', label: 'Anahaw -> Tambo' },
  ];

  for (const test of tests) {
    console.log(`\nTesting: ${test.label} (${test.from} -> ${test.to})`);
    try {
      const result = await findShortestPath(test.from, test.to);
      if (result) {
        console.log(`✅ Path Found! Segments: ${result.path.length}`);
        console.log(`   Total Distance: ${result.totalDistance} km`);
        console.log(`   Total Fare: PHP ${result.totalFare}`);
        result.path.forEach((b, i) => {
            console.log(`   Leg ${i+1}: ${b.source_id} -> ${b.target_id} via ${b.route_name} (${b.distance} km)`);
        });
      } else {
        console.log('❌ No Path Found.');
      }
    } catch (e: any) {
      console.error(`💥 Error: ${e.message}`);
    }
  }
  process.exit(0);
}

runTests();
