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

  const visibleComments = showAllComments ? comments : comments.slice(-3);

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
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
            <div className="post-author">{post.author?.username || 'Unknown'}</div>
            <div className="post-time">
              {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        {currentUser?.id === post.author?._id && (
          <button
            className="post-delete-btn"
            onClick={handleDeletePost}
            title="Delete post"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#8e8e8e' }}
          >
            <i className="bi bi-three-dots-vertical"></i>
          </button>
        )}
      </div>

      {/* Post Image */}
      <img src={post.imageUrl} alt="Post" className="post-image" />

      {/* Post Stats */}
      <div className="post-stats">
        {likes} likes
      </div>

      {/* Post Caption */}
      {post.caption && (
        <div className="post-caption">
          {post.caption}
        </div>
      )}

      {/* Post Actions */}
      <div className="post-actions">
        <button
          className="post-action-btn"
          onClick={handleLike}
          disabled={loading}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`} style={{ color: isLiked ? '#ed4956' : 'inherit' }}></i>
        </button>
        <button className="post-action-btn" title="Comment">
          <i className="bi bi-chat"></i>
        </button>
      </div>

      {/* Shit Rating */}
      {hasRated ? (
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #ccc',
          borderTop: '1px solid #ccc',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            <i className="bi bi-fire" style={{ fontSize: '1rem' }}></i>
            <span><strong>{averageScore}%</strong> Average Juicy Shit</span>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>({post.ratings?.length} ratings)</span>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #ccc',
          borderTop: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            fontSize: '0.85rem'
          }}>
            <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-fire"></i> Rate this Shit
            </span>
            <span style={{
              background: '#0095f6',
              color: 'white',
              padding: '0.25rem 0.75rem',
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
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#8e8e8e'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <i className="bi bi-exclamation-circle"></i> Shit
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Juicy Shit <i className="bi bi-star-fill"></i>
            </span>
          </div>
          <button
            onClick={handleSubmitRating}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.5rem',
              background: '#0095f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
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
                color: '#0095f6',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                textAlign: 'center',
                borderBottom: '1px solid #ccc'
              }} onClick={() => setShowAllComments(true)}>
                View all {comments.length} comments
              </div>
            )}
            {visibleComments.map(comment => (
              <div key={comment._id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong>{comment.author?.username}</strong> {comment.text}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                      <span style={{ color: '#8e8e8e' }}>
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
                          color: commentUserLikes[comment._id] ? '#ed4956' : '#8e8e8e'
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
                        color: '#8e8e8e',
                        fontSize: '1rem',
                        padding: '0 0.5rem'
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
          <form onSubmit={handleAddComment} className="comment-form">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
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
