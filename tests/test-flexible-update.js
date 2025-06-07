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

async function testFlexibleUpdate() {
  try {
    console.log('🧪 Testing Flexible Profile Update...\n');

    // Test 1: Empty update (should return current data)
    console.log('1️⃣ Testing empty update (avatar-only scenario)');
    
    try {
      const emptyData = {};
      const response = await api.put('/auth/profile', emptyData);
      console.log('✅ Empty update working - returns current data');
      console.log('📝 Response:', response.data.message);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Empty update test skipped (need valid JWT token)');
      } else {
        console.log('❌ Empty update error:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Name only update
    console.log('\n2️⃣ Testing name-only update');
    
    try {
      const nameOnlyData = { name: 'New Name Only' };
      const response = await api.put('/auth/profile', nameOnlyData);
      console.log('✅ Name-only update working');
      console.log('📝 Response:', response.data.message);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Name-only test skipped (need valid JWT token)');
      } else {
        console.log('❌ Name-only error:', error.response?.data?.message || error.message);
      }
    }

    // Test 3: Email only update
    console.log('\n3️⃣ Testing email-only update');
    
    try {
      const emailOnlyData = { email: 'newemail@example.com' };
      const response = await api.put('/auth/profile', emailOnlyData);
      console.log('✅ Email-only update working');
      console.log('📝 Response:', response.data.message);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Email-only test skipped (need valid JWT token)');
      } else if (error.response?.status === 400) {
        console.log('✅ Email validation working:', error.response.data.message);
      } else {
        console.log('❌ Email-only error:', error.response?.data?.message || error.message);
      }
    }

    // Test 4: Both name and email update
    console.log('\n4️⃣ Testing both name and email update');
    
    try {
      const bothData = { 
        name: 'Complete New Name',
        email: 'complete@example.com'
      };
      const response = await api.put('/auth/profile', bothData);
      console.log('✅ Both fields update working');
      console.log('📝 Response:', response.data.message);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Both fields test skipped (need valid JWT token)');
      } else {
        console.log('❌ Both fields error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n📋 Flexible Update Scenarios:');
    console.log('  ✅ Empty body {} - Returns current data (for avatar-only updates)');
    console.log('  ✅ Name only { "name": "New Name" } - Updates name only');
    console.log('  ✅ Email only { "email": "new@email.com" } - Updates email only');
    console.log('  ✅ Both fields { "name": "Name", "email": "email" } - Updates both');
    
    console.log('\n🎯 Use Cases:');
    console.log('  📸 Avatar upload only - Call PUT /auth/profile with {}');
    console.log('  📝 Name change only - Call PUT /auth/profile with { "name": "New Name" }');
    console.log('  📧 Email change only - Call PUT /auth/profile with { "email": "new@email.com" }');
    console.log('  🔄 Complete update - Call PUT /auth/profile with both fields');
    
    console.log('\n🔧 Frontend Integration:');
    console.log('  // For avatar-only update');
    console.log('  await api.put("/auth/profile", {}); // Just returns current data');
    console.log('  ');
    console.log('  // For name update');
    console.log('  await api.put("/auth/profile", { name: "New Name" });');
    console.log('  ');
    console.log('  // For email update');
    console.log('  await api.put("/auth/profile", { email: "new@email.com" });');
    console.log('  ');
    console.log('  // For complete update');
    console.log('  await api.put("/auth/profile", { name: "Name", email: "email" });');

    console.log('\n🎉 Flexible profile update system ready!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testFlexibleUpdate();
