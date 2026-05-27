import { query } from '../src/lib/mysql';

async function checkUnicity() {
  const blocks = await query<any[]>('SELECT * FROM route_blocks WHERE (source_id = "unicity" AND target_id = "anahaw-amphitheater") OR (source_id = "anahaw-amphitheater" AND target_id = "unicity")');
  console.log(`Found ${blocks.length} blocks:`);
  for (const b of blocks) {
    console.log(`ID: ${b.id}`);
    console.log(`Source: ${b.source_id}, Target: ${b.target_id}`);
    console.log(`Route Name: ${b.route_name}`);
    console.log(`Distance: ${b.distance}`);
    console.log(`Regular Fare: ${b.regular_fare}`);
    console.log(`Path Coordinates (trimmed): ${b.path_coordinates ? b.path_coordinates.substring(0, 200) + '...' : 'null'}`);
    if (b.path_coordinates) {
      try {
        const parsed = JSON.parse(b.path_coordinates);
        console.log(`Parsed structure:`, Object.keys(parsed));
        if (parsed.ridingCoords) console.log(`ridingCoords length: ${parsed.ridingCoords.length}`);
        if (parsed.walkingCoords) console.log(`walkingCoords length: ${parsed.walkingCoords.length}`);
        console.log(`ridingDist: ${parsed.ridingDist}, walkingDist: ${parsed.walkingDist}`);
      } catch (e) {
        console.log('Not valid JSON or legacy format');
      }
    }
    console.log('-----------------------------------');
  }
  process.exit(0);
}

checkUnicity().catch(console.error);
