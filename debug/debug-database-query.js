// Debug database query untuk mood entries
const { query } = require('../config/db');

const debugMoodDatabase = async () => {
  console.log('🔍 Debugging Mood Database...');
  
  try {
    // 1. Check all mood entries for user 4
    console.log('\n1. All mood entries for user 4:');
    const allEntries = await query(`
      SELECT * FROM "pulihHati".mood_entries 
      WHERE user_id = 4 
      ORDER BY entry_date DESC
    `);
    
    console.log(`Found ${allEntries.rows.length} total entries:`);
    allEntries.rows.forEach(row => {
      console.log(`  ${row.entry_date} | Level ${row.mood_level} | ${row.mood_emoji} | Created: ${row.created_at}`);
    });

    // 2. Check date range calculation
    console.log('\n2. Date range calculation:');
    const today = new Date();
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const sixDaysAgoStr = `${sixDaysAgo.getFullYear()}-${String(sixDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sixDaysAgo.getDate()).padStart(2, '0')}`;

    console.log(`Today: ${todayStr}`);
    console.log(`Six days ago: ${sixDaysAgoStr}`);

    // 3. Test the exact query used by backend
    console.log('\n3. Testing backend query:');
    const backendQuery = await query(`
      SELECT 
        mood_level,
        mood_label,
        mood_emoji,
        entry_date,
        created_at,
        updated_at
      FROM "pulihHati".mood_entries
      WHERE user_id = $1 
      AND entry_date >= $2
      AND entry_date <= $3
      ORDER BY entry_date ASC
    `, [4, sixDaysAgoStr, todayStr]);

    console.log(`Backend query found ${backendQuery.rows.length} entries:`);
    backendQuery.rows.forEach(row => {
      console.log(`  ${row.entry_date} | Level ${row.mood_level} | ${row.mood_emoji}`);
    });

    // 4. Check for today specifically
    console.log('\n4. Checking for today specifically:');
    const todayEntry = await query(`
      SELECT * FROM "pulihHati".mood_entries 
      WHERE user_id = 4 AND entry_date = $1
    `, [todayStr]);

    if (todayEntry.rows.length > 0) {
      console.log(`✅ Found today's entry:`, todayEntry.rows[0]);
    } else {
      console.log(`❌ No entry found for today (${todayStr})`);
    }

    // 5. Check timezone issues
    console.log('\n5. Timezone check:');
    console.log(`Current time: ${new Date()}`);
    console.log(`UTC time: ${new Date().toISOString()}`);
    console.log(`Local date string: ${todayStr}`);

  } catch (error) {
    console.error('❌ Database debug failed:', error.message);
  }
};

// Run debug
debugMoodDatabase().then(() => {
  console.log('\n✅ Database debug completed');
  process.exit(0);
}).catch(error => {
  console.error('Debug failed:', error);
  process.exit(1);
});
