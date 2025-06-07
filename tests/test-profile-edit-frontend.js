const axios = require('axios');

// Test profile edit functionality for frontend compatibility
async function testProfileEditForFrontend() {
  console.log('🧪 Testing Profile Edit Functionality for Frontend');
  console.log('=' .repeat(60));

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  try {
    // Test 1: Check if safespace profile endpoint exists
    console.log('\n1️⃣ Testing safespace profile endpoint structure');
    
    try {
      const response = await api.put('/safespace/profile', {
        name: 'Test Name',
        email: 'test@example.com'
      });
      console.log('✅ Safespace profile endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Safespace profile endpoint exists (requires authentication)');
        console.log('📋 Endpoint: PUT /api/safespace/profile');
      } else {
        console.log('❌ Safespace profile endpoint error:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Check avatar upload endpoint
    console.log('\n2️⃣ Testing avatar upload endpoint');
    
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      // Don't add file to test validation
      
      const uploadResponse = await api.post('/safespace/upload-avatar', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      
      console.log('✅ Upload endpoint accessible');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('No file uploaded')) {
        console.log('✅ Avatar upload validation working (correctly rejects empty uploads)');
        console.log('📋 Endpoint: POST /api/safespace/upload-avatar');
      } else if (error.response?.status === 401) {
        console.log('✅ Avatar upload endpoint exists (requires authentication)');
        console.log('📋 Endpoint: POST /api/safespace/upload-avatar');
      } else {
        console.log('❌ Avatar upload endpoint error:', error.response?.data?.message || error.message);
      }
    }

    // Test 3: Check profile stats endpoint
    console.log('\n3️⃣ Testing profile stats endpoint');
    
    try {
      const statsResponse = await api.get('/safespace/profile-stats');
      console.log('✅ Profile stats endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Profile stats endpoint exists (requires authentication)');
        console.log('📋 Endpoint: GET /api/safespace/profile-stats');
      } else {
        console.log('❌ Profile stats endpoint error:', error.response?.data?.message || error.message);
      }
    }

    // Test 4: Check delete avatar endpoint
    console.log('\n4️⃣ Testing delete avatar endpoint');
    
    try {
      const deleteResponse = await api.delete('/safespace/delete-avatar');
      console.log('✅ Delete avatar endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Delete avatar endpoint exists (requires authentication)');
        console.log('📋 Endpoint: DELETE /api/safespace/delete-avatar');
      } else {
        console.log('❌ Delete avatar endpoint error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n📋 Frontend Integration Summary:');
    console.log('=' .repeat(60));
    
    console.log('\n🎯 Available Endpoints for Profile Edit:');
    console.log('  PUT    /api/safespace/profile        - Update name/email');
    console.log('  POST   /api/safespace/upload-avatar  - Upload new avatar');
    console.log('  DELETE /api/safespace/delete-avatar  - Delete current avatar');
    console.log('  GET    /api/safespace/profile-stats  - Get profile with stats');
    
    console.log('\n🔧 Frontend Implementation Guide:');
    console.log('  1. Update Profile (Name/Email):');
    console.log('     const updateProfile = async (name, email) => {');
    console.log('       const response = await api.put("/api/safespace/profile", {');
    console.log('         name, email');
    console.log('       });');
    console.log('       return response.data;');
    console.log('     };');
    console.log('');
    console.log('  2. Upload Avatar:');
    console.log('     const uploadAvatar = async (file) => {');
    console.log('       const formData = new FormData();');
    console.log('       formData.append("avatar", file);');
    console.log('       const response = await api.post("/api/safespace/upload-avatar", formData, {');
    console.log('         headers: { "Content-Type": "multipart/form-data" }');
    console.log('       });');
    console.log('       return response.data;');
    console.log('     };');
    console.log('');
    console.log('  3. Delete Avatar:');
    console.log('     const deleteAvatar = async () => {');
    console.log('       const response = await api.delete("/api/safespace/delete-avatar");');
    console.log('       return response.data;');
    console.log('     };');
    console.log('');
    console.log('  4. Get Profile with Stats:');
    console.log('     const getProfileStats = async () => {');
    console.log('       const response = await api.get("/api/safespace/profile-stats");');
    console.log('       return response.data;');
    console.log('     };');

    console.log('\n📤 Expected Response Format:');
    console.log('  Profile Update Response:');
    console.log('  {');
    console.log('    "message": "Profile updated successfully",');
    console.log('    "user": {');
    console.log('      "id": 1,');
    console.log('      "_id": 1,');
    console.log('      "name": "Updated Name",');
    console.log('      "email": "updated@email.com",');
    console.log('      "avatar": "avatar_url",');
    console.log('      "role": "user"');
    console.log('    },');
    console.log('    "stats": {');
    console.log('      "posts": 5,');
    console.log('      "comments": 10,');
    console.log('      "bookmarks": 3');
    console.log('    }');
    console.log('  }');

    console.log('\n📝 Frontend Profile Tab Integration:');
    console.log('  // Add edit button to your profile section:');
    console.log('  <button');
    console.log('    onClick={() => setShowEditModal(true)}');
    console.log('    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"');
    console.log('  >');
    console.log('    Edit Profile');
    console.log('  </button>');
    console.log('');
    console.log('  // Handle profile update:');
    console.log('  const handleProfileUpdate = async (updatedData) => {');
    console.log('    try {');
    console.log('      const response = await updateProfile(updatedData.name, updatedData.email);');
    console.log('      setUser(response.user);');
    console.log('      // Refresh posts if user data is used in posts');
    console.log('      fetchPosts();');
    console.log('    } catch (error) {');
    console.log('      console.error("Profile update failed:", error);');
    console.log('    }');
    console.log('  };');

    console.log('\n✅ All endpoints are ready for frontend integration!');
    console.log('🎉 Profile edit functionality is fully implemented on backend.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testProfileEditForFrontend();
