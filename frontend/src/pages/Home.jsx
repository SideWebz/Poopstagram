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
    <div style={{ 
      backgroundColor: '#f5f5f5', 
      minHeight: 'calc(100vh - 60px)', 
      paddingTop: '0.5rem',
      paddingBottom: '80px'
    }}>
      <div className="feed-container" style={{ maxWidth: '100%' }}>
        {user && (
          <div className="create-post-btn" style={{ 
            display: 'none',
            '@media (min-width: 481px)': { display: 'block' }
          }}>
            <button onClick={openCreatePostModal} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '1rem',
              fontWeight: '600',
              padding: '0.85rem 2rem',
              borderRadius: '8px'
            }}>
              <i className="bi bi-plus-circle-fill"></i>
              Create Post
            </button>
          </div>
        )}

        {loading && !posts.length ? (
          <div style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '2rem' }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 1rem auto',
              borderRadius: '50%',
              border: '4px solid #f0f0f0',
              borderTop: '4px solid var(--accent)',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Loading posts...</p>
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
          <div style={{
            textAlign: 'center',
            paddingTop: '4rem',
            paddingBottom: '3rem',
            backgroundColor: 'white',
            margin: '1rem 0.5rem',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem',
              opacity: 0.5
            }}>
              💩
            </div>
            <h2 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              No posts yet
            </h2>
            <p style={{
              color: 'var(--text-light)',
              fontSize: '0.95rem'
            }}>
              Be the first to share your shit!
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Home;
