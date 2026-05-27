import { query } from '../src/lib/mysql';

async function run() {
  console.log('--- Correcting Route Block ID 46 Endpoints ---');
  await query(`
    UPDATE route_blocks 
    SET source_id = "st--michael-s-cathedral", 
        target_id = "st.michael's-college" 
    WHERE id = 46
  `);
  console.log('✅ Route block ID 46 updated successfully.');
  process.exit(0);
}
run().catch(console.error);
