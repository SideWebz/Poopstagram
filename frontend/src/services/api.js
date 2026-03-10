import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://91.99.141.32:2003';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getProfile: () =>
    api.get('/auth/profile'),
  getUserProfile: (userId) =>
    api.get(`/auth/profile/${userId}`),
  updateProfile: (data) =>
    api.put('/auth/profile', data),
  searchUsers: (query) =>
    api.get(`/auth/search?q=${encodeURIComponent(query)}`)
};

export const postService = {
  getPosts: (page = 1) =>
    api.get(`/api/posts?page=${page}`),
  getUserPosts: (userId) =>
    api.get(`/api/posts/user/${userId}`),
  getPostById: (postId) =>
    api.get(`/api/posts/${postId}`),
  getBestPostToday: () =>
    api.get('/api/posts/best-today'),
  createPost: (imageUrl, caption) =>
    api.post('/api/posts', { imageUrl, caption }),
  likePost: (postId) =>
    api.post(`/api/posts/${postId}/like`),
  ratePost: (postId, score) =>
    api.post(`/api/posts/${postId}/rate`, { score }),
  deletePost: (postId) =>
    api.delete(`/api/posts/${postId}`)
};

export const commentService = {
  getComments: (postId) =>
    api.get(`/api/comments/${postId}`),
  createComment: (postId, text) =>
    api.post(`/api/comments/${postId}`, { text }),
  likeComment: (commentId) =>
    api.post(`/api/comments/${commentId}/like`),
  deleteComment: (commentId) =>
    api.delete(`/api/comments/${commentId}`)
};

export default api;
