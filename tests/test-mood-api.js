// Simple test for mood API
const axios = require('axios');

const testMoodAPI = async () => {
  console.log('🧪 Testing Mood API...');
  
  try {
    // Test 1: Get mood types (public endpoint)
    console.log('\n1. Testing GET /api/mood/types...');
    const response = await axios.get('http://localhost:5000/api/mood/types');
    console.log('✅ Status:', response.status);
    console.log('📊 Data:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

testMoodAPI();
