/**
 * Login Page Component
 * Handles user authentication with email and password
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '@/firebase/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/map');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // User-friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🚗 RideSplit Match</h1>
          <p>Share rides, save costs</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Welcome Back</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? '⏳ Signing in...' : '🔓 Sign In'}
          </button>

          <p className="auth-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
        }

        .auth-header {
          text-align: center;
          color: white;
          margin-bottom: 24px;
        }

        .auth-header h1 {
          font-size: 32px;
          margin: 0;
        }

        .auth-header p {
          margin: 8px 0 0;
          opacity: 0.9;
        }

        .auth-form {
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .auth-form h2 {
          margin: 0 0 24px;
          text-align: center;
          color: #333;
          font-size: 24px;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          text-align: center;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #555;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus {
          border-color: #667eea;
        }

        .form-group input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .submit-button {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .auth-link {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }

        .auth-link a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-link a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
