require('dotenv').config();
const { query } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupNotifications() {
  try {
    console.log('Setting up notifications table...');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-notifications-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    await query(sql);

    console.log('✅ Notifications table created successfully!');
    console.log('✅ Indexes created successfully!');

    // Test the table
    const testResult = await query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'pulihHati' AND table_name = 'notifications'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Table structure:');
    testResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up notifications:', error.message);
    process.exit(1);
  }
}

setupNotifications();
