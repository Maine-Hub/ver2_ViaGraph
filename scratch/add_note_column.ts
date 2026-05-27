import { query } from '../src/lib/mysql';

async function run() {
  console.log('--- Adding "note" column to "route_blocks" table ---');
  try {
    await query('ALTER TABLE route_blocks ADD COLUMN note TEXT NULL');
    console.log('✅ Column "note" added successfully.');
  } catch (e: any) {
    if (e.code === 'ER_DUP_COLUMN_NAME') {
      console.log('ℹ️ Column "note" already exists in "route_blocks" table.');
    } else {
      throw e;
    }
  }
  process.exit(0);
}
run().catch(console.error);
