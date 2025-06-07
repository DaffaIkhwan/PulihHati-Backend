// Setup mood tracker tables
const { query } = require('../config/db');
const logger = require('../config/logger');

const setupMoodTracker = async () => {
  console.log('🚀 Setting up Mood Tracker tables...');
  
  try {
    // Create mood_entries table
    console.log('📋 Creating mood_entries table...');
    await query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".mood_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
        mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
        mood_label VARCHAR(50) NOT NULL,
        mood_emoji VARCHAR(10) NOT NULL,
        entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Ensure one mood entry per user per day
        UNIQUE(user_id, entry_date)
      )
    `);
    console.log('✅ mood_entries table created');

    // Create indexes
    console.log('📋 Creating indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date 
      ON "pulihHati".mood_entries(user_id, entry_date)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_mood_entries_date 
      ON "pulihHati".mood_entries(entry_date)
    `);
    console.log('✅ Indexes created');

    // Create mood_types table
    console.log('📋 Creating mood_types table...');
    await query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".mood_types (
        id INTEGER PRIMARY KEY,
        emoji VARCHAR(10) NOT NULL,
        label VARCHAR(50) NOT NULL,
        color_class VARCHAR(100) NOT NULL,
        chart_color VARCHAR(20) NOT NULL
      )
    `);
    console.log('✅ mood_types table created');

    // Insert default mood types
    console.log('📋 Inserting default mood types...');
    await query(`
      INSERT INTO "pulihHati".mood_types (id, emoji, label, color_class, chart_color) VALUES
      (1, '😢', 'Sedih', 'bg-blue-100 text-blue-700 border-blue-300', '#3B82F6'),
      (2, '😟', 'Cemas', 'bg-yellow-100 text-yellow-700 border-yellow-300', '#F59E0B'),
      (3, '😐', 'Netral', 'bg-gray-100 text-gray-700 border-gray-300', '#6B7280'),
      (4, '😊', 'Senang', 'bg-green-100 text-green-700 border-green-300', '#10B981'),
      (5, '😄', 'Sangat Bahagia', 'bg-pink-100 text-pink-700 border-pink-300', '#EC4899')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Default mood types inserted');

    // Check tables
    console.log('📋 Checking created tables...');
    const result = await query(`
      SELECT table_name, column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'pulihHati' 
      AND table_name IN ('mood_entries', 'mood_types')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('📊 Table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n✅ Mood Tracker setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up Mood Tracker:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupMoodTracker().then(() => {
    console.log('🎉 Setup completed!');
    process.exit(0);
  }).catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = setupMoodTracker;
