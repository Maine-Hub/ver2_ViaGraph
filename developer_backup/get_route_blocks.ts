import { query } from './src/lib/mysql';

async function fetchRouteBlocks() {
  const queryStr = `
    SELECT rb.id, 
           n1.name as source_name, 
           n2.name as target_name, 
           rb.route_name 
    FROM route_blocks rb
    JOIN nodes n1 ON rb.source_id = n1.id
    JOIN nodes n2 ON rb.target_id = n2.id
  `;
  const blocks = await query<any[]>(queryStr);
  
  console.log('--- Existing Route Blocks ---');
  blocks.forEach(b => {
    console.log(`[${b.route_name}] ${b.source_name} -> ${b.target_name}`);
  });
  process.exit(0);
}

fetchRouteBlocks().catch(console.error);
