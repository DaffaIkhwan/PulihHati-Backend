// Test script untuk debug avatar upload backend
// Jalankan dengan: node test-avatar-backend.js

const { query } = require('../config/db');
const logger = require('../config/logger');

const testAvatarBackend = async () => {
  console.log('🔍 Testing Avatar Backend...');
  console.log('================================');

  try {
    // 1. Test database connection
    console.log('\n1. Testing database connection...');
    const dbTest = await query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', dbTest.rows[0].current_time);

    // 2. Check users table structure
    console.log('\n2. Checking users table structure...');
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'pulihHati' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table columns:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 3. Check if cloudinary_public_id column exists
    const hasCloudinaryColumn = tableInfo.rows.some(col => col.column_name === 'cloudinary_public_id');
    console.log(`\n🔍 cloudinary_public_id column exists: ${hasCloudinaryColumn ? '✅ Yes' : '❌ No'}`);

    if (!hasCloudinaryColumn) {
      console.log('⚠️ Adding cloudinary_public_id column...');
      await query('ALTER TABLE "pulihHati".users ADD COLUMN cloudinary_public_id VARCHAR(255)');
      console.log('✅ Column added successfully');
    }

    // 4. Check current users and their avatars
    console.log('\n3. Checking current users and avatars...');
    const users = await query(`
      SELECT id, name, email, avatar, cloudinary_public_id, created_at, updated_at
      FROM "pulihHati".users 
      ORDER BY id
    `);

    console.log(`📊 Found ${users.rows.length} users:`);
    users.rows.forEach(user => {
      console.log(`  User ${user.id}: ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Avatar: ${user.avatar}`);
      console.log(`    Cloudinary ID: ${user.cloudinary_public_id || 'NULL'}`);
      console.log(`    Updated: ${user.updated_at}`);
      console.log('');
    });

    // 5. Test avatar update query
    if (users.rows.length > 0) {
      const testUserId = users.rows[0].id;
      console.log(`\n4. Testing avatar update for user ${testUserId}...`);
      
      const testAvatarUrl = 'https://res.cloudinary.com/dzrd37naa/image/upload/v1/pulih-hati/avatars/test-avatar.jpg';
      const testPublicId = 'pulih-hati/avatars/test-avatar';
      
      console.log(`📝 Updating with test data...`);
      const updateResult = await query(`
        UPDATE "pulihHati".users 
        SET avatar = $1, cloudinary_public_id = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, name, email, avatar, cloudinary_public_id, updated_at
      `, [testAvatarUrl, testPublicId, testUserId]);

      if (updateResult.rows.length > 0) {
        console.log('✅ Update successful:');
        console.log('  Updated user:', updateResult.rows[0]);
        
        // Verify the update
        const verifyResult = await query(`
          SELECT avatar, cloudinary_public_id, updated_at 
          FROM "pulihHati".users 
          WHERE id = $1
        `, [testUserId]);
        
        console.log('✅ Verification:');
        console.log('  Current avatar:', verifyResult.rows[0].avatar);
        console.log('  Current public_id:', verifyResult.rows[0].cloudinary_public_id);
        console.log('  Updated at:', verifyResult.rows[0].updated_at);
        
        // Restore original avatar
        await query(`
          UPDATE "pulihHati".users 
          SET avatar = 'default-avatar.jpg', cloudinary_public_id = NULL
          WHERE id = $1
        `, [testUserId]);
        console.log('✅ Restored original avatar');
        
      } else {
        console.log('❌ Update failed - no rows affected');
      }
    }

    // 6. Test Cloudinary configuration
    console.log('\n5. Testing Cloudinary configuration...');
    const cloudinaryConfig = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzrd37naa',
      api_key: process.env.CLOUDINARY_API_KEY || '812676562385731',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***SET***' : '***NOT SET***'
    };
    
    console.log('🔧 Cloudinary config:');
    console.log(`  Cloud name: ${cloudinaryConfig.cloud_name}`);
    console.log(`  API key: ${cloudinaryConfig.api_key}`);
    console.log(`  API secret: ${cloudinaryConfig.api_secret}`);

    // 7. Recommendations
    console.log('\n📋 Recommendations:');
    console.log('1. Make sure CLOUDINARY_API_SECRET is set in .env file');
    console.log('2. Check backend logs during avatar upload');
    console.log('3. Verify transaction is not rolling back');
    console.log('4. Test with a small image file first');
    
    console.log('\n✅ Backend test completed successfully!');

  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Test specific user avatar update
const testUserAvatarUpdate = async (userId, avatarUrl, publicId) => {
  console.log(`\n🧪 Testing avatar update for user ${userId}...`);
  
  try {
    const result = await query(`
      UPDATE "pulihHati".users 
      SET avatar = $1, cloudinary_public_id = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [avatarUrl, publicId, userId]);

    if (result.rows.length > 0) {
      console.log('✅ Update successful:', result.rows[0]);
      return result.rows[0];
    } else {
      console.log('❌ No user found with that ID');
      return null;
    }
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    throw error;
  }
};

// Check specific user
const checkUser = async (userId) => {
  try {
    const result = await query(`
      SELECT id, name, email, avatar, cloudinary_public_id, updated_at
      FROM "pulihHati".users 
      WHERE id = $1
    `, [userId]);

    if (result.rows.length > 0) {
      console.log('👤 User data:', result.rows[0]);
      return result.rows[0];
    } else {
      console.log('❌ User not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    throw error;
  }
};

// Export functions
module.exports = {
  testAvatarBackend,
  testUserAvatarUpdate,
  checkUser
};

// Run test if this file is executed directly
if (require.main === module) {
  testAvatarBackend().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}
