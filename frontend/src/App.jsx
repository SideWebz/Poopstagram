import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

import Navbar from './components/Navbar';
import CreatePostModal from './components/CreatePostModal';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handlePostCreated = (newPost) => {
    // Refresh posts by navigating or triggering a refresh
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
        <Route path="/profile/:userId" element={user ? <Profile currentUser={user} /> : <Navigate to="/login" />} />
      </Routes>

      {user && <CreatePostModal onPostCreated={handlePostCreated} />}
    </Router>
  );
}

export default App;
