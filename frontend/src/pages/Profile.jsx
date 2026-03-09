import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { authService, postService } from '../services/api';

const Profile = ({ currentUser }) => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const loaderRef = useRef(null);
  const BATCH_SIZE = 5;

  useEffect(() => {
    if (userId && userId !== currentUser?.id) {
      // Viewing another user's profile
      setIsFollowing(false); // Reset follow state when switching profiles
      setLoading(true);
      fetchOtherUserProfile();
      fetchUserPosts();
    } else {
      // Viewing own profile
      setLoading(true);
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [userId, currentUser?.id]);

  // Load more posts when needed
  useEffect(() => {
    if (displayIndex + BATCH_SIZE <= allPosts.length) {
      setDisplayedPosts(allPosts.slice(0, displayIndex + BATCH_SIZE));
    }
  }, [displayIndex, allPosts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedPosts.length < allPosts.length && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setDisplayIndex(prev => prev + BATCH_SIZE);
            setLoadingMore(false);
          }, 200);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [displayedPosts.length, allPosts.length, loadingMore]);

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data);
      setBio(response.data.bio || '');
      setProfilePicture(response.data.profilePicture || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherUserProfile = async () => {
    try {
      const response = await authService.getUserProfile(userId);
      setUser(response.data);
      setBio(response.data.bio || '');
      setProfilePicture(response.data.profilePicture || null);

      // Check if current user is following this user
      const currentUserResponse = await authService.getProfile();
      const isUserFollowed = currentUserResponse.data.following.some(
        followedId => followedId.toString() === userId.toString()
      );
      setIsFollowing(isUserFollowed);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const targetUserId = userId || currentUser?.id;
      const response = await postService.getUserPosts(targetUserId);
      setAllPosts(response.data);
      setDisplayedPosts(response.data.slice(0, BATCH_SIZE));
      setDisplayIndex(BATCH_SIZE);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await authService.updateProfile({ bio, profilePicture });
      setUser(response.data.user);
      setIsEditing(false);
      setProfilePicture(response.data.user.profilePicture);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          setUploadingPicture(true);
          setProfilePicture(reader.result);
          const response = await authService.updateProfile({ 
            bio, 
            profilePicture: reader.result 
          });
          setUser(response.data.user);
          setProfilePicture(response.data.user.profilePicture);
        } catch (error) {
          console.error('Error updating profile picture:', error);
        } finally {
          setUploadingPicture(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostDelete = async (postId) => {
    try {
      await postService.deletePost(postId);
      const updatedPosts = allPosts.filter(p => p._id !== postId);
      setAllPosts(updatedPosts);
      setDisplayedPosts(updatedPosts.slice(0, displayIndex));
      setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      setIsFollowingLoading(true);
      if (isFollowing) {
        await authService.unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await authService.followUser(userId);
        setIsFollowing(true);
      }
      
      // Refresh the following status after successful toggle
      const currentUserResponse = await authService.getProfile();
      const isUserFollowed = currentUserResponse.data.following.some(
        followedId => followedId.toString() === userId.toString()
      );
      setIsFollowing(isUserFollowed);
    } catch (error) {
      console.error('Error toggling follow:', error);
      // If there's an error, refresh the actual state from the backend
      try {
        const currentUserResponse = await authService.getProfile();
        const isUserFollowed = currentUserResponse.data.following.some(
          followedId => followedId.toString() === userId.toString()
        );
        setIsFollowing(isUserFollowed);
      } catch (refreshError) {
        console.error('Error refreshing follow status:', refreshError);
      }
    } finally {
      setIsFollowingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-container">
          {currentUser?.id === user?._id ? (
            <label style={{ position: 'relative', cursor: 'pointer' }}>
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div className="profile-avatar">
                  {(user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#0095f6',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
              }}>
                <i className="bi bi-camera-fill"></i>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                style={{ display: 'none' }}
                disabled={uploadingPicture}
              />
            </label>
          ) : profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div className="profile-avatar">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="profile-info">
            <div className="profile-username">{user?.username}</div>

            <div className="profile-stats">
              <div className="stat">
                <div className="stat-number">{allPosts.length}</div>
                <div className="stat-label">posts</div>
              </div>
              <div className="stat">
                <div className="stat-number">{user?.followers?.length || 0}</div>
                <div className="stat-label">followers</div>
              </div>
              <div className="stat">
                <div className="stat-number">{user?.following?.length || 0}</div>
                <div className="stat-label">following</div>
              </div>
            </div>

            <div className="profile-bio">{user?.email}</div>
            {(bio || isEditing) && (
              <div className="profile-bio">{bio || 'No bio'}</div>
            )}

            {/* Bio Edit Section */}
            {currentUser?.id === user?._id ? (
              <>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <input
                      type="text"
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #ccc',
                        fontSize: '0.9rem',
                      }}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Enter bio"
                    />
                    <button
                      onClick={handleUpdateProfile}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#0095f6',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setBio(user?.bio || '');
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'white',
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-edit-profile"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </>
            ) : (
              // Follow/Unfollow button for other users
              <button
                className="btn-edit-profile"
                onClick={handleFollowToggle}
                disabled={isFollowingLoading}
                style={{
                  background: isFollowing ? 'white' : '#0095f6',
                  color: isFollowing ? '#0095f6' : 'white',
                  border: isFollowing ? '1px solid #0095f6' : 'none',
                  cursor: isFollowingLoading ? 'not-allowed' : 'pointer',
                  opacity: isFollowingLoading ? 0.6 : 1
                }}
              >
                {isFollowingLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="profile-posts">
        {displayedPosts.length > 0 ? (
          <div className="posts-grid">
            {displayedPosts.map(post => (
              <div 
                key={post._id} 
                className="post-grid-item"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedPost(post)}
              >
                <img src={post.imageUrl} alt="Post" />
                <div className="post-grid-overlay">
                  <div className="overlay-stat">
                    <i className="bi bi-heart-fill"></i>
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="overlay-stat">
                    <i className="bi bi-chat"></i>
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            {allPosts.length > displayedPosts.length && <div ref={loaderRef} style={{ gridColumn: '1 / -1', height: '40px' }} />}
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '2rem', color: '#8e8e8e' }}>
            <p>No posts yet</p>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setSelectedPost(null)}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            borderRadius: '0',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid #f0f0f0',
              background: 'white',
              zIndex: 10
            }}>
              <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Post</h5>
              <button
                onClick={() => setSelectedPost(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#8e8e8e'
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              <img src={selectedPost.imageUrl} alt="Post" style={{ width: '100%', marginBottom: '1rem' }} />
              {selectedPost.caption && (
                <p style={{ marginBottom: '1rem', color: '#262626', lineHeight: '1.5' }}>{selectedPost.caption}</p>
              )}
              <div style={{ color: '#8e8e8e', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <span><i className="bi bi-heart-fill" style={{ color: '#ed4956', marginRight: '0.25rem' }}></i>{selectedPost.likes?.length || 0} likes</span>
                <span><i className="bi bi-chat" style={{ marginRight: '0.25rem' }}></i>{selectedPost.comments?.length || 0}</span>
                <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
              </div>
              {selectedPost.ratings && selectedPost.ratings.length > 0 && (
                <div style={{ color: '#8e8e8e', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <i className="bi bi-fire" style={{ marginRight: '0.25rem' }}></i>
                  {Math.round(selectedPost.ratings.reduce((sum, r) => sum + r.score, 0) / selectedPost.ratings.length)}% Average Juicy Shit ({selectedPost.ratings.length} ratings)
                </div>
              )}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1rem' }}>
                <h6 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '600' }}>Comments ({selectedPost.comments?.length || 0})</h6>
                {selectedPost.comments && selectedPost.comments.length > 0 ? (
                  selectedPost.comments.map(comment => (
                    <div key={comment._id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                      <div><strong>{comment.author?.username}</strong> {comment.text}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8e8e8e', marginTop: '0.25rem' }}>
                        {new Date(comment.createdAt).toLocaleDateString()} • <i className="bi bi-heart" style={{ marginRight: '0.25rem' }}></i>{comment.likes?.length || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#8e8e8e', fontSize: '0.9rem' }}>No comments yet</p>
                )}
              </div>
              {currentUser?.id === user?._id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
                  <button
                    onClick={() => {
                      handlePostDelete(selectedPost._id);
                      setSelectedPost(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#ed4956',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-trash" style={{ marginRight: '0.5rem' }}></i> Delete Post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
