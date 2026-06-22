import pool from '../src/lib/mysql';

async function main() {
  try {
    const [rows]: any = await pool.query(`
      SELECT id, name 
      FROM nodes 
      WHERE name LIKE '%Auto-Generated%' 
         OR name LIKE '%auto-generated%'
    `);
    
    console.log("=== Auto-Generated Nodes in Database ===");
    console.log(`Found: ${rows.length}`);
    rows.forEach((row: any) => {
      console.log(`- ID: ${row.id} | Name: ${row.name}`);
    });

  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
