/**
 * Login Page Component
 * Professional modern design with blue theme
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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/map');
    } catch (err: any) {
      console.error('Login error:', err);
      
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
    <div className="login-page">
      {/* Left Panel - Branding */}
      <div className="brand-panel">
        <div className="brand-content">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span className="logo-text">RideSplit</span>
          </div>
          
          <h1 className="brand-title">Share Your Journey</h1>
          <p className="brand-subtitle">
            Connect with travelers heading your way. Split costs, reduce emissions, and make new connections.
          </p>
          
          <div className="features">
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Real-time Matching</h3>
                <p>Find riders heading to your destination</p>
              </div>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Safe Connections</h3>
                <p>Gender-based matching for comfort</p>
              </div>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Cost Sharing</h3>
                <p>Split travel expenses fairly</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="brand-footer">
          <p>© 2026 RideSplit. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="form-panel">
        <div className="form-container">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="error-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          background: #f8fafc;
        }

        /* Left Panel - Branding */
        .brand-panel {
          flex: 1;
          background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand-panel::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -30%;
          width: 80%;
          height: 80%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 420px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 48px;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .logo-icon svg {
          width: 28px;
          height: 28px;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }

        .brand-title {
          font-size: 42px;
          font-weight: 700;
          color: white;
          line-height: 1.2;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }

        .brand-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 48px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: left;
        }

        .feature {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-icon svg {
          width: 22px;
          height: 22px;
          color: #60a5fa;
        }

        .feature-text h3 {
          font-size: 15px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }

        .feature-text p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .brand-footer {
          position: absolute;
          bottom: 48px;
          left: 0;
          right: 0;
          text-align: center;
          z-index: 1;
        }

        .brand-footer p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Right Panel - Form */
        .form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: #f8fafc;
        }

        .form-container {
          width: 100%;
          max-width: 420px;
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .form-header p {
          font-size: 15px;
          color: #64748b;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          margin-bottom: 24px;
        }

        .error-alert svg {
          width: 20px;
          height: 20px;
          color: #dc2626;
          flex-shrink: 0;
        }

        .error-alert span {
          font-size: 14px;
          color: #dc2626;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          width: 20px;
          height: 20px;
          color: #94a3b8;
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          padding: 14px 14px 14px 46px;
          font-size: 15px;
          color: #1e293b;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s ease;
        }

        .input-wrapper input::placeholder {
          color: #94a3b8;
        }

        .input-wrapper input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .input-wrapper input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle svg {
          width: 20px;
          height: 20px;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .password-toggle:hover svg {
          color: #64748b;
        }

        .submit-btn {
          width: 100%;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          margin-top: 32px;
          text-align: center;
        }

        .form-footer p {
          font-size: 14px;
          color: #64748b;
        }

        .register-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .register-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .brand-panel {
            display: none;
          }
          
          .form-panel {
            padding: 24px;
          }
        }

        @media (max-width: 480px) {
          .form-container {
            max-width: 100%;
          }

          .form-header h2 {
            font-size: 24px;
          }

          .input-wrapper input {
            padding: 12px 12px 12px 42px;
            font-size: 14px;
          }

          .submit-btn {
            padding: 12px 20px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;