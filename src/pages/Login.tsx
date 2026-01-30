/**
 * Login Page Component
 * Professional modern design with blue theme
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@/firebase/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleNavigate = (path: string) => {
    const wrapper = document.querySelector('.login-page');
    wrapper?.classList.add('page-exit');
    setTimeout(() => navigate(path), 300);
  };

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
    <div className={`login-page ${isLoaded ? 'loaded' : ''}`}>
      {/* Animated Background */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      
      {/* Floating Particles */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>

      {/* Glowing Orbs */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      {/* Left Panel - Branding */}
      <div className="brand-panel">
        <div className="brand-content">
          <div className="logo" onClick={() => handleNavigate('/')}>
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
              <button type="button" className="register-link" onClick={() => handleNavigate('/register')}>
                Create account
              </button>
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
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-page.loaded {
          opacity: 1;
          transform: translateY(0);
        }

        .login-page.page-exit {
          opacity: 0;
          transform: translateY(-20px);
        }

        /* ========== BACKGROUND ========== */
        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse at 30% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            linear-gradient(180deg, #0a1628 0%, #0d1b2a 50%, #0a1628 100%);
          z-index: 0;
        }

        .bg-grid {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 0;
        }

        /* ========== PARTICLES ========== */
        .particles {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(59, 130, 246, 0.5);
          border-radius: 50%;
          animation: float 20s infinite ease-in-out;
        }

        .particle-1 { left: 5%; top: 10%; animation-delay: 0s; }
        .particle-2 { left: 15%; top: 30%; animation-delay: 1s; }
        .particle-3 { left: 25%; top: 50%; animation-delay: 2s; }
        .particle-4 { left: 35%; top: 70%; animation-delay: 3s; }
        .particle-5 { left: 45%; top: 20%; animation-delay: 4s; }
        .particle-6 { left: 55%; top: 40%; animation-delay: 5s; }
        .particle-7 { left: 65%; top: 60%; animation-delay: 6s; }
        .particle-8 { left: 75%; top: 80%; animation-delay: 7s; }
        .particle-9 { left: 85%; top: 15%; animation-delay: 8s; }
        .particle-10 { left: 95%; top: 35%; animation-delay: 9s; }
        .particle-11 { left: 10%; top: 55%; animation-delay: 10s; }
        .particle-12 { left: 20%; top: 75%; animation-delay: 11s; }
        .particle-13 { left: 30%; top: 25%; animation-delay: 12s; }
        .particle-14 { left: 70%; top: 45%; animation-delay: 13s; }
        .particle-15 { left: 90%; top: 65%; animation-delay: 14s; }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -20px); }
          50% { transform: translate(-15px, -40px); }
          75% { transform: translate(20px, -15px); }
        }

        /* ========== GLOWING ORBS ========== */
        .glow-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
          top: -100px;
          right: -50px;
          animation: orbPulse 8s ease-in-out infinite;
        }

        .orb-2 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
          bottom: -80px;
          left: -50px;
          animation: orbPulse 10s ease-in-out infinite reverse;
        }

        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        /* Left Panel - Branding */
        .brand-panel {
          flex: 1;
          background: linear-gradient(135deg, rgba(19, 34, 56, 0.95) 0%, rgba(26, 45, 71, 0.9) 100%);
          backdrop-filter: blur(20px);
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
          z-index: 1;
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
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .logo:hover {
          transform: translateX(-5px);
        }

        .logo-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.35);
          animation: logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .logo-icon svg {
          width: 28px;
          height: 28px;
        }

        .logo-text {
          font-size: 26px;
          font-weight: 800;
          color: white;
        }

        .brand-title {
          font-size: 42px;
          font-weight: 700;
          color: white;
          line-height: 1.2;
          margin-bottom: 16px;
          letter-spacing: -1px;
          animation: textSlide 0.6s ease 0.3s backwards;
        }

        @keyframes textSlide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .brand-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 48px;
          animation: textSlide 0.6s ease 0.4s backwards;
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
          animation: featureSlide 0.5s ease backwards;
        }

        .feature:nth-child(1) { animation-delay: 0.5s; }
        .feature:nth-child(2) { animation-delay: 0.6s; }
        .feature:nth-child(3) { animation-delay: 0.7s; }

        @keyframes featureSlide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .feature:hover .feature-icon {
          background: rgba(59, 130, 246, 0.25);
          transform: scale(1.1);
        }

        .feature-icon svg {
          width: 24px;
          height: 24px;
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
          background: rgba(10, 22, 40, 0.5);
          backdrop-filter: blur(20px);
          position: relative;
          z-index: 1;
        }

        .form-container {
          width: 100%;
          max-width: 420px;
          animation: formFade 0.6s ease 0.4s backwards;
        }

        @keyframes formFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .form-header p {
          font-size: 15px;
          color: #94a3b8;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          margin-bottom: 24px;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .error-alert svg {
          width: 20px;
          height: 20px;
          color: #f87171;
          flex-shrink: 0;
        }

        .error-alert span {
          font-size: 14px;
          color: #fca5a5;
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
          font-weight: 600;
          color: #cbd5e1;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          width: 20px;
          height: 20px;
          color: #64748b;
          pointer-events: none;
          transition: color 0.3s ease;
        }

        .input-wrapper input {
          width: 100%;
          padding: 16px 16px 16px 50px;
          font-size: 15px;
          color: #e2e8f0;
          background: rgba(19, 34, 56, 0.8);
          border: 2px solid rgba(59, 130, 246, 0.15);
          border-radius: 14px;
          outline: none;
          transition: all 0.3s ease;
        }

        .input-wrapper input::placeholder {
          color: #64748b;
        }

        .input-wrapper input:focus {
          border-color: #3b82f6;
          background: rgba(19, 34, 56, 1);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .input-wrapper input:focus + .input-icon,
        .input-wrapper:focus-within .input-icon {
          color: #60a5fa;
        }

        .input-wrapper input:disabled {
          background: rgba(19, 34, 56, 0.5);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: color 0.3s ease;
        }

        .password-toggle:hover {
          color: #60a5fa;
        }

        .password-toggle svg {
          width: 20px;
          height: 20px;
        }

        .submit-btn {
          width: 100%;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .submit-btn:hover::before {
          left: 100%;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 20px;
          height: 20px;
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
          background: none;
          border: none;
          color: #60a5fa;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .register-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #60a5fa;
          transition: width 0.3s ease;
        }

        .register-link:hover::after {
          width: 100%;
        }

        .register-link:hover {
          color: #93c5fd;
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
            padding: 14px 14px 14px 46px;
            font-size: 14px;
          }

          .submit-btn {
            padding: 14px 20px;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;