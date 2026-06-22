import pool from '../src/lib/mysql';

async function migrate() {
  try {
    console.log("Checking and adding columns to route_blocks...");

    // Add version column
    try {
      await pool.query("ALTER TABLE route_blocks ADD COLUMN version INT DEFAULT 1");
      console.log("Added version column.");
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("version column already exists.");
      else throw err;
    }

    // Add parent_id column
    try {
      await pool.query("ALTER TABLE route_blocks ADD COLUMN parent_id INT DEFAULT NULL");
      console.log("Added parent_id column.");
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("parent_id column already exists.");
      else throw err;
    }

    // Add is_history column
    try {
      await pool.query("ALTER TABLE route_blocks ADD COLUMN is_history TINYINT DEFAULT 0");
      console.log("Added is_history column.");
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("is_history column already exists.");
      else throw err;
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
