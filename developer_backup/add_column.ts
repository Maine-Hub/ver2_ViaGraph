import pool from './src/lib/mysql';

async function addColumn() {
  try {
    console.log("Adding is_active column...");
    await pool.query("ALTER TABLE edges ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
    console.log("Success!");
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error("Error:", err);
    }
  } finally {
    process.exit(0);
  }
}
addColumn();
