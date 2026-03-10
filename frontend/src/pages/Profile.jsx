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
  const [followLoading, setFollowLoading] = useState(false);
  const loaderRef = useRef(null);
  const BATCH_SIZE = 5;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        console.log('Loading profile - userId:', userId, 'currentUser?.id:', currentUser?.id);
        
        if (userId && userId !== currentUser?.id) {
          // Viewing another user's profile
          console.log('Viewing other user profile:', userId);
          const response = await authService.getUserProfile(userId);
          console.log('User profile response:', response.data);
          setUser(response.data);
          setBio(response.data.bio || '');
          setProfilePicture(response.data.profilePicture || null);
          
          // Check if currently following this user - check if currentUserId is in their followers
          if (currentUser?.id && response.data.followers) {
            console.log('Followers array:', response.data.followers);
            console.log('Checking if', currentUser.id, 'is in followers');
            const isFollowingThisUser = response.data.followers.some(
              f => {
                console.log('Comparing', f._id, 'with', currentUser.id, 'result:', f._id === currentUser.id);
                return f._id === currentUser.id || f.id === currentUser.id;
              }
            );
            console.log('Is following:', isFollowingThisUser);
            setIsFollowing(isFollowingThisUser);
          }
        } else if (currentUser?.id) {
          // Viewing own profile
          console.log('Viewing own profile');
          const response = await authService.getProfile();
          console.log('Own profile response:', response.data);
          setUser(response.data);
          setBio(response.data.bio || '');
          setProfilePicture(response.data.profilePicture || null);
          setIsFollowing(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [userId, currentUser?.id]);

  // Load posts
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const targetUserId = userId || currentUser?.id;
        if (targetUserId) {
          const response = await postService.getUserPosts(targetUserId);
          setAllPosts(response.data);
          setDisplayedPosts(response.data.slice(0, BATCH_SIZE));
          setDisplayIndex(BATCH_SIZE);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      }
    };
    
    loadPosts();
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
    if (!user?._id || !currentUser?.id) {
      console.error('Missing user or currentUser ID');
      return;
    }
    
    try {
      setFollowLoading(true);
      console.log('Toggle follow - user._id:', user._id, 'isFollowing:', isFollowing);
      
      if (isFollowing) {
        console.log('Unfollowing user:', user._id);
        await authService.unfollowUser(user._id);
      } else {
        console.log('Following user:', user._id);
        await authService.followUser(user._id);
      }
      
      // Reload the profile to get updated follower counts
      console.log('Reloading profile...');
      const updatedUserResponse = await authService.getUserProfile(user._id);
      console.log('Updated user response:', updatedUserResponse.data);
      setUser(updatedUserResponse.data);
      
      // Update isFollowing status based on new data
      if (updatedUserResponse.data.followers) {
        const isNowFollowing = updatedUserResponse.data.followers.some(
          f => f._id === currentUser.id || f.id === currentUser.id
        );
        console.log('Updated isFollowing:', isNowFollowing);
        setIsFollowing(isNowFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 1rem auto',
          borderRadius: '50%',
          border: '4px solid #f0f0f0',
          borderTop: '4px solid var(--accent)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Profile Header */}
      <div className="profile-header" style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="profile-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {currentUser?.id === user?._id ? (
            <label style={{ position: 'relative', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
              ) : (
                <div className="profile-avatar" style={{
                  width: '120px',
                  height: '120px',
                  fontSize: '2.5rem'
                }}>
                  {(user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)',
                color: 'white',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
                boxShadow: 'var(--shadow-md)',
                fontSize: '1rem'
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
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: 'var(--shadow-md)'
              }}
            />
          ) : (
            <div className="profile-avatar" style={{
              width: '120px',
              height: '120px',
              fontSize: '2.5rem'
            }}>
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="profile-info" style={{ textAlign: 'center', flex: 1 }}>
            <div className="profile-username" style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {user?.username}
            </div>

            <div className="profile-stats" style={{ 
              gap: '2rem', 
              justifyContent: 'center',
              marginBottom: '1rem',
              marginTop: '1rem'
            }}>
              <div className="stat" style={{ alignItems: 'center', textAlign: 'center' }}>
                <div className="stat-number" style={{ fontSize: '1.8rem' }}>{allPosts.length}</div>
                <div className="stat-label">posts</div>
              </div>
              <div className="stat" style={{ alignItems: 'center', textAlign: 'center' }}>
                <div className="stat-number" style={{ fontSize: '1.8rem' }}>
                  {user?.followers?.length || 0}
                </div>
                <div className="stat-label">followers</div>
              </div>
              <div className="stat" style={{ alignItems: 'center', textAlign: 'center' }}>
                <div className="stat-number" style={{ fontSize: '1.8rem' }}>
                  {user?.following?.length || 0}
                </div>
                <div className="stat-label">following</div>
              </div>
              {user?.streak > 0 && (
                <div className="stat" style={{ alignItems: 'center', textAlign: 'center' }}>
                  <div className="stat-number" style={{ 
                    fontSize: '1.8rem',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5b9c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem'
                  }}>
                    🔥 {user.streak}
                  </div>
                  <div className="stat-label">streak</div>
                </div>
              )}
            </div>

            <div className="profile-bio" style={{ 
              color: 'var(--text-light)', 
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              {user?.email}
            </div>
            {(bio || isEditing) && (
              <div className="profile-bio" style={{ 
                color: 'var(--text)',
                fontSize: '0.95rem'
              }}>
                {bio || 'No bio'}
              </div>
            )}

            {/* Bio Edit Section */}
            {currentUser?.id === user?._id ? (
              <>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <input
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--border)',
                        fontSize: '0.9rem',
                        borderRadius: '6px',
                        backgroundColor: '#f5f5f5'
                      }}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Enter bio"
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handleUpdateProfile}
                        style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          background: 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '600',
                          borderRadius: '6px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                          flex: 1,
                          padding: '0.75rem 1rem',
                          background: 'white',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          fontWeight: '600',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      className="btn-edit-profile"
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: '0.75rem 2rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-pencil-fill" style={{ marginRight: '0.5rem' }}></i>
                      Edit Profile
                    </button>
                    <button
                      className="btn-edit-profile"
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                      }}
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 2rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-box-arrow-right" style={{ marginRight: '0.5rem' }}></i>
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1.5rem',
                    background: isFollowing 
                      ? 'white' 
                      : 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)',
                    color: isFollowing ? 'var(--text)' : 'white',
                    border: isFollowing ? '1px solid var(--border)' : 'none',
                    cursor: followLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: followLoading ? 0.6 : 1
                  }}
                >
                  {followLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="profile-posts" style={{ maxWidth: '100%' }}>
        {displayedPosts.length > 0 ? (
          <div className="posts-grid">
            {displayedPosts.map(post => (
              <div 
                key={post._id} 
                className="post-grid-item"
                style={{ cursor: 'pointer', background: 'white' }}
                onClick={() => setSelectedPost(post)}
              >
                <img src={post.imageUrl} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <div style={{ 
            textAlign: 'center', 
            paddingTop: '4rem',
            paddingBottom: '2rem',
            color: 'var(--text-light)',
            backgroundColor: 'white'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📸</div>
            <p style={{ fontSize: '1rem' }}>No posts yet</p>
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
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setSelectedPost(null)}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            borderRadius: '12px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem',
              borderBottom: '1px solid var(--border)',
              background: 'white',
              zIndex: 10,
              borderRadius: '12px 12px 0 0'
            }}>
              <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Post Details</h5>
              <button
                onClick={() => setSelectedPost(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                  transition: 'all 0.2s'
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
              <img src={selectedPost.imageUrl} alt="Post" style={{ width: '100%', marginBottom: '1rem', borderRadius: '8px' }} />
              {selectedPost.caption && (
                <p style={{ marginBottom: '1rem', color: 'var(--text)', lineHeight: '1.5', fontSize: '0.95rem' }}>{selectedPost.caption}</p>
              )}
              <div style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span><i className="bi bi-heart-fill" style={{ color: 'var(--danger)', marginRight: '0.5rem' }}></i>{selectedPost.likes?.length || 0}</span>
                <span><i className="bi bi-chat" style={{ marginRight: '0.5rem' }}></i>{selectedPost.comments?.length || 0}</span>
                <span><i className="bi bi-calendar" style={{ marginRight: '0.5rem' }}></i>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
              </div>
              {selectedPost.ratings && selectedPost.ratings.length > 0 && (
                <div style={{ color: 'var(--text)', fontSize: '0.9rem', marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                  <i className="bi bi-fire" style={{ marginRight: '0.5rem', color: '#ff6b6b' }}></i>
                  <strong>{Math.round(selectedPost.ratings.reduce((sum, r) => sum + r.score, 0) / selectedPost.ratings.length)}%</strong> Average Juicy Shit ({selectedPost.ratings.length} {selectedPost.ratings.length === 1 ? 'rating' : 'ratings'})
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <h6 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '600' }}>
                  <i className="bi bi-chat-dots" style={{ marginRight: '0.5rem' }}></i>
                  Comments ({selectedPost.comments?.length || 0})
                </h6>
                {selectedPost.comments && selectedPost.comments.length > 0 ? (
                  selectedPost.comments.map(comment => (
                    <div key={comment._id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                      <div><strong style={{ color: 'var(--text)' }}>{comment.author?.username}</strong> <span style={{ color: 'var(--text-secondary)' }}>{comment.text}</span></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                        {new Date(comment.createdAt).toLocaleDateString()} • <i className="bi bi-heart" style={{ marginRight: '0.25rem' }}></i>{comment.likes?.length || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>No comments yet</p>
                )}
              </div>
              {currentUser?.id === user?._id && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => {
                      handlePostDelete(selectedPost._id);
                      setSelectedPost(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      borderRadius: '6px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <i className="bi bi-trash" style={{ marginRight: '0.5rem' }}></i>
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
