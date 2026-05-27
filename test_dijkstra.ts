import { findShortestPath } from './src/lib/routing';

async function runTests() {
  const tests = [
    { from: 'tambo-terminal', to: 'gaisano-mall', label: 'Tambo -> Gaisano Mall' },
    { from: 'msu-iit', to: 'gaisano-mall', label: 'MSU-IIT -> Gaisano Mall' },
    { from: 'tambo-terminal', to: 'centennial-park', label: 'Tambo -> Centennial Park' },
    { from: 'tambo-terminal', to: 'non-existent', label: 'Non-existent route' }
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
            console.log(`   Leg ${i+1}: ${b.source_id} -> ${b.target_id} via ${b.route_name}`);
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
