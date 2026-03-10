import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const response = await authService.login(formData.email, formData.password);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '1rem'
    }}>
      <div className="auth-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            💩
          </div>
          <h1 style={{ 
            fontWeight: '300', 
            letterSpacing: '-1px',
            marginBottom: '0.5rem'
          }}>
            poopstagram
          </h1>
          <p style={{ 
            color: 'var(--text-light)', 
            fontSize: '0.9rem',
            margin: 0
          }}>
            Share your shit with friends
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <i className="bi bi-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              required
              style={{
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
                backgroundColor: '#f5f5f5'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              style={{
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
                backgroundColor: '#f5f5f5'
              }}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            style={{
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '6px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: loading ? 'var(--text-light)' : 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)'
            }}
          >
            {loading ? (
              <>
                <i className="bi bi-hourglass-split" style={{ marginRight: '0.5rem' }}></i>
                Logging in...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right" style={{ marginRight: '0.5rem' }}></i>
                Log in
              </>
            )}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: '1.5rem 0', fontSize: '0.85rem' }}>
          OR
        </div>

        <div className="auth-footer" style={{ 
          paddingTop: '1.5rem', 
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: '0.95rem'
        }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Login;
