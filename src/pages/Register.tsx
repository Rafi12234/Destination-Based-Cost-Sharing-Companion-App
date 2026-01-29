/**
 * Register Page Component
 * Handles new user registration with profile creation
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '@/firebase/auth';
import { createUserProfile } from '@/firebase/firestore';
import { UserProfile } from '@/types/models';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    gender: '' as 'male' | 'female' | '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (!formData.gender) {
      setError('Please select your gender.');
      return false;
    }
    if (!formData.phone.match(/^\+?[\d\s-]{10,}$/)) {
      setError('Please enter a valid phone number.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create Firebase auth user
      const user = await signUp(formData.email, formData.password);

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: formData.email,
        name: formData.name,
        gender: formData.gender as 'male' | 'female',
        phone: formData.phone,
        createdAt: Date.now(),
      };

      await createUserProfile(userProfile);

      // Navigate to map page
      navigate('/map');
    } catch (err: any) {
      console.error('Registration error:', err);

      // User-friendly error messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError('Failed to create account. Please try again.');
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
          <h2>Create Account</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? '⏳ Creating account...' : '🚀 Create Account'}
          </button>

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in here</Link>
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
          max-width: 450px;
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
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

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #667eea;
        }

        .form-group input:disabled,
        .form-group select:disabled {
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

        @media (max-width: 500px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
