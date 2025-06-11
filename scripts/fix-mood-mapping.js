/**
 * Fix Mood Mapping Script
 * 
 * This script fixes the mood mapping mismatch between frontend and backend
 * by updating the database to match the frontend mapping.
 */

const { query } = require('../config/db');
const logger = require('../config/logger');

const fixMoodMapping = async () => {
  console.log('🔧 Starting Mood Mapping Fix...\n');

  try {
    // Check current mood_types
    console.log('📋 Current mood_types in database:');
    const currentTypes = await query('SELECT * FROM "pulihHati".mood_types ORDER BY id');
    currentTypes.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.emoji} ${row.label} (${row.chart_color})`);
    });

    console.log('\n🔄 Updating mood_types to match frontend mapping...');

    // Update mood_types with correct mapping
    const updates = [
      { id: 1, emoji: '😊', label: 'Sangat Baik', color_class: 'bg-green-100 text-green-700 border-green-300', chart_color: '#22C55E' },
      { id: 2, emoji: '🙂', label: 'Baik', color_class: 'bg-emerald-100 text-emerald-700 border-emerald-300', chart_color: '#10B981' },
      { id: 3, emoji: '😐', label: 'Biasa', color_class: 'bg-yellow-100 text-yellow-700 border-yellow-300', chart_color: '#EAB308' },
      { id: 4, emoji: '😔', label: 'Buruk', color_class: 'bg-orange-100 text-orange-700 border-orange-300', chart_color: '#F97316' },
      { id: 5, emoji: '😢', label: 'Sangat Buruk', color_class: 'bg-red-100 text-red-700 border-red-300', chart_color: '#EF4444' }
    ];

    for (const update of updates) {
      await query(`
        UPDATE "pulihHati".mood_types SET 
          emoji = $2, 
          label = $3,
          color_class = $4,
          chart_color = $5
        WHERE id = $1
      `, [update.id, update.emoji, update.label, update.color_class, update.chart_color]);
      
      console.log(`  ✅ Updated ID ${update.id}: ${update.emoji} ${update.label}`);
    }

    console.log('\n📋 Updated mood_types:');
    const updatedTypes = await query('SELECT * FROM "pulihHati".mood_types ORDER BY id');
    updatedTypes.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.emoji} ${row.label} (${row.chart_color})`);
    });

    // Update existing mood entries
    console.log('\n🔄 Updating existing mood entries...');
    
    const entryUpdates = [
      { level: 1, emoji: '😊', label: 'Sangat Baik' },
      { level: 2, emoji: '🙂', label: 'Baik' },
      { level: 3, emoji: '😐', label: 'Biasa' },
      { level: 4, emoji: '😔', label: 'Buruk' },
      { level: 5, emoji: '😢', label: 'Sangat Buruk' }
    ];

    for (const update of entryUpdates) {
      const result = await query(`
        UPDATE "pulihHati".mood_entries SET 
          mood_label = $2,
          mood_emoji = $3
        WHERE mood_level = $1
      `, [update.level, update.label, update.emoji]);
      
      console.log(`  ✅ Updated ${result.rowCount} entries for level ${update.level}: ${update.emoji} ${update.label}`);
    }

    // Verify mood entries
    console.log('\n📊 Current mood entries summary:');
    const entriesSummary = await query(`
      SELECT mood_level, mood_label, mood_emoji, COUNT(*) as count
      FROM "pulihHati".mood_entries 
      GROUP BY mood_level, mood_label, mood_emoji
      ORDER BY mood_level
    `);
    
    if (entriesSummary.rows.length > 0) {
      entriesSummary.rows.forEach(row => {
        console.log(`  Level ${row.mood_level}: ${row.mood_emoji} ${row.mood_label} (${row.count} entries)`);
      });
    } else {
      console.log('  No mood entries found in database');
    }

    console.log('\n✅ Mood mapping fix completed successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('  - Updated mood_types table to match frontend mapping');
    console.log('  - Updated existing mood entries with correct labels and emojis');
    console.log('  - ID 1 = Sangat Baik 😊 (was Sedih 😢)');
    console.log('  - ID 2 = Baik 🙂 (was Cemas 😟)');
    console.log('  - ID 3 = Biasa 😐 (unchanged)');
    console.log('  - ID 4 = Buruk 😔 (was Senang 😊)');
    console.log('  - ID 5 = Sangat Buruk 😢 (was Sangat Bahagia 😄)');

  } catch (error) {
    console.error('❌ Error fixing mood mapping:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

// Run the fix if this file is executed directly
if (require.main === module) {
  fixMoodMapping()
    .then(() => {
      console.log('\n🎉 Mood mapping fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Mood mapping fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = fixMoodMapping;
