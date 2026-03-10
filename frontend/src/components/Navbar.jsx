import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const searchRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setSearching(true);
      const response = await authService.searchUsers(query);
      setSearchResults(response.data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        // Close desktop search but not mobile search (which is a modal)
        if (!showSearchMobile) {
          setShowResults(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchMobile]);

  const handleSelectUser = (userId, username) => {
    navigate(`/profile/${userId}`);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setShowSearchMobile(false);
  };

  return (
    <>
      <header>
        <div className="navbar">
          <Link className="navbar-brand" to="/">
            poopstagram
          </Link>
          {user && (
            <div className="nav-center" ref={searchRef} style={{ position: 'relative' }}>
              <input
                type="text"
                className="search-box"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
              />
              {showResults && searchResults && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map(result => (
                    <div
                      key={result._id}
                      className="search-result-item"
                      onClick={() => {
                        handleSelectUser(result._id, result.username);
                      }}
                    >
                      {result.profilePicture ? (
                        <img
                          src={result.profilePicture}
                          alt={result.username}
                          className="search-result-avatar"
                        />
                      ) : (
                        <div className="search-result-avatar">
                          {(result.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="search-result-info">
                        <div className="search-result-username">{result.username}</div>
                        <div className="search-result-email">{result.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {user && (
            <ul className="nav-right">
              <li className="nav-item">
                <Link className="nav-link" to="/best-today" title="Best Shit of the Day">
                  <i className="bi bi-globe"></i>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/" title="Home">
                  <i className="bi bi-house-fill"></i>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={`/profile/${user.id}`} title="Profile">
                  <i className="bi bi-person-circle"></i>
                </Link>
              </li>
              <li className="nav-item">
                <button className="nav-link" onClick={handleLogout} title="Logout">
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              </li>
            </ul>
          )}
        </div>
      </header>

      {/* Mobile Search Panel */}
      {user && showSearchMobile && (
        <div className="mobile-search-panel" style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'white',
          borderBottom: '1px solid #f0f0f0',
          padding: '1rem',
          zIndex: 998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }} ref={searchRef}>
            <input
              type="text"
              className="search-box"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              autoFocus
              style={{ flex: 1 }}
            />
            <button
              onClick={() => {
                setShowSearchMobile(false);
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#8e8e8e'
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {showResults && searchResults && searchResults.length > 0 && (
            <div className="search-results-dropdown" style={{ position: 'static', marginTop: '0rem', border: 'none', boxShadow: 'none' }}>
              {searchResults.map(result => (
                <div
                  key={result._id}
                  className="search-result-item"
                  onClick={() => {
                    handleSelectUser(result._id, result.username);
                  }}
                >
                  {result.profilePicture ? (
                    <img
                      src={result.profilePicture}
                      alt={result.username}
                      className="search-result-avatar"
                    />
                  ) : (
                    <div className="search-result-avatar">
                      {(result.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="search-result-info">
                    <div className="search-result-username">{result.username}</div>
                    <div className="search-result-email">{result.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {user && (
        <>
          <nav className="mobile-bottom-nav">
            <Link 
              to="/best-today" 
              className={`mobile-nav-item ${location.pathname === '/best-today' ? 'active' : ''}`}
              title="Best Today"
            >
              <i className="bi bi-globe"></i>
            </Link>
            <Link 
              to="/" 
              className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
              title="Home"
            >
              <i className="bi bi-house-fill"></i>
            </Link>
            
            {/* FAB Button - Create Post (Centered) */}
            <button
              onClick={() => {
                const modal = document.getElementById('createPostModal');
                if (modal) {
                  const bsModal = new window.bootstrap.Modal(modal);
                  bsModal.show();
                }
              }}
              className="mobile-fab-button"
              title="Create Post"
            >
              <i className="bi bi-plus"></i>
            </button>
            
            <button
              onClick={() => setShowSearchMobile(!showSearchMobile)}
              className={`mobile-nav-item ${showSearchMobile ? 'active' : ''}`}
              title="Search"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i className="bi bi-search"></i>
            </button>
            
            <Link 
              to={`/profile/${user.id}`}
              className={`mobile-nav-item ${location.pathname.includes('/profile') ? 'active' : ''}`}
              title="Profile"
            >
              <i className="bi bi-person-circle"></i>
            </Link>
          </nav>
        </>
      )}
    </>
  );
};

export default Navbar;
