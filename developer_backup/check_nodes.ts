import { query } from './src/lib/mysql';

async function checkNodes() {
  const nodes = await query<any[]>('SELECT id, name FROM nodes');
  console.log('--- Current Nodes in DB ---');
  nodes.forEach(n => console.log(`[${n.id}] ${n.name}`));
  
  const blocks = await query<any[]>('SELECT id, source_id, target_id, route_name FROM route_blocks');
  console.log('\n--- Route Blocks Count ---');
  console.log(`Total Route Blocks: ${blocks.length}`);
  process.exit(0);
}

checkNodes().catch(console.error);
