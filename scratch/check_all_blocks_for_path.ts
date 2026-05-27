import { query } from '../src/lib/mysql';

async function main() {
  const nodes = ['unicity', 'anahaw-amphitheater', 'city-hospital', 'iligan-city-hospital'];
  for (const node of nodes) {
    const outgoing = await query<any[]>("SELECT rb.*, n.name as target_name FROM route_blocks rb JOIN nodes n ON rb.target_id = n.id WHERE rb.source_id=?", [node]);
    const incoming = await query<any[]>("SELECT rb.*, n.name as source_name FROM route_blocks rb JOIN nodes n ON rb.source_id = n.id WHERE rb.target_id=?", [node]);
    console.log(`\n=== NODE: ${node} ===`);
    console.log(`  Outgoing connections (${outgoing.length}):`);
    outgoing.forEach(b => console.log(`    -> ${b.target_id} (${b.target_name}) via ${b.route_name} (dist: ${b.distance})`));
    console.log(`  Incoming connections (${incoming.length}):`);
    incoming.forEach(b => console.log(`    <- ${b.source_id} (${b.source_name}) via ${b.route_name} (dist: ${b.distance})`));
  }
  process.exit(0);
}

main().catch(console.error);
