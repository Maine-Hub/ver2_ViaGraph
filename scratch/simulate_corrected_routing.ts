import { query } from '../src/lib/mysql';
import { findShortestPath } from '../src/lib/routing';

async function run() {
  console.log('--- Temporarily updating ID 46 in database to connect Cathedral -> College ---');
  await query('UPDATE route_blocks SET source_id = "st--michael-s-cathedral", target_id = "st.michael\'s-college" WHERE id = 46');
  
  console.log('\n--- 1. Testing Routing: Children\'s Park -> St. Michael\'s Cathedral ---');
  const result1 = await findShortestPath('children-s-park', 'st--michael-s-cathedral');
  if (result1) {
    console.log(`✅ Path Found! Distance: ${result1.totalDistance} km, Fare: ${result1.totalFare}`);
    result1.path.forEach((leg, i) => {
      console.log(`   Leg ${i+1}: ${leg.source_id} -> ${leg.target_id} via ${leg.route_name} (${leg.distance} km)`);
    });
  } else {
    console.log('❌ No Path Found.');
  }

  console.log('\n--- 2. Testing Routing: Children\'s Park -> St. Michael\'s College ---');
  const result2 = await findShortestPath('children-s-park', 'st.michael\'s-college');
  if (result2) {
    console.log(`✅ Path Found! Distance: ${result2.totalDistance} km, Fare: ${result2.totalFare}`);
    result2.path.forEach((leg, i) => {
      console.log(`   Leg ${i+1}: ${leg.source_id} -> ${leg.target_id} via ${leg.route_name} (${leg.distance} km)`);
    });
  } else {
    console.log('❌ No Path Found.');
  }

  // Revert back so we don't modify user data permanent state before they approve
  console.log('\n--- Reverting ID 46 back to original state ---');
  await query('UPDATE route_blocks SET source_id = "children-s-park", target_id = "st--michael-s-cathedral" WHERE id = 46');
  
  process.exit(0);
}
run().catch(console.error);
