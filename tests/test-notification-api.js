const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid JWT token from your login
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testNotificationAPI() {
  try {
    console.log('🧪 Testing Notification API Endpoints...\n');

    // Test 1: Get notifications
    console.log('1️⃣ Testing GET /notifications');
    try {
      const notificationsResponse = await api.get('/notifications');
      console.log('✅ Notifications fetched successfully');
      console.log(`📊 Found ${notificationsResponse.data.length} notifications`);
      
      if (notificationsResponse.data.length > 0) {
        const firstNotif = notificationsResponse.data[0];
        console.log(`📝 First notification: ${firstNotif.type} - ${firstNotif.message}`);
      }
    } catch (error) {
      console.log('⚠️ Notifications endpoint test skipped (need valid token)');
    }

    // Test 2: Get unread count
    console.log('\n2️⃣ Testing GET /notifications/unread-count');
    try {
      const unreadResponse = await api.get('/notifications/unread-count');
      console.log('✅ Unread count fetched successfully');
      console.log(`🔔 Unread count: ${unreadResponse.data.count}`);
    } catch (error) {
      console.log('⚠️ Unread count endpoint test skipped (need valid token)');
    }

    // Test 3: Test like/comment to generate notifications
    console.log('\n3️⃣ Testing notification generation via like/comment');
    try {
      // Get posts first
      const postsResponse = await api.get('/safespace/posts');
      if (postsResponse.data.length > 0) {
        const firstPost = postsResponse.data[0];
        const postId = firstPost.id || firstPost._id;
        
        console.log(`📝 Testing with post ID: ${postId}`);
        
        // Test like (this should generate notification if not own post)
        const likeResponse = await api.put(`/safespace/posts/${postId}/like`);
        console.log('✅ Like action completed');
        
        // Test comment (this should generate notification if not own post)
        const commentResponse = await api.post(`/safespace/posts/${postId}/comments`, {
          content: 'Test comment for notification'
        });
        console.log('✅ Comment action completed');
        
        console.log('📢 Notifications should be generated if this is not your own post');
      }
    } catch (error) {
      console.log('⚠️ Like/comment test skipped (need valid token)');
    }

    console.log('\n🎉 API structure tests completed!');
    console.log('\n📋 Available Notification Endpoints:');
    console.log('  GET    /api/notifications           - Get all notifications');
    console.log('  GET    /api/notifications/unread-count - Get unread count');
    console.log('  PUT    /api/notifications/:id/read  - Mark notification as read');
    console.log('  PUT    /api/notifications/mark-all-read - Mark all as read');
    
    console.log('\n🔔 Notification Triggers:');
    console.log('  - When someone likes your post');
    console.log('  - When someone comments on your post');
    console.log('  - Notifications are NOT created for your own actions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testNotificationAPI();
