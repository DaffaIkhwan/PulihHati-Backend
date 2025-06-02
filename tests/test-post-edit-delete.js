const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'daffaganteng@gmail.com',
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
const testLogin = async () => {
  console.log('\n🔐 Testing login...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const testCreatePost = async () => {
  console.log('\n📝 Testing create post...');
  try {
    const postData = {
      content: 'This is a test post for edit/delete functionality'
    };

    const result = await makeRequest('POST', '/safespace/posts', postData);
    testPostId = result._id || result.id;
    
    console.log('✅ Post created successfully');
    console.log(`   Post ID: ${testPostId}`);
    console.log(`   Content: ${result.content}`);
    console.log(`   Author: ${result.author.name}`);
    return true;
  } catch (error) {
    console.error('❌ Create post failed');
    return false;
  }
};

const testEditPost = async () => {
  console.log('\n✏️ Testing edit post...');
  try {
    const updatedContent = 'This post has been edited successfully!';
    const updateData = {
      content: updatedContent
    };

    const result = await makeRequest('PUT', `/safespace/posts/${testPostId}`, updateData);
    
    console.log('✅ Post edited successfully');
    console.log(`   Post ID: ${result._id || result.id}`);
    console.log(`   Updated Content: ${result.content}`);
    console.log(`   Updated At: ${result.updated_at}`);
    
    // Verify content was actually updated
    if (result.content === updatedContent) {
      console.log('✅ Content verification passed');
      return true;
    } else {
      console.log('❌ Content verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Edit post failed');
    return false;
  }
};

const testEditPostUnauthorized = async () => {
  console.log('\n🚫 Testing edit post unauthorized...');
  try {
    // Try to edit with invalid token
    const originalToken = authToken;
    authToken = 'invalid_token';
    
    const updateData = {
      content: 'This should fail'
    };

    await makeRequest('PUT', `/safespace/posts/${testPostId}`, updateData);
    
    // If we reach here, the test failed
    authToken = originalToken;
    console.log('❌ Unauthorized edit should have failed but succeeded');
    return false;
  } catch (error) {
    // Restore original token
    authToken = authToken === 'invalid_token' ? '' : authToken;
    
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized edit correctly rejected');
      return true;
    } else {
      console.log('❌ Unexpected error for unauthorized edit');
      return false;
    }
  }
};

const testEditNonexistentPost = async () => {
  console.log('\n🔍 Testing edit nonexistent post...');
  try {
    const updateData = {
      content: 'This should fail'
    };

    await makeRequest('PUT', '/safespace/posts/99999', updateData);
    
    console.log('❌ Edit nonexistent post should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Edit nonexistent post correctly rejected');
      return true;
    } else {
      console.log('❌ Unexpected error for nonexistent post edit');
      return false;
    }
  }
};

const testDeletePost = async () => {
  console.log('\n🗑️ Testing delete post...');
  try {
    const result = await makeRequest('DELETE', `/safespace/posts/${testPostId}`);
    
    console.log('✅ Post deleted successfully');
    console.log(`   Message: ${result.message}`);
    
    // Try to get the deleted post to verify it's gone
    try {
      await makeRequest('GET', `/safespace/posts/${testPostId}`);
      console.log('❌ Deleted post still accessible');
      return false;
    } catch (getError) {
      if (getError.response?.status === 404) {
        console.log('✅ Deleted post verification passed');
        return true;
      } else {
        console.log('❌ Unexpected error when verifying deleted post');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Delete post failed');
    return false;
  }
};

const testDeleteNonexistentPost = async () => {
  console.log('\n🔍 Testing delete nonexistent post...');
  try {
    await makeRequest('DELETE', '/safespace/posts/99999');
    
    console.log('❌ Delete nonexistent post should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Delete nonexistent post correctly rejected');
      return true;
    } else {
      console.log('❌ Unexpected error for nonexistent post delete');
      return false;
    }
  }
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Starting Post Edit/Delete API Tests');
  console.log('=====================================');

  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Create Post', fn: testCreatePost },
    { name: 'Edit Post', fn: testEditPost },
    { name: 'Edit Post Unauthorized', fn: testEditPostUnauthorized },
    { name: 'Edit Nonexistent Post', fn: testEditNonexistentPost },
    { name: 'Delete Post', fn: testDeletePost },
    { name: 'Delete Nonexistent Post', fn: testDeleteNonexistentPost }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
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
  testLogin,
  testCreatePost,
  testEditPost,
  testDeletePost
};
