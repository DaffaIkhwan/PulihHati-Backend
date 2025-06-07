const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid JWT token
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testProfileUpdate() {
  try {
    console.log('🧪 Testing Profile Update Endpoints...\n');

    // Test 1: Test profile update endpoint availability
    console.log('1️⃣ Testing profile update endpoint');
    
    try {
      const updateData = {
        name: 'Test Update Name',
        email: 'test@example.com'
      };
      
      const response = await api.put('/users/profile', updateData);
      console.log('✅ Profile update endpoint working');
      console.log('📝 Response:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Profile update test skipped (need valid JWT token)');
        console.log('📋 Expected endpoint: PUT /api/users/profile');
        console.log('📤 Expected body: { "name": "New Name", "email": "new@email.com" }');
      } else if (error.response?.status === 400) {
        console.log('✅ Profile update validation working');
        console.log('📝 Error:', error.response.data.message);
      } else {
        console.log('❌ Profile update error:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Test validation
    console.log('\n2️⃣ Testing validation');
    
    try {
      const emptyData = {};
      const response = await api.put('/users/profile', emptyData);
      console.log('❌ Validation should have failed');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('provide name or email')) {
        console.log('✅ Validation working (correctly rejects empty data)');
      } else if (error.response?.status === 401) {
        console.log('⚠️ Validation test skipped (need valid JWT token)');
      } else {
        console.log('❌ Unexpected validation error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n📋 Available Profile Endpoints:');
    console.log('  PUT    /api/users/profile         - Update current user profile');
    console.log('  PUT    /api/users/:id            - Update specific user (admin/self)');
    console.log('  POST   /api/upload/avatar        - Upload avatar');
    console.log('  DELETE /api/upload/avatar        - Delete avatar');
    console.log('  GET    /api/upload/profile-stats - Get profile stats');
    
    console.log('\n📝 Profile Update Requirements:');
    console.log('  - Authentication: JWT token required');
    console.log('  - Body: { "name": "string", "email": "string" }');
    console.log('  - At least one field (name or email) must be provided');
    console.log('  - Email must be unique');
    
    console.log('\n🔧 Frontend Integration:');
    console.log('  const updateProfile = async (name, email) => {');
    console.log('    const response = await api.put("/api/users/profile", {');
    console.log('      name, email');
    console.log('    });');
    console.log('    return response.data;');
    console.log('  };');
    
    console.log('\n📤 Response Format:');
    console.log('  {');
    console.log('    "message": "Profile updated successfully",');
    console.log('    "user": {');
    console.log('      "id": 1,');
    console.log('      "name": "Updated Name",');
    console.log('      "email": "updated@email.com",');
    console.log('      "avatar": "avatar_url",');
    console.log('      "role": "user",');
    console.log('      "created_at": "timestamp"');
    console.log('    }');
    console.log('  }');

    console.log('\n🎉 Profile update system ready for testing with valid JWT token!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testProfileUpdate();
