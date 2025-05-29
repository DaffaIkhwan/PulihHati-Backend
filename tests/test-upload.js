const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid JWT token
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

async function testUploadEndpoints() {
  try {
    console.log('🧪 Testing Upload API Endpoints...\n');

    // Test 1: Check upload endpoints availability
    console.log('1️⃣ Testing endpoint availability');
    
    try {
      // Test profile stats endpoint (doesn't require file upload)
      const statsResponse = await api.get('/upload/profile-stats');
      console.log('✅ Profile stats endpoint working');
      console.log(`📊 User stats:`, statsResponse.data.stats);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Profile stats test skipped (need valid JWT token)');
      } else {
        console.log('❌ Profile stats endpoint error:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Test file upload structure (without actual file)
    console.log('\n2️⃣ Testing upload structure');
    
    try {
      const formData = new FormData();
      // Don't add file to test validation
      
      const uploadResponse = await api.post('/upload/avatar', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      
      console.log('✅ Upload endpoint accessible');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('No file uploaded')) {
        console.log('✅ Upload validation working (correctly rejects empty uploads)');
      } else if (error.response?.status === 401) {
        console.log('⚠️ Upload test skipped (need valid JWT token)');
      } else {
        console.log('❌ Upload endpoint error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n📋 Available Upload Endpoints:');
    console.log('  POST   /api/upload/avatar        - Upload user avatar');
    console.log('  DELETE /api/upload/avatar        - Delete user avatar');
    console.log('  GET    /api/upload/profile-stats - Get user profile stats');
    
    console.log('\n📝 Upload Requirements:');
    console.log('  - File field name: "avatar"');
    console.log('  - Supported formats: JPEG, PNG, GIF, WebP');
    console.log('  - Maximum file size: 5MB');
    console.log('  - Authentication: JWT token required');
    
    console.log('\n🔧 Frontend Integration:');
    console.log('  const formData = new FormData();');
    console.log('  formData.append("avatar", file);');
    console.log('  const response = await api.post("/api/upload/avatar", formData, {');
    console.log('    headers: { "Content-Type": "multipart/form-data" }');
    console.log('  });');
    
    console.log('\n📤 Response Format:');
    console.log('  {');
    console.log('    "message": "Avatar uploaded successfully",');
    console.log('    "user": { "id": 1, "name": "User", "email": "user@example.com", "avatar": "url" },');
    console.log('    "avatar": {');
    console.log('      "small": "optimized_small_url",');
    console.log('      "medium": "optimized_medium_url",');
    console.log('      "large": "optimized_large_url",');
    console.log('      "original": "original_url"');
    console.log('    }');
    console.log('  }');

    console.log('\n🎉 Upload system ready for testing with valid JWT token!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testUploadEndpoints();
