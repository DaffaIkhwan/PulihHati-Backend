// Debug script to help identify avatar display issues
// Add this to your browser console or run as a separate script

const debugAvatarIssue = () => {
  console.log('🔍 Starting Avatar Debug Session...');
  console.log('=====================================');

  // Check current user data in localStorage
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  
  console.log('📦 LocalStorage Data:');
  console.log('  - Token exists:', !!storedToken);
  console.log('  - User data exists:', !!storedUser);
  
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      console.log('  - User avatar:', userData.avatar);
      console.log('  - User name:', userData.name);
      console.log('  - User email:', userData.email);
    } catch (e) {
      console.log('  - Error parsing user data:', e.message);
    }
  }

  // Check current avatar image element
  const avatarImg = document.querySelector('img[alt="Profile"]');
  if (avatarImg) {
    console.log('\n🖼️ Current Avatar Image:');
    console.log('  - Source URL:', avatarImg.src);
    console.log('  - Natural width:', avatarImg.naturalWidth);
    console.log('  - Natural height:', avatarImg.naturalHeight);
    console.log('  - Complete:', avatarImg.complete);
    console.log('  - Key attribute:', avatarImg.key);
  } else {
    console.log('\n❌ No avatar image found on page');
  }

  // Test avatar URL accessibility
  const testAvatarUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`  - ${url}: ${response.status} ${response.statusText}`);
      console.log(`    Content-Type: ${response.headers.get('content-type')}`);
      console.log(`    Content-Length: ${response.headers.get('content-length')}`);
      return response.ok;
    } catch (error) {
      console.log(`  - ${url}: ERROR - ${error.message}`);
      return false;
    }
  };

  // Test common avatar URLs
  console.log('\n🌐 Testing Avatar URL Accessibility:');
  const urlsToTest = [
    'https://res.cloudinary.com/dzrd37naa/image/upload/v1/pulih-hati/avatars/default-avatar.jpg',
    avatarImg?.src
  ].filter(Boolean);

  Promise.all(urlsToTest.map(testAvatarUrl)).then(() => {
    console.log('\n✅ URL accessibility tests completed');
  });

  // Check for React state (if available)
  console.log('\n⚛️ React State Check:');
  const reactFiber = avatarImg?._reactInternalFiber || avatarImg?.__reactInternalInstance;
  if (reactFiber) {
    console.log('  - React fiber found, checking state...');
    // This is a simplified check - actual implementation may vary
  } else {
    console.log('  - No React fiber found on avatar element');
  }

  // Manual avatar URL test
  console.log('\n🧪 Manual Avatar URL Test:');
  console.log('Run this in console to test a specific URL:');
  console.log(`
testSpecificAvatarUrl = async (url) => {
  const img = new Image();
  img.onload = () => console.log('✅ Image loaded successfully:', url);
  img.onerror = () => console.log('❌ Image failed to load:', url);
  img.src = url;
};

// Example usage:
// testSpecificAvatarUrl('YOUR_CLOUDINARY_URL_HERE');
  `);

  // Check network requests
  console.log('\n🌐 Network Monitoring:');
  console.log('Open Network tab in DevTools and look for:');
  console.log('  1. POST /api/safespace/upload-avatar (should return 200)');
  console.log('  2. GET /api/safespace/profile-stats (should return updated avatar)');
  console.log('  3. Image requests to cloudinary.com (should return 200)');

  // Provide troubleshooting steps
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Check if upload actually succeeded:');
  console.log('   - Look for "✅ Upload successful!" in console');
  console.log('   - Check response.data.user.avatar value');
  console.log('');
  console.log('2. Check if avatar URL is valid:');
  console.log('   - Should not be null');
  console.log('   - Should be accessible via direct URL');
  console.log('');
  console.log('3. Check if state is updating:');
  console.log('   - Look for "🖼️ Avatar URL changed:" in console');
  console.log('   - Check if imageKey is changing');
  console.log('   - Verify img src attribute is updating');
  console.log('');
  console.log('4. Check for caching issues:');
  console.log('   - Hard refresh (Ctrl+Shift+R)');
  console.log('   - Clear browser cache');
  console.log('   - Check if cache busting parameter is added');

  return {
    storedUser: storedUser ? JSON.parse(storedUser) : null,
    hasToken: !!storedToken,
    avatarElement: avatarImg,
    currentSrc: avatarImg?.src
  };
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
  // Add to window for easy access
  window.debugAvatarIssue = debugAvatarIssue;
  console.log('🎯 Avatar debug function added to window.debugAvatarIssue()');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = debugAvatarIssue;
}

// Specific debugging for your issue
console.log('\n🎯 Specific Issue Analysis:');
console.log('You mentioned the debug shows:');
console.log('  Avatar URL: null');
console.log('  Image Key: 1748204641747');
console.log('');
console.log('This suggests:');
console.log('  ✅ The component is working');
console.log('  ✅ State is updating (imageKey changed)');
console.log('  ❌ But avatar URL is still default');
console.log('');
console.log('Possible causes:');
console.log('  1. Upload response doesn\'t contain updated avatar URL');
console.log('  2. Backend isn\'t returning the new Cloudinary URL');
console.log('  3. getValidAvatarUrl() is falling back to default');
console.log('  4. Database isn\'t being updated with new avatar URL');
console.log('');
console.log('Next steps:');
console.log('  1. Check upload response in Network tab');
console.log('  2. Verify backend logs for avatar upload');
console.log('  3. Check database for updated avatar URL');
console.log('  4. Add more console.log in getValidAvatarUrl()');
