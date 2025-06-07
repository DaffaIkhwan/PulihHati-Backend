require('dotenv').config();
const { query } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupCloudinary() {
  try {
    console.log('Setting up Cloudinary support...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'add-cloudinary-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await query(sql);
    
    console.log('✅ Cloudinary column added successfully!');
    
    // Test the table structure
    const testResult = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'pulihHati' AND table_name = 'users'
      AND column_name IN ('avatar', 'cloudinary_public_id')
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Avatar-related columns:');
    testResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n🎉 Cloudinary setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up Cloudinary:', error.message);
    process.exit(1);
  }
}

setupCloudinary();
