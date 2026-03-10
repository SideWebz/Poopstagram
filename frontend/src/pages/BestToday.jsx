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
    <div style={{ backgroundColor: '#fafafa', minHeight: 'calc(100vh - 60px)', paddingTop: '2rem' }}>
      <div className="feed-container">
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          textAlign: 'center',
          paddingBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            fontSize: '2rem',
          }}>
            <span style={{ fontSize: '2.5rem' }}>🔥</span>
            <h1 style={{ margin: 0, color: '#262626' }}>Best Shit of the Day</h1>
            <span style={{ fontSize: '2.5rem' }}>🔥</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <div className="spinner"></div>
            <p>Loading best post...</p>
          </div>
        ) : post ? (
          <div style={{
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            {/* Best Post Stats */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                color: '#FFD700'
              }}>
                {averageScore}%
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                Average Rating
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
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
            color: '#8e8e8e',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              😢
            </div>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No posts with ratings today yet</p>
            <p style={{ fontSize: '0.9rem', color: '#c0c0c0' }}>Be the first to rate a post!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestToday;
