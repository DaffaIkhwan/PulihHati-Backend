import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Handle specific error cases
    if (error.response) {
      // Unauthorized error
      if (error.response.status === 401 && !originalRequest._retry) {
        // Redirect to login if token expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Return the error message from the server if available
      if (error.response.data && error.response.data.message) {
        return Promise.reject(new Error(error.response.data.message));
      }
    }
    
    // Log error for debugging
    console.error('API Error:', error);
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

// Safe Space API calls
export const getPosts = async () => {
  const response = await api.get('/safespace/posts');
  return response.data;
};

export const getPostById = async (id) => {
  const response = await api.get(`/safespace/posts/${id}`);
  return response.data;
};

export const createPost = async (content) => {
  const response = await api.post('/safespace/posts', { content });
  return response.data;
};

export const updatePost = async (id, content) => {
  const response = await api.put(`/safespace/posts/${id}`, { content });
  return response.data;
};

export const deletePost = async (id) => {
  const response = await api.delete(`/safespace/posts/${id}`);
  return response.data;
};

export const likePost = async (id) => {
  const response = await api.put(`/safespace/posts/${id}/like`);
  return response.data;
};

// Add comment to a post
export const addComment = async (postId, content) => {
  try {
    console.log(`Adding comment to post ${postId}: ${content}`);
    const response = await api.post(`/safespace/posts/${postId}/comments`, { content });
    console.log('Comment response:', response.data);
    
    // Ensure we return an array of comments
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      // If it's a single comment object, wrap it in an array
      return [response.data];
    } else {
      console.error('Unexpected comment response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    console.error('Error response:', error.response);
    throw new Error(error.response?.data?.message || 'Failed to add comment. Please try again later.');
  }
};

export const deleteComment = async (postId, commentId) => {
  const response = await api.delete(`/safespace/posts/${postId}/comments/${commentId}`);
  return response.data;
};

export const getBookmarkedPosts = async () => {
  const response = await api.get('/safespace/bookmarks');
  return response.data;
};

export const toggleBookmark = async (postId) => {
  const response = await api.put(`/safespace/posts/${postId}/bookmark`);
  return response.data;
};

export default api;



