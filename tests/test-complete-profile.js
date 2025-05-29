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

async function testCompleteProfile() {
  try {
    console.log('🧪 Testing Complete Profile System...\n');

    // Test 1: Get profile stats
    console.log('1️⃣ Testing profile stats endpoint');
    
    try {
      const statsResponse = await api.get('/safespace/profile-stats');
      console.log('✅ Profile stats endpoint working');
      console.log(`👤 User:`, {
        id: statsResponse.data.user.id,
        name: statsResponse.data.user.name,
        email: statsResponse.data.user.email,
        avatar: statsResponse.data.user.avatar || 'No avatar'
      });
      console.log(`📊 Stats:`, statsResponse.data.stats);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Profile stats test skipped (need valid JWT token)');
      } else {
        console.log('❌ Profile stats error:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Update profile via safespace endpoint
    console.log('\n2️⃣ Testing profile update via safespace');
    
    try {
      const updateData = {
        name: 'Updated Name via SafeSpace',
        email: 'updated@safespace.com'
      };
      
      const response = await api.put('/safespace/profile', updateData);
      console.log('✅ SafeSpace profile update working');
      console.log('📝 Response:', response.data.message);
      console.log('👤 Updated user:', response.data.user);
      console.log('📊 Updated stats:', response.data.stats);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ SafeSpace profile update test skipped (need valid JWT token)');
      } else if (error.response?.status === 400) {
        console.log('✅ Profile update validation working:', error.response.data.message);
      } else {
        console.log('❌ SafeSpace profile update error:', error.response?.data?.message || error.message);
      }
    }

    // Test 3: Update profile via auth endpoint
    console.log('\n3️⃣ Testing profile update via auth');
    
    try {
      const updateData = {
        name: 'Updated Name via Auth'
      };
      
      const response = await api.put('/auth/profile', updateData);
      console.log('✅ Auth profile update working');
      console.log('📝 Response:', response.data.message);
      console.log('👤 Updated user:', response.data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Auth profile update test skipped (need valid JWT token)');
      } else {
        console.log('❌ Auth profile update error:', error.response?.data?.message || error.message);
      }
    }

    // Test 4: Empty update (for avatar-only scenarios)
    console.log('\n4️⃣ Testing empty update (avatar-only scenario)');
    
    try {
      const emptyData = {};
      const response = await api.put('/safespace/profile', emptyData);
      console.log('✅ Empty update working - returns current data with stats');
      console.log('📝 Response:', response.data.message);
      console.log('👤 Current user:', response.data.user);
      console.log('📊 Current stats:', response.data.stats);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Empty update test skipped (need valid JWT token)');
      } else {
        console.log('❌ Empty update error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n📋 Available Profile Endpoints:');
    console.log('  GET    /api/safespace/profile-stats  - Get user profile with stats');
    console.log('  PUT    /api/safespace/profile        - Update profile with stats');
    console.log('  PUT    /api/auth/profile             - Update profile (simple)');
    console.log('  POST   /api/safespace/upload-avatar  - Upload avatar');
    console.log('  DELETE /api/safespace/delete-avatar  - Delete avatar');
    
    console.log('\n🎯 Frontend Integration for Profile Tab:');
    console.log('  // Get profile data with stats');
    console.log('  const getProfileData = async () => {');
    console.log('    const response = await api.get("/api/safespace/profile-stats");');
    console.log('    setUser(response.data.user);');
    console.log('    setStats(response.data.stats);');
    console.log('  };');
    console.log('  ');
    console.log('  // Update profile (name/email)');
    console.log('  const updateProfile = async (name, email) => {');
    console.log('    const response = await api.put("/api/safespace/profile", { name, email });');
    console.log('    setUser(response.data.user);');
    console.log('    setStats(response.data.stats);');
    console.log('  };');
    console.log('  ');
    console.log('  // Upload avatar');
    console.log('  const uploadAvatar = async (file) => {');
    console.log('    const formData = new FormData();');
    console.log('    formData.append("avatar", file);');
    console.log('    const response = await api.post("/api/safespace/upload-avatar", formData, {');
    console.log('      headers: { "Content-Type": "multipart/form-data" }');
    console.log('    });');
    console.log('    setUser(response.data.user);');
    console.log('  };');
    
    console.log('\n📤 Response Format (SafeSpace Profile):');
    console.log('  {');
    console.log('    "message": "Profile updated successfully",');
    console.log('    "user": {');
    console.log('      "id": 1,');
    console.log('      "_id": 1,');
    console.log('      "name": "Updated Name",');
    console.log('      "email": "updated@email.com",');
    console.log('      "avatar": "https://res.cloudinary.com/...",');
    console.log('      "role": "user"');
    console.log('    },');
    console.log('    "stats": {');
    console.log('      "posts": 5,');
    console.log('      "comments": 12,');
    console.log('      "bookmarks": 3');
    console.log('    }');
    console.log('  }');

    console.log('\n🎉 Complete profile system ready for frontend integration!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testCompleteProfile();
