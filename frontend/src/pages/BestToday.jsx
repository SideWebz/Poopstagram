import React, { useState, useEffect } from 'react';
import { postService } from '../services/api';
import Post from '../components/Post';

const BestToday = ({ user }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    fetchBestPost();
  }, []);

  const fetchBestPost = async () => {
    try {
      setLoading(true);
      const response = await postService.getBestPostToday();
      if (response.data.post) {
        setPost(response.data.post);
        setAverageScore(response.data.averageScore);
        setTotalRatings(response.data.totalRatings);
      } else {
        setPost(null);
      }
    } catch (error) {
      console.error('Error fetching best post:', error);
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelete = (postId) => {
    setPost(null);
  };

  return (
    <div style={{ 
      backgroundColor: '#f5f5f5', 
      minHeight: 'calc(100vh - 60px)',
      paddingTop: '1rem',
      paddingBottom: '80px'
    }}>
      <div className="feed-container">
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 1.5rem auto',
          backgroundColor: 'white',
          padding: '2rem 1.5rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            fontSize: '2rem',
          }}>
            <span style={{ fontSize: '2.5rem' }}>🔥</span>
            <h1 style={{ 
              margin: 0, 
              color: 'var(--text)',
              fontSize: '1.8rem',
              fontWeight: '700'
            }}>
              Best Shit Today
            </h1>
            <span style={{ fontSize: '2.5rem' }}>🔥</span>
          </div>
          <p style={{
            color: 'var(--text-light)',
            fontSize: '0.9rem',
            margin: '0.5rem 0 0 0'
          }}>
            The juiciest post of the day
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '2.5rem', paddingBottom: '2rem' }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 1rem auto',
              borderRadius: '50%',
              border: '4px solid #f0f0f0',
              borderTop: '4px solid var(--accent)',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Finding the best post...</p>
          </div>
        ) : post ? (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {/* Best Post Stats */}
            <div style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)',
              color: 'white',
              padding: '1.5rem 1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(10, 124, 255, 0.3)',
              marginLeft: '0.5rem',
              marginRight: '0.5rem'
            }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                color: '#FFD700'
              }}>
                {averageScore}%
              </div>
              <div style={{ fontSize: '0.95rem', opacity: 0.95, marginBottom: '0.25rem' }}>
                Average Rating
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                <i className="bi bi-star-fill" style={{ marginRight: '0.5rem', color: '#FFD700' }}></i>
                {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
              </div>
            </div>

            {/* The Post */}
            <Post
              post={post}
              currentUser={user}
              onPostDelete={handlePostDelete}
            />
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            paddingTop: '3rem',
            paddingBottom: '2rem',
            color: 'var(--text-light)',
            maxWidth: '500px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem',
              opacity: 0.6
            }}>
              😴
            </div>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              No rated posts today
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Be the first to rate some shit!
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

export default BestToday;
