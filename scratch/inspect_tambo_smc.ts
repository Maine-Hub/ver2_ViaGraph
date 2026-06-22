import { findShortestPath, findRawDijkstraPath } from '../src/lib/routing';
import { query } from '../src/lib/mysql';

async function inspect() {
  // Find node IDs containing 'tambo' and 'michael' to make sure we use the correct IDs
  const nodes = await query<any[]>('SELECT id, name FROM nodes');
  const tamboNode = nodes.find(n => n.name.toLowerCase().includes('tambo'));
  const smcNode = nodes.find(n => n.name.toLowerCase().includes('michael'));
  
  console.log('Tambo Node:', tamboNode);
  console.log('SMC Node:', smcNode);
  
  const startId = 'tambo-terminal';
  const endId = 'st--michael-s-cathedral';
  
  console.log(`\n--- Running findShortestPath (${startId} -> ${endId}) ---`);
  const rec = await findShortestPath(startId, endId);
  if (rec) {
    console.log(`Total Distance: ${rec.totalDistance} km, Total Fare: ₱${rec.totalFare}, Ride Count: ${rec.rideCount}`);
    rec.path.forEach((b: any, idx: number) => {
      console.log(`  Leg ${idx + 1}: Block ID ${b.id}: ${b.source_id} -> ${b.target_id} via "${b.route_name}", distance: ${b.distance}`);
    });
    
    console.log(`\n  --- ALTERNATIVES COUNT: ${rec.alternatives?.length || 0} ---`);
    rec.alternatives?.forEach((alt: any, altIdx: number) => {
      console.log(`  Alternative ${altIdx + 1}: Distance: ${alt.totalDistance} km, Fare: ₱${alt.totalFare}, Ride Count: ${alt.rideCount}`);
      alt.path.forEach((b: any, idx: number) => {
        console.log(`    Leg ${idx + 1}: Block ID ${b.id}: ${b.source_id} -> ${b.target_id} via "${b.route_name}", distance: ${b.distance}`);
      });
    });
  } else {
    console.log('No recommended path found');
  }

  console.log(`\n--- Running findRawDijkstraPath (${startId} -> ${endId}) ---`);
  const raw = await findRawDijkstraPath(startId, endId);
  if (raw) {
    console.log(`Total Distance: ${raw.totalDistance} km, Total Fare: ₱${raw.totalFare}`);
    raw.path.forEach((b: any, idx: number) => {
      console.log(`Leg ${idx + 1}: Block ID ${b.id}: ${b.source_id} -> ${b.target_id} via "${b.route_name}", distance: ${b.distance}`);
      try {
        const parsed = JSON.parse(b.path_coordinates);
        console.log(`  PathCoordinates type:`, typeof parsed, Array.isArray(parsed) ? 'Array' : 'Object');
        if (!Array.isArray(parsed)) {
          console.log(`  ridingCoords count:`, parsed.ridingCoords?.length);
          console.log(`  walkingCoords count:`, parsed.walkingCoords?.length);
          console.log(`  ridingDist:`, parsed.ridingDist);
          console.log(`  walkingDist:`, parsed.walkingDist);
        }
      } catch (e) {
        console.log(`  Error parsing path_coordinates:`, e);
      }
    });
  } else {
    console.log('No raw Dijkstra path found');
  }
  
  process.exit(0);
}

inspect();
