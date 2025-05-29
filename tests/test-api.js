const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImlhdCI6MTczMjU3NzU1MSwiZXhwIjoxNzM1MTY5NTUxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // Replace with actual token

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testEndpoints() {
  try {
    console.log('🧪 Testing API Endpoints...\n');

    // Test 1: Get posts
    console.log('1️⃣ Testing GET /safespace/posts');
    const postsResponse = await api.get('/safespace/posts');
    console.log('✅ Posts fetched successfully');
    console.log(`📊 Found ${postsResponse.data.length} posts`);
    
    if (postsResponse.data.length > 0) {
      const firstPost = postsResponse.data[0];
      console.log(`📝 First post ID: ${firstPost.id || firstPost._id}`);
      console.log(`📝 First post content: ${firstPost.content.substring(0, 50)}...`);
      console.log(`❤️ Likes: ${firstPost.likes_count}, 💬 Comments: ${firstPost.comments_count}, 🔖 Bookmarked: ${firstPost.bookmarked}`);
      
      const testPostId = firstPost.id || firstPost._id;
      
      // Test 2: Like post
      console.log('\n2️⃣ Testing PUT /safespace/posts/:id/like');
      const likeResponse = await api.put(`/safespace/posts/${testPostId}/like`);
      console.log('✅ Like toggled successfully');
      console.log(`❤️ Updated likes:`, likeResponse.data);
      
      // Test 3: Add comment
      console.log('\n3️⃣ Testing POST /safespace/posts/:id/comments');
      const commentResponse = await api.post(`/safespace/posts/${testPostId}/comments`, {
        content: 'This is a test comment from API test'
      });
      console.log('✅ Comment added successfully');
      console.log(`💬 Updated comments:`, commentResponse.data);
      
      // Test 4: Toggle bookmark
      console.log('\n4️⃣ Testing PUT /safespace/posts/:id/bookmark');
      const bookmarkResponse = await api.put(`/safespace/posts/${testPostId}/bookmark`);
      console.log('✅ Bookmark toggled successfully');
      console.log(`🔖 User bookmarks:`, bookmarkResponse.data);
      
      // Test 5: Get bookmarked posts
      console.log('\n5️⃣ Testing GET /safespace/bookmarks');
      const bookmarkedResponse = await api.get('/safespace/bookmarks');
      console.log('✅ Bookmarked posts fetched successfully');
      console.log(`📚 Found ${bookmarkedResponse.data.length} bookmarked posts`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('📍 Status:', error.response?.status);
    console.error('🔗 URL:', error.config?.url);
  }
}

// Run tests
testEndpoints();
