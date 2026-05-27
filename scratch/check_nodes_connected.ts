import { query } from '../src/lib/mysql';

async function main() {
  const nodes = await query<any[]>('SELECT id, name, latitude, longitude FROM nodes WHERE id IN ("gaisano-mall", "crown-paper-aguinaldo", "anahaw-amphitheater")');
  console.log('--- NODES ---');
  nodes.forEach(n => console.log(`[${n.id}] ${n.name} | Lat: ${n.latitude}, Lng: ${n.longitude}`));

  const blocks = await query<any[]>('SELECT id, source_id, target_id, route_name, distance FROM route_blocks');
  console.log('\n--- ROUTE BLOCKS CONNECTING THEM ---');
  blocks.forEach(b => {
    if (b.source_id === 'gaisano-mall' || b.target_id === 'gaisano-mall' || b.source_id === 'crown-paper-aguinaldo' || b.target_id === 'crown-paper-aguinaldo') {
      console.log(`ID: ${b.id} | ${b.source_id} -> ${b.target_id} via ${b.route_name} (${b.distance} km)`);
    }
  });

  process.exit(0);
}

main().catch(console.error);
