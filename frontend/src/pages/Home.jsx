import React, { useState, useEffect } from 'react';
import { postService } from '../services/api';
import Post from '../components/Post';

const Home = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getPosts(page);
      setPosts(response.data.posts);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const isPostExpired = (createdAt) => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffInHours = (now - postDate) / (1000 * 60 * 60);
    return diffInHours > 48;
  };

  const visiblePosts = posts.filter(post => !isPostExpired(post.createdAt));

  const openCreatePostModal = () => {
    const modal = document.getElementById('createPostModal');
    if (modal) {
      const bsModal = new window.bootstrap.Modal(modal);
      bsModal.show();
    }
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: 'calc(100vh - 60px)', paddingTop: '2rem' }}>
      <div className="feed-container">
        {user && (
          <div className="create-post-btn">
            <button onClick={openCreatePostModal}>
              <i className="bi bi-plus-circle" style={{ marginRight: '0.5rem' }}></i>
              Create Post
            </button>
          </div>
        )}

        {loading && !posts.length ? (
          <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <div className="spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : visiblePosts.length > 0 ? (
          <>
            {visiblePosts.map(post => (
              <Post
                key={post._id}
                post={post}
                currentUser={user}
                onPostDelete={handlePostDelete}
              />
            ))}
          </>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '3rem', color: '#8e8e8e' }}>
            <p style={{ fontSize: '1rem' }}>No posts yet. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
