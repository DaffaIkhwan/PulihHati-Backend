// Test script to verify avatar upload and display functionality
// Run this with: node test-avatar-display.js

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  // Replace with a valid token from your app
  authToken: 'your-auth-token-here',
  
  // Test endpoints
  endpoints: {
    profileStats: '/safespace/profile-stats',
    uploadAvatar: '/safespace/upload-avatar'
  }
};

// Helper function to make authenticated requests
const makeAuthRequest = async (endpoint, options = {}) => {
  try {
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
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

// Test 1: Check current profile and avatar URL
const testCurrentProfile = async () => {
  console.log('\n🔍 Test 1: Checking current profile...');
  
  try {
    const data = await makeAuthRequest(TEST_CONFIG.endpoints.profileStats);
    
    console.log('✅ Profile data retrieved successfully');
    console.log('👤 User info:', {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      avatar: data.user.avatar
    });
    
    // Check avatar URL
    if (data.user.avatar) {
      console.log('🖼️ Avatar URL analysis:');
      console.log('  - URL:', data.user.avatar);
      console.log('  - Is Cloudinary URL:', data.user.avatar.includes('cloudinary.com'));
      console.log('  - Is default:', data.user.avatar === null);
      
      // Test if avatar URL is accessible
      try {
        const avatarResponse = await axios.head(data.user.avatar);
        console.log('  - URL accessible:', avatarResponse.status === 200);
        console.log('  - Content type:', avatarResponse.headers['content-type']);
      } catch (error) {
        console.log('  - URL accessible: false');
        console.log('  - Error:', error.message);
      }
    } else {
      console.log('⚠️ No avatar URL found');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Failed to get profile data');
    throw error;
  }
};

// Test 2: Validate Cloudinary configuration
const testCloudinaryConfig = async () => {
  console.log('\n🔍 Test 2: Validating Cloudinary configuration...');
  
  const cloudinaryBaseUrl = 'https://res.cloudinary.com/dzrd37naa';
  const testUrls = [
    `${cloudinaryBaseUrl}/image/upload/v1/pulih-hati/avatars/default-avatar.jpg`,
    `${cloudinaryBaseUrl}/image/upload/c_fill,g_face,h_300,w_300/v1/pulih-hati/avatars/default-avatar.jpg`
  ];
  
  for (const url of testUrls) {
    try {
      const response = await axios.head(url);
      console.log(`✅ ${url} - accessible (${response.status})`);
    } catch (error) {
      console.log(`❌ ${url} - not accessible (${error.response?.status || 'network error'})`);
    }
  }
};

// Test 3: Check database avatar storage
const testDatabaseAvatarStorage = async () => {
  console.log('\n🔍 Test 3: Checking database avatar storage...');
  
  try {
    const data = await makeAuthRequest(TEST_CONFIG.endpoints.profileStats);
    
    console.log('📊 Avatar storage analysis:');
    console.log('  - Raw avatar value:', JSON.stringify(data.user.avatar));
    console.log('  - Avatar type:', typeof data.user.avatar);
    console.log('  - Avatar length:', data.user.avatar?.length || 0);
    
    if (data.user.avatar) {
      // Check if it's a full URL or just a filename
      const isFullUrl = data.user.avatar.startsWith('http');
      const isCloudinaryUrl = data.user.avatar.includes('cloudinary.com');
      
      console.log('  - Is full URL:', isFullUrl);
      console.log('  - Is Cloudinary URL:', isCloudinaryUrl);
      
      if (isCloudinaryUrl) {
        // Extract public_id from URL
        const urlParts = data.user.avatar.split('/');
        const publicIdIndex = urlParts.findIndex(part => part === 'upload') + 1;
        if (publicIdIndex > 0 && publicIdIndex < urlParts.length) {
          const publicIdParts = urlParts.slice(publicIdIndex);
          console.log('  - Public ID parts:', publicIdParts);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to analyze database storage');
    throw error;
  }
};

// Test 4: Frontend integration recommendations
const provideFrontendRecommendations = (profileData) => {
  console.log('\n💡 Frontend Integration Recommendations:');
  
  const avatar = profileData?.user?.avatar;
  
  if (!avatar || avatar === null) {
    console.log('📝 Current Status: No custom avatar uploaded');
    console.log('🔧 Recommendation: Use default Cloudinary avatar');
    console.log('   const defaultAvatar = null;');
  } else if (avatar.includes('cloudinary.com')) {
    console.log('📝 Current Status: Valid Cloudinary avatar found');
    console.log('🔧 Recommendation: Use avatar URL directly with cache busting');
    console.log(`   const avatarUrl = "${avatar}";`);
    console.log('   const cacheBustedUrl = `${avatarUrl}?t=${Date.now()}`;');
  } else {
    console.log('📝 Current Status: Invalid or local avatar URL');
    console.log('🔧 Recommendation: Convert to Cloudinary URL or use default');
  }
  
  console.log('\n🎯 Key Frontend Implementation Points:');
  console.log('1. Always validate avatar URLs before displaying');
  console.log('2. Use cache busting parameters for updated images');
  console.log('3. Implement proper fallback to default avatar');
  console.log('4. Force image re-render after upload with key prop');
  console.log('5. Add loading states during upload');
  
  console.log('\n📋 Example Implementation:');
  console.log(`
const getValidAvatarUrl = (avatarUrl) => {
  if (avatarUrl && avatarUrl.includes('cloudinary.com') && avatarUrl !== null) {
    return avatarUrl;
  }
  return null;
};

// In your component:
const [avatarUrl, setAvatarUrl] = useState('');
const [imageKey, setImageKey] = useState(Date.now());

// After successful upload:
setAvatarUrl(getValidAvatarUrl(response.data.user.avatar));
setImageKey(Date.now()); // Force re-render

// In JSX:
<img
  key={\`avatar-\${imageKey}\`}
  src={\`\${avatarUrl}?t=\${imageKey}\`}
  alt="Profile"
  onError={(e) => {
    const defaultAvatar = null;
    if (e.target.src !== defaultAvatar) {
      e.target.src = defaultAvatar;
    }
  }}
/>
  `);
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Avatar Display Tests...');
  console.log('=====================================');
  
  if (TEST_CONFIG.authToken === 'your-auth-token-here') {
    console.log('⚠️ Please update TEST_CONFIG.authToken with a valid token');
    console.log('   You can get this from localStorage.getItem("token") in your browser');
    return;
  }
  
  try {
    // Run tests
    const profileData = await testCurrentProfile();
    await testCloudinaryConfig();
    await testDatabaseAvatarStorage();
    provideFrontendRecommendations(profileData);
    
    console.log('\n✅ All tests completed successfully!');
    
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
  testCurrentProfile,
  testCloudinaryConfig,
  testDatabaseAvatarStorage,
  provideFrontendRecommendations
};
