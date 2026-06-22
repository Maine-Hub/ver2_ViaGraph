import { query } from '../src/lib/mysql';

async function run() {
  const nodes = await query<any[]>(`
    SELECT id, name, latitude, longitude FROM nodes 
    WHERE id IN ('tambo-terminal', 'msu-iit', 'gaisano-mall', 'st--michael-s-cathedral')
  `);
  console.log('--- NODES ---');
  nodes.forEach(n => {
    console.log(`Node ID: ${n.id} | Name: ${n.name} | Lat: ${n.latitude} | Lng: ${n.longitude}`);
  });

  const blocks = await query<any[]>('SELECT * FROM route_blocks WHERE id IN (42, 44, 37)');
  console.log('\n--- ROUTE BLOCKS ---');
  blocks.forEach(b => {
    console.log(`ID: ${b.id} | Route: ${b.route_name} | ${b.source_id} -> ${b.target_id}`);
    if (b.path_coordinates) {
      const parsed = JSON.parse(b.path_coordinates);
      console.log('  ridingCoords length:', parsed.ridingCoords?.length);
      console.log('  ridingCoords start:', parsed.ridingCoords?.[0]);
      console.log('  ridingCoords end:', parsed.ridingCoords?.[parsed.ridingCoords.length - 1]);
      console.log('  walkingCoords length:', parsed.walkingCoords?.length);
      console.log('  walkingCoords start:', parsed.walkingCoords?.[0]);
      console.log('  walkingCoords end:', parsed.walkingCoords?.[parsed.walkingCoords.length - 1]);
    }
  });
  process.exit(0);
}

run().catch(console.error);
