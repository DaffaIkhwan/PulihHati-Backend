// Test script untuk Render deployment
// Jalankan dengan: node test-render-deployment.js

const https = require('https');

// Ganti dengan URL Render Anda setelah deployment
const RENDER_URL = 'https://pulih-hati-backend.onrender.com';

const endpoints = [
  '/health',
  '/api/health',
  '/api',
  '/api/auth',
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${url}`);
    
    const req = https.get(url, { timeout: 15000 }, (res) => {
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`   ✅ Response: ${JSON.stringify(jsonData, null, 2)}`);
          } catch {
            console.log(`   📄 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
          }
        }
        resolve({ 
          url, 
          status: res.statusCode, 
          success: res.statusCode < 400,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ url, error: error.message, success: false });
    });
    
    req.on('timeout', () => {
      console.log(`   ⏰ Timeout: Request took too long`);
      req.destroy();
      resolve({ url, error: 'Timeout', success: false });
    });
  });
}

async function main() {
  console.log('🚀 Testing Render Backend Deployment');
  console.log('====================================');
  console.log(`Base URL: ${RENDER_URL}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const fullUrl = RENDER_URL + endpoint;
    const result = await testEndpoint(fullUrl);
    results.push(result);
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('\n✅ Working Endpoints:');
    successful.forEach(r => {
      console.log(`   - ${r.url} (${r.status})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Endpoints:');
    failed.forEach(r => {
      console.log(`   - ${r.url} (${r.error || r.status})`);
    });
  }
  
  console.log(`\n🎯 Success Rate: ${successful.length}/${results.length} (${Math.round(successful.length/results.length*100)}%)`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Render deployment is working!');
    console.log('📝 Update your frontend .env file:');
    console.log(`VITE_API_BASE_URL=${RENDER_URL}/api`);
  } else {
    console.log('\n⚠️  Deployment needs troubleshooting');
    console.log('Check Render logs for more details');
  }
}

main().catch(console.error);
