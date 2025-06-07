// Frontend Avatar Upload Implementation with Debug
// Add this to your React component

const handleAvatarUpload = async (file) => {
  console.log('🔄 Starting avatar upload process...');
  console.log('📁 File details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });

  try {
    // Step 1: Validasi file
    if (!file) {
      console.error('❌ No file selected');
      alert('Please select a file');
      return;
    }

    // Step 2: Validasi tipe file
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      alert('Please select an image file');
      return;
    }

    // Step 3: Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      alert('File size must be less than 5MB');
      return;
    }

    console.log('✅ File validation passed');

    // Step 4: Check token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      alert('Please login first');
      return;
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');

    // Step 5: Show loading state
    setLoading(true);
    console.log('🔄 Setting loading state...');

    // Step 6: Buat FormData
    const formData = new FormData();
    formData.append('avatar', file);
    
    console.log('📦 FormData created');
    console.log('📦 FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    // Step 7: Upload ke backend
    console.log('🚀 Sending request to /api/safespace/upload-avatar...');
    
    const response = await api.post('/api/safespace/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📊 Upload progress: ${percentCompleted}%`);
      }
    });

    console.log('✅ Upload successful!');
    console.log('📝 Response:', response.data);

    // Step 8: Update user state
    if (response.data.user) {
      console.log('👤 Updating user state with new avatar:', response.data.user.avatar);
      setUser(response.data.user);
      
      // Optional: Refresh posts if user avatar is used in posts
      if (typeof fetchPosts === 'function') {
        console.log('🔄 Refreshing posts...');
        fetchPosts();
      }
      
      alert('Avatar updated successfully!');
    } else {
      console.warn('⚠️ No user data in response');
      alert('Upload completed but user data not updated');
    }

  } catch (error) {
    console.error('❌ Avatar upload failed:', error);
    
    if (error.response) {
      console.error('📄 Error response:', error.response.data);
      console.error('📊 Error status:', error.response.status);
      console.error('📋 Error headers:', error.response.headers);
      
      alert(error.response.data?.message || 'Failed to upload avatar');
    } else if (error.request) {
      console.error('📡 Network error:', error.request);
      alert('Network error. Please check your connection.');
    } else {
      console.error('⚙️ Setup error:', error.message);
      alert('Upload setup error: ' + error.message);
    }
  } finally {
    setLoading(false);
    console.log('🏁 Upload process completed');
  }
};

// Alternative implementation with preview
const handleAvatarUploadWithPreview = async (file) => {
  console.log('🔄 Starting avatar upload with preview...');

  try {
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('👁️ Preview generated');
      // You can show preview here if needed
      // setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Continue with upload
    await handleAvatarUpload(file);

  } catch (error) {
    console.error('❌ Preview + upload failed:', error);
  }
};

// Test function to check API connection
const testAvatarEndpoint = async () => {
  console.log('🧪 Testing avatar endpoint...');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token for testing');
      return;
    }

    // Test with empty FormData to check endpoint
    const testFormData = new FormData();
    
    const response = await api.post('/api/safespace/upload-avatar', testFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Endpoint accessible');
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('No file uploaded')) {
      console.log('✅ Endpoint working (correctly rejects empty uploads)');
    } else {
      console.error('❌ Endpoint test failed:', error.response?.data || error.message);
    }
  }
};

// Usage in your component:
// 1. Add handleAvatarUpload function to your component
// 2. Make sure you have setLoading and setUser functions
// 3. Make sure api is configured with base URL
// 4. Test with testAvatarEndpoint() first

// Example API configuration:
/*
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust to your backend URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});
*/

// Example component state:
/*
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
*/

export { handleAvatarUpload, handleAvatarUploadWithPreview, testAvatarEndpoint };
