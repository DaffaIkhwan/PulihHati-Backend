// Test script untuk mood tracker backend
// Jalankan dengan: node test-mood-tracker.js

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  // Replace with a valid token from your app
  authToken: 'your-auth-token-here',
  
  // Test endpoints
  endpoints: {
    moodTypes: '/mood/types',
    saveMood: '/mood/entry',
    todayMood: '/mood/today',
    weeklyHistory: '/mood/history/week',
    moodHistory: '/mood/history',
    moodStats: '/mood/stats'
  }
};

// Helper function to make authenticated requests
const makeAuthRequest = async (endpoint, options = {}) => {
  try {
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await axios({
      url: `${API_BASE}${endpoint}`,
      ...config
    });

    return response.data;
  } catch (error) {
    console.error(`❌ Request failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test 1: Get mood types
const testGetMoodTypes = async () => {
  console.log('\n🔍 Test 1: Getting mood types...');
  
  try {
    const data = await axios.get(`${API_BASE}${TEST_CONFIG.endpoints.moodTypes}`);
    
    console.log('✅ Mood types retrieved successfully');
    console.log('📊 Mood types:', data.data.data);
    
    return data.data.data;
  } catch (error) {
    console.error('❌ Failed to get mood types');
    throw error;
  }
};

// Test 2: Save mood entry
const testSaveMoodEntry = async () => {
  console.log('\n🔍 Test 2: Saving mood entry...');
  
  try {
    const moodData = {
      mood_level: 4, // Senang
      entry_date: new Date().toISOString().split('T')[0] // Today
    };
    
    const data = await makeAuthRequest(TEST_CONFIG.endpoints.saveMood, {
      method: 'POST',
      data: moodData
    });
    
    console.log('✅ Mood entry saved successfully');
    console.log('📝 Saved mood:', data.data);
    
    return data.data;
  } catch (error) {
    console.error('❌ Failed to save mood entry');
    throw error;
  }
};

// Test 3: Get today's mood
const testGetTodayMood = async () => {
  console.log('\n🔍 Test 3: Getting today\'s mood...');
  
  try {
    const data = await makeAuthRequest(TEST_CONFIG.endpoints.todayMood);
    
    console.log('✅ Today\'s mood retrieved successfully');
    console.log('📅 Today\'s mood:', data.data);
    
    return data.data;
  } catch (error) {
    console.error('❌ Failed to get today\'s mood');
    throw error;
  }
};

// Test 4: Get weekly mood history
const testGetWeeklyHistory = async () => {
  console.log('\n🔍 Test 4: Getting weekly mood history...');
  
  try {
    const data = await makeAuthRequest(TEST_CONFIG.endpoints.weeklyHistory);
    
    console.log('✅ Weekly mood history retrieved successfully');
    console.log('📊 Weekly data:', data.data);
    
    return data.data;
  } catch (error) {
    console.error('❌ Failed to get weekly mood history');
    throw error;
  }
};

// Test 5: Get mood statistics
const testGetMoodStats = async () => {
  console.log('\n🔍 Test 5: Getting mood statistics...');
  
  try {
    const data = await makeAuthRequest(TEST_CONFIG.endpoints.moodStats);
    
    console.log('✅ Mood statistics retrieved successfully');
    console.log('📈 Statistics:', data.data);
    
    return data.data;
  } catch (error) {
    console.error('❌ Failed to get mood statistics');
    throw error;
  }
};

// Test 6: Save multiple mood entries for testing
const testSaveMultipleMoods = async () => {
  console.log('\n🔍 Test 6: Saving multiple mood entries...');
  
  try {
    const moods = [
      { mood_level: 3, entry_date: getDateString(-6) }, // 6 days ago
      { mood_level: 4, entry_date: getDateString(-5) }, // 5 days ago
      { mood_level: 2, entry_date: getDateString(-4) }, // 4 days ago
      { mood_level: 5, entry_date: getDateString(-3) }, // 3 days ago
      { mood_level: 3, entry_date: getDateString(-2) }, // 2 days ago
      { mood_level: 4, entry_date: getDateString(-1) }, // Yesterday
      { mood_level: 4, entry_date: getDateString(0) }   // Today
    ];
    
    for (const mood of moods) {
      try {
        await makeAuthRequest(TEST_CONFIG.endpoints.saveMood, {
          method: 'POST',
          data: mood
        });
        console.log(`✅ Saved mood ${mood.mood_level} for ${mood.entry_date}`);
      } catch (error) {
        console.log(`❌ Failed to save mood for ${mood.entry_date}`);
      }
    }
    
    console.log('✅ Multiple mood entries test completed');
    
  } catch (error) {
    console.error('❌ Failed to save multiple mood entries');
    throw error;
  }
};

// Helper function to get date string
const getDateString = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Mood Tracker Backend Tests...');
  console.log('==========================================');
  
  if (TEST_CONFIG.authToken === 'your-auth-token-here') {
    console.log('⚠️ Please update TEST_CONFIG.authToken with a valid token');
    console.log('   You can get this from localStorage.getItem("token") in your browser');
    return;
  }
  
  try {
    // Run tests
    await testGetMoodTypes();
    await testSaveMoodEntry();
    await testGetTodayMood();
    await testSaveMultipleMoods();
    await testGetWeeklyHistory();
    await testGetMoodStats();
    
    console.log('\n✅ All tests completed successfully!');
    
    console.log('\n📋 Frontend Integration:');
    console.log('1. Replace your MoodTracker component with MoodTracker-with-backend.jsx');
    console.log('2. Make sure backend server is running');
    console.log('3. Test mood selection and chart display');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testGetMoodTypes,
  testSaveMoodEntry,
  testGetTodayMood,
  testGetWeeklyHistory,
  testGetMoodStats
};
