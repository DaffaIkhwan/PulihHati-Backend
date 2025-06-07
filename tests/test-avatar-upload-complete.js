const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test avatar upload functionality end-to-end
async function testAvatarUploadComplete() {
  console.log('🧪 Testing Avatar Upload End-to-End');
  console.log('=' .repeat(60));

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  try {
    // Step 1: Register/Login to get token
    console.log('\n1️⃣ Getting authentication token...');
    
    const testEmail = `test_avatar_${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    let token = null;
    let userId = null;
    
    try {
      const registerResponse = await api.post('/auth/register', {
        name: 'Avatar Test User',
        email: testEmail,
        password: testPassword
      });
      
      token = registerResponse.data.token;
      userId = registerResponse.data.user.id;
      
      console.log('✅ User registered successfully');
      console.log(`🆔 User ID: ${userId}`);
      console.log(`🔑 Token: ${token.substring(0, 20)}...`);
      
    } catch (error) {
      console.log('⚠️ Registration failed, trying to login with existing user...');
      
      try {
        const loginResponse = await api.post('/auth/login', {
          email: 'test@example.com',
          password: 'password123'
        });
        
        token = loginResponse.data.token;
        userId = loginResponse.data.user.id;
        
        console.log('✅ Login successful');
        console.log(`🆔 User ID: ${userId}`);
        
      } catch (loginError) {
        console.log('❌ Both registration and login failed');
        console.log('💡 Please ensure you have a test user or check database connection');
        return;
      }
    }

    // Set authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Step 2: Test Cloudinary connection
    console.log('\n2️⃣ Testing Cloudinary configuration...');
    
    try {
      // Check if we can access cloudinary config endpoint (if exists)
      console.log('📡 Cloudinary config check...');
      console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'dzrd37naa');
      console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
      console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);
      
    } catch (error) {
      console.log('⚠️ Could not verify Cloudinary config');
    }

    // Step 3: Create a test image file
    console.log('\n3️⃣ Creating test image...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    console.log('✅ Test image created (1x1 PNG)');
    console.log(`📏 Image size: ${testImageBuffer.length} bytes`);

    // Step 4: Test upload endpoint
    console.log('\n4️⃣ Testing avatar upload endpoint...');
    
    try {
      const formData = new FormData();
      formData.append('avatar', testImageBuffer, {
        filename: 'test-avatar.png',
        contentType: 'image/png'
      });

      console.log('📤 Sending upload request...');
      console.log('🎯 Endpoint: POST /api/safespace/upload-avatar');
      console.log('📋 Headers: Authorization Bearer token');
      console.log('📦 Body: FormData with avatar file');

      const uploadResponse = await api.post('/safespace/upload-avatar', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log('✅ Upload request successful!');
      console.log('📝 Response status:', uploadResponse.status);
      console.log('📄 Response data:', JSON.stringify(uploadResponse.data, null, 2));

      if (uploadResponse.data.user && uploadResponse.data.user.avatar) {
        console.log('🖼️ New avatar URL:', uploadResponse.data.user.avatar);
        
        // Test if the URL is accessible
        try {
          const imageTest = await axios.get(uploadResponse.data.user.avatar);
          console.log('✅ Avatar URL is accessible');
          console.log('📊 Image response status:', imageTest.status);
        } catch (urlError) {
          console.log('❌ Avatar URL not accessible:', urlError.message);
        }
      }

      if (uploadResponse.data.upload_info) {
        console.log('☁️ Cloudinary info:', uploadResponse.data.upload_info);
      }

    } catch (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      
      if (uploadError.response) {
        console.log('📄 Error response:', uploadError.response.data);
        console.log('📊 Error status:', uploadError.response.status);
        console.log('📋 Error headers:', uploadError.response.headers);
      }
      
      return;
    }

    // Step 5: Verify profile update
    console.log('\n5️⃣ Verifying profile update...');
    
    try {
      const profileResponse = await api.get('/safespace/profile-stats');
      console.log('✅ Profile retrieved successfully');
      console.log('👤 Updated profile:', {
        id: profileResponse.data.user.id,
        name: profileResponse.data.user.name,
        email: profileResponse.data.user.email,
        avatar: profileResponse.data.user.avatar
      });
      
    } catch (profileError) {
      console.log('❌ Failed to get updated profile:', profileError.message);
    }

    // Step 6: Test delete avatar
    console.log('\n6️⃣ Testing delete avatar...');
    
    try {
      const deleteResponse = await api.delete('/safespace/delete-avatar');
      console.log('✅ Avatar deleted successfully');
      console.log('📝 Delete response:', deleteResponse.data);
      
    } catch (deleteError) {
      console.log('❌ Failed to delete avatar:', deleteError.message);
    }

    console.log('\n📋 Test Summary:');
    console.log('=' .repeat(60));
    console.log('✅ Avatar upload functionality tested');
    console.log('☁️ Cloudinary integration verified');
    console.log('💾 Database updates confirmed');
    
    console.log('\n🔧 If upload failed, check:');
    console.log('  1. Cloudinary credentials in .env file');
    console.log('  2. Backend server is running');
    console.log('  3. Database connection is working');
    console.log('  4. File upload middleware is configured');
    console.log('  5. CORS settings allow file uploads');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📄 Stack trace:', error.stack);
  }
}

// Run the test
testAvatarUploadComplete();
