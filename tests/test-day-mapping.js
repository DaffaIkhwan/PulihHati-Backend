// Test script untuk debugging day mapping
const testDayMapping = () => {
  console.log('🧪 Testing Day Mapping...');
  console.log('========================');

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  // Test current time
  const now = new Date();
  console.log('\n📅 Current Date Info:');
  console.log('Date:', now.toISOString().split('T')[0]);
  console.log('Day Index (getDay()):', now.getDay());
  console.log('Day Name (short):', dayNames[now.getDay()]);
  console.log('Day Name (full):', fullDayNames[now.getDay()]);
  
  // Test last 7 days
  console.log('\n📊 Last 7 Days Mapping:');
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayIndex = date.getDay();
    const dayName = dayNames[dayIndex];
    const fullDayName = fullDayNames[dayIndex];
    
    const isToday = i === 0;
    console.log(`${isToday ? '👉' : '  '} ${dateStr} | Day ${dayIndex} | ${dayName} (${fullDayName}) ${isToday ? '← TODAY' : ''}`);
  }
  
  // Test specific dates
  console.log('\n🔍 Test Specific Dates:');
  const testDates = [
    '2025-05-26', // Monday
    '2025-05-25', // Sunday
    '2025-05-24', // Saturday
  ];
  
  testDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const dayName = dayNames[dayIndex];
    const fullDayName = fullDayNames[dayIndex];
    console.log(`${dateStr} | Day ${dayIndex} | ${dayName} (${fullDayName})`);
  });
  
  // Test timezone issues
  console.log('\n🌍 Timezone Info:');
  console.log('Local timezone offset:', now.getTimezoneOffset(), 'minutes');
  console.log('UTC date:', now.toISOString().split('T')[0]);
  console.log('Local date:', now.toLocaleDateString('en-CA')); // YYYY-MM-DD format
  
  // Test what happens at midnight
  console.log('\n🕛 Midnight Test:');
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  console.log('Midnight today:', midnight.toISOString());
  console.log('Midnight day index:', midnight.getDay());
  console.log('Midnight day name:', fullDayNames[midnight.getDay()]);
};

// Test PostgreSQL day mapping simulation
const testPostgreSQLMapping = () => {
  console.log('\n🐘 PostgreSQL DOW Simulation:');
  console.log('PostgreSQL EXTRACT(DOW) returns: 0=Sunday, 1=Monday, ..., 6=Saturday');
  
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  for (let dow = 0; dow <= 6; dow++) {
    console.log(`DOW ${dow} = ${dayNames[dow]}`);
  }
};

// Run tests
testDayMapping();
testPostgreSQLMapping();

// Export for use in other files
module.exports = { testDayMapping, testPostgreSQLMapping };
