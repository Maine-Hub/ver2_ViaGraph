import { query } from '../src/lib/mysql';

async function runMigration() {
  console.log('Running archive columns migration...');
  
  try {
    // Add is_archived to route_blocks
    console.log('Adding is_archived to route_blocks...');
    await query('ALTER TABLE route_blocks ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0');
    console.log('Successfully added is_archived to route_blocks.');
  } catch (err: any) {
    if (err.message.includes('Duplicate column')) {
      console.log('is_archived column already exists in route_blocks.');
    } else {
      console.error('Error modifying route_blocks:', err);
    }
  }

  try {
    // Add is_archived to nodes
    console.log('Adding is_archived to nodes...');
    await query('ALTER TABLE nodes ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0');
    console.log('Successfully added is_archived to nodes.');
  } catch (err: any) {
    if (err.message.includes('Duplicate column')) {
      console.log('is_archived column already exists in nodes.');
    } else {
      console.error('Error modifying nodes:', err);
    }
  }

  try {
    // Add is_archived to routes
    console.log('Adding is_archived to routes...');
    await query('ALTER TABLE routes ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0');
    console.log('Successfully added is_archived to routes.');
  } catch (err: any) {
    if (err.message.includes('Duplicate column')) {
      console.log('is_archived column already exists in routes.');
    } else {
      console.error('Error modifying routes:', err);
    }
  }

  console.log('Migration completed successfully.');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
