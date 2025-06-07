// Test timezone fix
const testTimezoneFix = () => {
  console.log('🧪 Testing Timezone Fix...');
  console.log('==========================');

  const now = new Date();
  
  // Old method (UTC-based)
  const utcDate = now.toISOString().split('T')[0];
  const utcDay = new Date(utcDate).getDay();
  
  // New method (Local-based)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localDate = `${year}-${month}-${day}`;
  const localDay = now.getDay();
  
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  console.log('\n📅 Date Comparison:');
  console.log('Current time:', now.toString());
  console.log('Timezone offset:', now.getTimezoneOffset(), 'minutes');
  console.log('');
  console.log('OLD METHOD (UTC-based):');
  console.log('  Date:', utcDate);
  console.log('  Day index:', utcDay);
  console.log('  Day name:', dayNames[utcDay]);
  console.log('');
  console.log('NEW METHOD (Local-based):');
  console.log('  Date:', localDate);
  console.log('  Day index:', localDay);
  console.log('  Day name:', dayNames[localDay]);
  console.log('');
  
  if (utcDate !== localDate) {
    console.log('⚠️  TIMEZONE ISSUE DETECTED!');
    console.log('   UTC and Local dates are different');
    console.log('   This explains why mood was saved to wrong day');
  } else {
    console.log('✅ No timezone issue detected');
  }
  
  // Test what happens at different times
  console.log('\n🕐 Time Scenarios:');
  
  const scenarios = [
    { hour: 0, minute: 30, desc: 'Dini hari (00:30)' },
    { hour: 6, minute: 0, desc: 'Pagi (06:00)' },
    { hour: 12, minute: 0, desc: 'Siang (12:00)' },
    { hour: 18, minute: 0, desc: 'Sore (18:00)' },
    { hour: 23, minute: 30, desc: 'Malam (23:30)' }
  ];
  
  scenarios.forEach(scenario => {
    const testTime = new Date();
    testTime.setHours(scenario.hour, scenario.minute, 0, 0);
    
    const testUtcDate = testTime.toISOString().split('T')[0];
    const testYear = testTime.getFullYear();
    const testMonth = String(testTime.getMonth() + 1).padStart(2, '0');
    const testDay = String(testTime.getDate()).padStart(2, '0');
    const testLocalDate = `${testYear}-${testMonth}-${testDay}`;
    
    const utcDayName = dayNames[new Date(testUtcDate).getDay()];
    const localDayName = dayNames[testTime.getDay()];
    
    console.log(`${scenario.desc}:`);
    console.log(`  UTC: ${testUtcDate} (${utcDayName})`);
    console.log(`  Local: ${testLocalDate} (${localDayName})`);
    console.log(`  Match: ${testUtcDate === testLocalDate ? '✅' : '❌'}`);
  });
};

testTimezoneFix();
