require('dotenv').config();
const { query } = require('../config/db');

async function testNotifications() {
  try {
    console.log('🧪 Testing Notifications System...\n');

    // Test 1: Check if notifications table exists
    console.log('1️⃣ Checking notifications table...');
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'pulihHati' 
        AND table_name = 'notifications'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Notifications table exists');
    } else {
      console.log('❌ Notifications table not found');
      return;
    }

    // Test 2: Insert a test notification
    console.log('\n2️⃣ Creating test notification...');
    const testNotification = await query(`
      INSERT INTO "pulihHati".notifications (user_id, actor_id, type, message, post_id)
      VALUES (3, 1, 'like', 'Test user liked your post', 1)
      RETURNING *
    `);
    
    if (testNotification.rows.length > 0) {
      console.log('✅ Test notification created successfully');
      console.log(`📝 Notification ID: ${testNotification.rows[0].id}`);
    }

    // Test 3: Fetch notifications
    console.log('\n3️⃣ Fetching notifications...');
    const notifications = await query(`
      SELECT
        n.*,
        u.name as actor_name,
        u.avatar as actor_avatar,
        p.content as post_content
      FROM
        "pulihHati".notifications n
      LEFT JOIN
        "pulihHati".users u ON n.actor_id = u.id
      LEFT JOIN
        "pulihHati".posts p ON n.post_id = p.id
      WHERE
        n.user_id = 3
      ORDER BY
        n.created_at DESC
      LIMIT 5
    `);

    console.log(`✅ Found ${notifications.rows.length} notifications`);
    notifications.rows.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.type}: ${notif.message} (Read: ${notif.read})`);
    });

    // Test 4: Test unread count
    console.log('\n4️⃣ Testing unread count...');
    const unreadCount = await query(`
      SELECT COUNT(*) as count
      FROM "pulihHati".notifications
      WHERE user_id = 3 AND read = false
    `);
    
    console.log(`✅ Unread notifications: ${unreadCount.rows[0].count}`);

    // Test 5: Mark as read
    console.log('\n5️⃣ Testing mark as read...');
    const markRead = await query(`
      UPDATE "pulihHati".notifications
      SET read = true
      WHERE user_id = 3 AND read = false
      RETURNING id
    `);
    
    console.log(`✅ Marked ${markRead.rows.length} notifications as read`);

    console.log('\n🎉 All notification tests passed!');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await query(`
      DELETE FROM "pulihHati".notifications 
      WHERE message = 'Test user liked your post'
    `);
    console.log('✅ Test data cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testNotifications();
