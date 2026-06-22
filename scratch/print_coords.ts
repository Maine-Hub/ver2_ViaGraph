import { query } from '../src/lib/mysql';

async function main() {
  const blocks = await query<any[]>('SELECT id, source_id, target_id, route_name, path_coordinates FROM route_blocks WHERE id IN (37, 42, 44)');
  for (const b of blocks) {
    console.log(`\nID: ${b.id} | ${b.route_name} | ${b.source_id} -> ${b.target_id}`);
    try {
      const parsed = JSON.parse(b.path_coordinates);
      console.log('Parsed type: Object');
      console.log('ridingCoords:', JSON.stringify(parsed.ridingCoords));
      console.log('walkingCoords:', JSON.stringify(parsed.walkingCoords));
    } catch (e: any) {
      console.error('Error parsing:', e.message);
    }
  }
  process.exit(0);
}

main().catch(console.error);
