// Test script for Vercel deployment
// Run with: node test-vercel-deployment.cjs

const https = require('https');

const BACKEND_URLS = [
  'https://pulih-hati-backend.vercel.app',
  'https://pulih-hati-backend.vercel.app/health',
  'https://pulih-hati-backend.vercel.app/api/auth',
  'https://pulih-hati-backend-obpvpxn7l-daffaikhwans-projects.vercel.app',
  'https://pulih-hati-backend-obpvpxn7l-daffaikhwans-projects.vercel.app/health'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${url}`);
    
    const req = https.get(url, { timeout: 10000 }, (res) => {
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`   Response: ${JSON.stringify(jsonData, null, 2)}`);
          } catch {
            console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
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
      console.log(`   ⏱️ Timeout`);
      req.destroy();
      resolve({ url, error: 'Timeout', success: false });
    });
  });
}

async function main() {
  console.log('🚀 Testing Vercel Backend Deployment');
  console.log('====================================');
  
  const results = [];
  
  for (const url of BACKEND_URLS) {
    const result = await testUrl(url);
    results.push(result);
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('\n✅ Working URLs:');
    successful.forEach(r => {
      console.log(`   - ${r.url} (${r.status})`);
      if (r.data && r.data.includes('status')) {
        console.log(`     Response indicates API is working`);
      }
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed URLs:');
    failed.forEach(r => console.log(`   - ${r.url} (${r.error || 'Unknown error'})`));
  }
  
  console.log('\n💡 Next Steps:');
  if (successful.length > 0) {
    console.log('   ✅ Backend is accessible!');
    console.log('   📝 Update frontend .env with working URL');
    console.log('   🧪 Test API endpoints with authentication');
  } else {
    console.log('   ❌ Backend still not accessible');
    console.log('   🔄 Check Vercel deployment logs');
    console.log('   ⚙️ Verify vercel.json configuration');
    console.log('   🔑 Check environment variables in Vercel dashboard');
  }
}

main().catch(console.error);
