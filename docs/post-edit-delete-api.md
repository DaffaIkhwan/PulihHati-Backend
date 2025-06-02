# Post Edit & Delete API Documentation

## Overview
Backend API endpoints untuk fitur edit dan delete post di aplikasi PulihHati SafeSpace.

## Endpoints

### 1. Edit Post
**Endpoint:** `PUT /api/safespace/posts/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Update konten dari post yang sudah ada

#### Request
```http
PUT /api/safespace/posts/123
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "content": "Updated post content here"
}
```

#### Response Success (200)
```json
{
  "_id": 123,
  "id": 123,
  "content": "Updated post content here",
  "created_at": "2025-05-29T06:30:00.000Z",
  "updated_at": "2025-05-29T06:35:00.000Z",
  "author": {
    "_id": 3,
    "id": 3,
    "name": "User Name",
    "avatar": "https://res.cloudinary.com/dzrd37naa/image/upload/..."
  },
  "likes": [],
  "comments": [],
  "likes_count": 5,
  "comments_count": 3,
  "bookmarked": false,
  "liked": true
}
```

#### Error Responses
- **400 Bad Request:** Invalid post ID atau content kosong
- **401 Unauthorized:** Token tidak valid atau tidak ada
- **403 Forbidden:** User bukan pemilik post
- **404 Not Found:** Post tidak ditemukan
- **500 Internal Server Error:** Server error

### 2. Delete Post
**Endpoint:** `DELETE /api/safespace/posts/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Hapus post dan semua data terkait

#### Request
```http
DELETE /api/safespace/posts/123
Authorization: Bearer <your_jwt_token>
```

#### Response Success (200)
```json
{
  "message": "Post deleted successfully"
}
```

#### Error Responses
- **400 Bad Request:** Invalid post ID
- **401 Unauthorized:** Token tidak valid atau tidak ada
- **403 Forbidden:** User bukan pemilik post
- **404 Not Found:** Post tidak ditemukan
- **500 Internal Server Error:** Server error

## Security Features

### 1. Ownership Verification
- Hanya pemilik post yang bisa edit/delete
- Verifikasi dilakukan dengan membandingkan `author_id` dengan `user.id` dari token

### 2. Data Validation
- Content tidak boleh kosong untuk edit
- Post ID harus valid (numeric)

### 3. Cascade Delete
Ketika post dihapus, semua data terkait juga dihapus:
- Comments pada post
- Likes pada post  
- Bookmarks pada post
- Notifications terkait post

## Frontend Integration

### JavaScript/Axios Example

#### Edit Post
```javascript
const editPost = async (postId, newContent) => {
  try {
    const response = await axios.put(
      `/api/safespace/posts/${postId}`,
      { content: newContent },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Post updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Edit failed:', error.response?.data);
    throw error;
  }
};
```

#### Delete Post
```javascript
const deletePost = async (postId) => {
  try {
    const response = await axios.delete(
      `/api/safespace/posts/${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    console.log('Post deleted:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('Delete failed:', error.response?.data);
    throw error;
  }
};
```

### React Integration Example
```jsx
const handleEditPost = async (post) => {
  setEditingPost(post._id || post.id);
  setEditContent(post.content);
};

const handleSaveEdit = async (postId) => {
  try {
    const updatedPost = await editPost(postId, editContent);
    
    // Update posts state
    setPosts(posts.map(post => 
      (post._id || post.id) === postId ? updatedPost : post
    ));
    
    setEditingPost(null);
    setEditContent('');
  } catch (error) {
    alert('Failed to update post');
  }
};

const handleDeletePost = async (postId) => {
  if (confirm('Are you sure you want to delete this post?')) {
    try {
      await deletePost(postId);
      
      // Remove post from state
      setPosts(posts.filter(post => 
        (post._id || post.id) !== postId
      ));
    } catch (error) {
      alert('Failed to delete post');
    }
  }
};
```

## Database Schema Impact

### Tables Modified
1. **posts** - Main post data
2. **post_comments** - Comments cascade deleted
3. **post_likes** - Likes cascade deleted  
4. **bookmarks** - Bookmarks cascade deleted
5. **notifications** - Related notifications deleted

### SQL Operations
```sql
-- Edit Post
UPDATE "pulihHati".posts 
SET content = $1, updated_at = NOW()
WHERE id = $2 AND author_id = $3;

-- Delete Post (cascade)
DELETE FROM "pulihHati".post_comments WHERE post_id = $1;
DELETE FROM "pulihHati".post_likes WHERE post_id = $1;
DELETE FROM "pulihHati".bookmarks WHERE post_id = $1;
DELETE FROM "pulihHati".notifications WHERE post_id = $1;
DELETE FROM "pulihHati".posts WHERE id = $1;
```

## Testing

Run the test suite:
```bash
node tests/test-simple-edit-delete.js
```

## Logging
Semua operasi edit/delete dicatat dalam log dengan format:
```
info: User 3 updating post 123
info: Post 123 updated successfully by user 3
info: User 3 attempting to delete post 123  
info: Post 123 deleted successfully by user 3
```
