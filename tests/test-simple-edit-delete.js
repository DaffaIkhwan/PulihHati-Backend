const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';

// Test with a user that should exist
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';
let testPostId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${url} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testRegisterAndLogin = async () => {
  console.log('\n🔐 Testing register and login...');
  
  // First try to register
  try {
    console.log('   Attempting to register...');
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    console.log('   ✅ Registration successful');
  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log('   ℹ️ User already exists, proceeding to login');
    } else {
      console.log('   ❌ Registration failed:', error.response?.data || error.message);
    }
  }

  // Now try to login
  try {
    console.log('   Attempting to login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('   ✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('   ❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const testCreatePost = async () => {
  console.log('\n📝 Testing create post...');
  try {
    const postData = {
      content: 'This is a test post for edit/delete functionality - ' + Date.now()
    };

    const result = await makeRequest('POST', '/safespace/posts', postData);
    testPostId = result._id || result.id;
    
    console.log('   ✅ Post created successfully');
    console.log(`   Post ID: ${testPostId}`);
    console.log(`   Content: ${result.content}`);
    return true;
  } catch (error) {
    console.error('   ❌ Create post failed');
    return false;
  }
};

const testEditPost = async () => {
  console.log('\n✏️ Testing edit post...');
  try {
    const updatedContent = 'This post has been edited successfully! - ' + Date.now();
    const updateData = {
      content: updatedContent
    };

    const result = await makeRequest('PUT', `/safespace/posts/${testPostId}`, updateData);
    
    console.log('   ✅ Post edited successfully');
    console.log(`   Post ID: ${result._id || result.id}`);
    console.log(`   Updated Content: ${result.content}`);
    
    // Verify content was actually updated
    if (result.content === updatedContent) {
      console.log('   ✅ Content verification passed');
      return true;
    } else {
      console.log('   ❌ Content verification failed');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Edit post failed');
    return false;
  }
};

const testDeletePost = async () => {
  console.log('\n🗑️ Testing delete post...');
  try {
    const result = await makeRequest('DELETE', `/safespace/posts/${testPostId}`);
    
    console.log('   ✅ Post deleted successfully');
    console.log(`   Message: ${result.message}`);
    return true;
  } catch (error) {
    console.error('   ❌ Delete post failed');
    return false;
  }
};

const testEditValidation = async () => {
  console.log('\n🔍 Testing edit validation...');
  
  // First create a new post for this test
  try {
    const postData = {
      content: 'Post for validation test'
    };
    const createResult = await makeRequest('POST', '/safespace/posts', postData);
    const validationTestPostId = createResult._id || createResult.id;
    
    // Test empty content
    try {
      await makeRequest('PUT', `/safespace/posts/${validationTestPostId}`, { content: '' });
      console.log('   ❌ Empty content should have been rejected');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Empty content correctly rejected');
      } else {
        console.log('   ❌ Unexpected error for empty content');
        return false;
      }
    }
    
    // Test invalid post ID
    try {
      await makeRequest('PUT', '/safespace/posts/99999', { content: 'test' });
      console.log('   ❌ Invalid post ID should have been rejected');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ✅ Invalid post ID correctly rejected');
      } else {
        console.log('   ❌ Unexpected error for invalid post ID');
        return false;
      }
    }
    
    // Clean up - delete the test post
    await makeRequest('DELETE', `/safespace/posts/${validationTestPostId}`);
    console.log('   ✅ Validation test completed');
    return true;
    
  } catch (error) {
    console.error('   ❌ Validation test setup failed');
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Starting Simple Post Edit/Delete API Tests');
  console.log('==============================================');

  const tests = [
    { name: 'Register and Login', fn: testRegisterAndLogin },
    { name: 'Create Post', fn: testCreatePost },
    { name: 'Edit Post', fn: testEditPost },
    { name: 'Delete Post', fn: testDeletePost },
    { name: 'Edit Validation', fn: testEditValidation }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} - PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
    }
  }

  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Post edit/delete functionality is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the backend implementation.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testRegisterAndLogin,
  testCreatePost,
  testEditPost,
  testDeletePost
};
