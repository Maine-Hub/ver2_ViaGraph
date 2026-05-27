const { findShortestPath } = require('./src/lib/routing');
const mysql = require('mysql2/promise');

async function debug() {
  const startId = 'tambo-terminal';
  const endId = 'anahaw-amphitheater';
  
  const result = await findShortestPath(startId, endId);
  if (!result) {
    console.log('No route found');
    return;
  }
  
  console.log('Total Distance:', result.totalDistance);
  console.log('Total Fare:', result.totalFare);
  console.log('Path Segments:');
  result.path.forEach((s, i) => {
    console.log(`Seg ${i+1}: ${s.source_id} -> ${s.target_id} (${s.route_name})`);
    console.log(`   Coords count: ${s.path_coordinates ? JSON.parse(s.path_coordinates).length : 0}`);
  });
}

debug();
