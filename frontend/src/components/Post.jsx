import React, { useState } from 'react';
import { postService, commentService } from '../services/api';

const Post = ({ post, currentUser, onPostUpdate, onPostDelete }) => {
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser?.id) || false);
  const [loading, setLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentLikes, setCommentLikes] = useState(
    comments.reduce((acc, c) => {
      acc[c._id] = c.likes?.length || 0;
      return acc;
    }, {})
  );
  const [commentUserLikes, setCommentUserLikes] = useState(
    comments.reduce((acc, c) => {
      acc[c._id] = c.likes?.includes(currentUser?.id) || false;
      return acc;
    }, {})
  );
  const [userRating, setUserRating] = useState(
    post.ratings?.find(r => r.user === currentUser?.id)?.score || 0
  );
  const [tempRating, setTempRating] = useState(0);
  const [hasRated, setHasRated] = useState(!!post.ratings?.find(r => r.user === currentUser?.id));
  const [averageScore, setAverageScore] = useState(
    post.ratings?.length > 0
      ? Math.round(post.ratings.reduce((sum, r) => sum + r.score, 0) / post.ratings.length)
      : 0
  );

  const handleLike = async () => {
    try {
      setLoading(true);
      const response = await postService.likePost(post._id);
      setLikes(response.data.likes);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (score) => {
    setTempRating(score);
  };

  const handleSubmitRating = async () => {
    try {
      const response = await postService.ratePost(post._id, tempRating);
      setUserRating(tempRating);
      setAverageScore(response.data.averageScore);
      setHasRated(true);
    } catch (error) {
      console.error('Error rating post:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const response = await commentService.createComment(post._id, newComment);
      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postService.deletePost(post._id);
      onPostDelete(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await commentService.likeComment(commentId);
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: commentUserLikes[commentId] ? prev[commentId] - 1 : prev[commentId] + 1
      }));
      setCommentUserLikes(prev => ({
        ...prev,
        [commentId]: !prev[commentId]
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="post-card" style={{ marginBottom: '0.5rem' }}>
      {/* Post Header */}
      <div className="post-header" style={{ padding: '0.75rem 1rem' }}>
        <div className="post-header-left">
          {post.author?.profilePicture ? (
            <img
              src={post.author.profilePicture}
              alt={post.author.username}
              className="post-avatar"
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="post-avatar">
              {(post.author?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="post-author-info">
            <div className="post-author" style={{ fontWeight: '700', fontSize: '0.95rem' }}>
              {post.author?.username || 'Unknown'}
            </div>
            <div className="post-time" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        {currentUser?.id === post.author?._id && (
          <button
            className="post-delete-btn"
            onClick={handleDeletePost}
            title="Delete post"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-light)', padding: '0.25rem' }}
          >
            <i className="bi bi-three-dots-vertical"></i>
          </button>
        )}
      </div>

      {/* Post Image */}
      <img src={post.imageUrl} alt="Post" className="post-image" style={{ width: '100%', display: 'block' }} />

      {/* Post Stats */}
      <div className="post-stats" style={{ 
        padding: '0.75rem 1rem', 
        fontSize: '0.85rem',
        fontWeight: '600',
        borderBottom: '1px solid var(--border)'
      }}>
        <i className="bi bi-heart-fill" style={{ color: 'var(--danger)', marginRight: '0.5rem' }}></i>
        {likes} {likes === 1 ? 'like' : 'likes'}
      </div>

      {/* Post Caption */}
      {post.caption && (
        <div className="post-caption" style={{
          padding: '1rem',
          fontSize: '0.95rem',
          lineHeight: '1.5',
          color: 'var(--text)',
          borderBottom: '1px solid var(--border)',
          wordWrap: 'break-word'
        }}>
          <strong style={{ marginRight: '0.5rem' }}>{post.author?.username}</strong>
          {post.caption}
        </div>
      )}

      {/* Post Actions */}
      <div className="post-actions" style={{ 
        padding: '0.75rem 1rem', 
        gap: '1rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <button
          className="post-action-btn"
          onClick={handleLike}
          disabled={loading}
          title={isLiked ? 'Unlike' : 'Like'}
          style={{
            padding: '0.5rem 0',
            fontSize: '1.2rem',
            color: isLiked ? 'var(--danger)' : 'var(--text)',
            transition: 'all 0.2s'
          }}
        >
          <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
        </button>
        <button className="post-action-btn" title="Comment" style={{
          padding: '0.5rem 0',
          fontSize: '1.2rem',
          color: 'var(--text)',
          transition: 'all 0.2s'
        }}>
          <i className="bi bi-chat"></i>
        </button>
        <button className="post-action-btn" style={{
          padding: '0.5rem 0',
          fontSize: '1.2rem',
          color: 'var(--text)',
          transition: 'all 0.2s',
          marginLeft: 'auto'
        }}>
          <i className="bi bi-bookmark"></i>
        </button>
      </div>

      {/* Shit Rating */}
      {hasRated ? (
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
          background: '#f5f5f5'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <i className="bi bi-fire" style={{ fontSize: '1.1rem', color: '#ff6b6b' }}></i>
            <span><strong>{averageScore}%</strong> Average Juicy Shit</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>({post.ratings?.length})</span>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          background: '#f5f5f5'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            fontSize: '0.85rem'
          }}>
            <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-fire" style={{ color: '#ff6b6b' }}></i> Rate this Shit
            </span>
            <span style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)',
              color: 'white',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              {tempRating || 0}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={tempRating}
            onChange={(e) => handleRate(parseInt(e.target.value))}
            style={{
              width: '100%',
              cursor: 'pointer',
              height: '6px'
            }}
            title="Rate this shit"
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-light)',
            fontWeight: '500'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <i className="bi bi-exclamation-circle"></i> Shit
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Juicy Shit <i className="bi bi-star-fill" style={{ color: '#FFD700' }}></i>
            </span>
          </div>
          <button
            onClick={handleSubmitRating}
            style={{
              width: '100%',
              marginTop: '0.85rem',
              padding: '0.65rem',
              background: 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <i className="bi bi-check-circle" style={{ marginRight: '0.5rem' }}></i>
            Submit Rating
          </button>
        </div>
      )}

      {/* Comments Section */}
      <div className="comments-section">
        {comments.length > 0 && (
          <>
            {comments.length > 3 && !showAllComments && (
              <div style={{
                padding: '0.75rem 1rem',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                textAlign: 'center',
                borderBottom: '1px solid var(--border)',
                background: '#f5f5f5'
              }} onClick={() => setShowAllComments(true)}>
                <i className="bi bi-chat-dots" style={{ marginRight: '0.5rem' }}></i>
                View all {comments.length} comments
              </div>
            )}
            {visibleComments.map(comment => (
              <div key={comment._id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                      <strong style={{ color: 'var(--text)' }}>{comment.author?.username}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{comment.text}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-light)' }}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: commentUserLikes[comment._id] ? 'var(--danger)' : 'var(--text-light)',
                          transition: 'all 0.2s'
                        }}
                        title="Like comment"
                      >
                        <i className={`bi ${commentUserLikes[comment._id] ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: '0.7rem' }}></i>
                        {commentLikes[comment._id] || 0}
                      </button>
                    </div>
                  </div>
                  {(currentUser?.id === comment.author?._id || currentUser?.id === post.author?._id) && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-light)',
                        fontSize: '0.9rem',
                        padding: '0 0.25rem',
                        transition: 'all 0.2s'
                      }}
                      title="Delete comment"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Comment Input */}
        {currentUser && (
          <form onSubmit={handleAddComment} className="comment-form" style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '0.9rem',
                outline: 'none',
                color: 'var(--text)'
              }}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              style={{
                background: 'none',
                border: 'none',
                color: newComment.trim() ? 'var(--accent)' : 'var(--text-light)',
                fontWeight: '600',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
                padding: '0',
                transition: 'all 0.2s'
              }}
            >
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Post;
