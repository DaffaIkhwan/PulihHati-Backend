const { cloudinary, testCloudinaryConnection, uploadImage } = require('../config/cloudinary');
const logger = require('../config/logger');

// Test Cloudinary connection and upload
async function testCloudinaryDirectly() {
  console.log('☁️ Testing Cloudinary Connection Directly');
  console.log('=' .repeat(50));

  try {
    // Step 1: Test connection
    console.log('\n1️⃣ Testing Cloudinary connection...');
    
    const pingResult = await testCloudinaryConnection();
    console.log('✅ Cloudinary connection successful');
    console.log('📝 Ping result:', pingResult);

    // Step 2: Test upload with a simple image
    console.log('\n2️⃣ Testing direct image upload...');
    
    // Create a simple base64 image (1x1 red pixel)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    console.log('📤 Uploading test image to Cloudinary...');
    
    const uploadResult = await uploadImage(testImageBase64, {
      public_id: `test_upload_${Date.now()}`,
      folder: 'pulih-hati/avatars'
    });
    
    console.log('✅ Upload successful!');
    console.log('📝 Upload result:', {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes
    });

    // Step 3: Test URL generation
    console.log('\n3️⃣ Testing URL generation...');
    
    const { getAvatarUrl } = require('../config/cloudinary');
    
    const avatarUrls = {
      small: getAvatarUrl(uploadResult.public_id, 'small'),
      medium: getAvatarUrl(uploadResult.public_id, 'medium'),
      large: getAvatarUrl(uploadResult.public_id, 'large')
    };
    
    console.log('🔗 Generated URLs:');
    console.log('  Small:', avatarUrls.small);
    console.log('  Medium:', avatarUrls.medium);
    console.log('  Large:', avatarUrls.large);

    // Step 4: Test delete
    console.log('\n4️⃣ Testing image deletion...');
    
    const { deleteImage } = require('../config/cloudinary');
    
    const deleteResult = await deleteImage(uploadResult.public_id);
    console.log('✅ Delete successful');
    console.log('📝 Delete result:', deleteResult);

    console.log('\n📋 Cloudinary Test Summary:');
    console.log('✅ Connection: Working');
    console.log('✅ Upload: Working');
    console.log('✅ URL Generation: Working');
    console.log('✅ Delete: Working');
    console.log('🎉 Cloudinary is fully functional!');

  } catch (error) {
    console.error('❌ Cloudinary test failed:', error.message);
    console.error('📄 Error details:', error);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check CLOUDINARY_CLOUD_NAME in .env');
    console.log('2. Check CLOUDINARY_API_KEY in .env');
    console.log('3. Check CLOUDINARY_API_SECRET in .env');
    console.log('4. Verify Cloudinary account is active');
    console.log('5. Check internet connection');
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('\n🔧 Environment Variables Check:');
  console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
  console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY || 'NOT SET');
  console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('❌ Missing Cloudinary environment variables!');
    return false;
  }
  
  console.log('✅ All Cloudinary environment variables are set');
  return true;
}

// Run tests
async function runAllTests() {
  console.log('🧪 Running Cloudinary Tests');
  console.log('=' .repeat(60));
  
  // Test environment variables first
  if (!testEnvironmentVariables()) {
    console.log('❌ Environment variables test failed. Please check your .env file.');
    return;
  }
  
  // Test Cloudinary functionality
  await testCloudinaryDirectly();
}

// Run the tests
runAllTests();
