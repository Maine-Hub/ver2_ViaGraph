import { query } from '../src/lib/mysql';

async function main() {
  const blocks = await query<any[]>('SELECT id, source_id, target_id, path_coordinates FROM route_blocks');
  console.log('--- STARTING COORDINATE CORRECTION ---');
  let fixedCount = 0;

  for (const b of blocks) {
    if (!b.path_coordinates) continue;

    let parsed: any;
    try {
      parsed = JSON.parse(b.path_coordinates);
    } catch (e) {
      console.log(`Block ${b.id}: failed to parse JSON.`);
      continue;
    }

    let needsUpdate = false;

    // Helper to fix a list of coordinates
    const fixCoordsList = (list: [number, number][]): boolean => {
      if (!Array.isArray(list) || list.length === 0) return false;
      // Heuristic: If first coordinate's first value is > 90, it is longitude, so swap it.
      const first = list[0];
      if (first && first[0] > 90) {
        for (let i = 0; i < list.length; i++) {
          const temp = list[i][0];
          list[i][0] = list[i][1];
          list[i][1] = temp;
        }
        return true;
      }
      return false;
    };

    if (Array.isArray(parsed)) {
      if (fixCoordsList(parsed)) {
        needsUpdate = true;
      }
    } else if (parsed && typeof parsed === 'object') {
      if (parsed.ridingCoords && fixCoordsList(parsed.ridingCoords)) {
        needsUpdate = true;
      }
      if (parsed.walkingCoords && fixCoordsList(parsed.walkingCoords)) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      const updatedJson = JSON.stringify(parsed);
      await query('UPDATE route_blocks SET path_coordinates = ? WHERE id = ?', [updatedJson, b.id]);
      console.log(`✅ Fixed coordinates for Block ID ${b.id} (${b.source_id} -> ${b.target_id})`);
      fixedCount++;
    }
  }

  console.log(`\nCoordinate correction complete. Total blocks fixed: ${fixedCount}`);
  process.exit(0);
}

main().catch(console.error);
