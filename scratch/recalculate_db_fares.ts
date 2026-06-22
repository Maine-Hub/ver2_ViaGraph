import { query } from '../src/lib/mysql';

async function main() {
  try {
    console.log('Fetching fare rules...');
    const rules = await query<any[]>('SELECT * FROM fare_matrix');
    const fareRulesMap: Record<string, any> = {};
    rules.forEach(r => {
      fareRulesMap[r.vehicle_type] = r;
    });

    console.log('Fetching active route blocks...');
    const blocks = await query<any[]>('SELECT id, distance, vehicle_type, route_name FROM route_blocks');
    console.log(`Found ${blocks.length} blocks. Recalculating...`);

    let updatedCount = 0;
    for (const block of blocks) {
      if (block.vehicle_type === 'walking') {
        await query(
          'UPDATE route_blocks SET regular_fare = 0, discounted_fare = 0 WHERE id = ?',
          [block.id]
        );
        continue;
      }

      const rule = fareRulesMap[block.vehicle_type] || fareRulesMap['jeepney'];
      if (rule) {
        const regularFare = Math.round(Number(rule.base_fare));
        const rawDiscounted = Number(rule.base_fare) * (1 - Number(rule.discount_rate));
        const discountedFare = Math.ceil(rawDiscounted);

        await query(
          'UPDATE route_blocks SET regular_fare = ?, discounted_fare = ? WHERE id = ?',
          [regularFare, discountedFare, block.id]
        );
        updatedCount++;
      }
    }

    console.log(`Successfully recalculated and updated ${updatedCount} vehicle route blocks in the database!`);
    process.exit(0);
  } catch (error) {
    console.error('Error recalculating database fares:', error);
    process.exit(1);
  }
}

main();
