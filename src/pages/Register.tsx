/**
 * Register Page Component
 * Professional dark theme with Tailwind CSS and Bootstrap
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '@/firebase/auth';
import { createUserProfile } from '@/firebase/firestore';
import { UserProfile } from '@/types/models';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
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

  const validateStep3 = (): boolean => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep3()) {
      return;
    }

    setIsLoading(true);

    try {
      const user = await signUp(formData.email, formData.password);

      const userProfile: UserProfile = {
        uid: user.uid,
        email: formData.email,
        name: formData.name,
        gender: formData.gender as 'male' | 'female',
        phone: formData.phone,
        createdAt: Date.now(),
      };

      await createUserProfile(userProfile);
      navigate('/map');
    } catch (err: any) {
      console.error('Registration error:', err);

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

  const handleNavigate = (path: string) => {
    const wrapper = document.querySelector('.register-page');
    wrapper?.classList.add('page-exit');
    setTimeout(() => navigate(path), 300);
  };

  return (
    <div className={`register-page ${isLoaded ? 'loaded' : ''}`}>
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

      <div className="register-container">
        {/* Left Panel - Branding */}
        <div className="brand-panel">
          <div className="brand-content">
            {/* Logo */}
            <div className="logo" onClick={() => handleNavigate('/')}>
              <div className="logo-icon">
                <img src="https://res.cloudinary.com/dnzjg9lq8/image/upload/v1769803479/Adobe_Express_-_file_sul5xs.png" alt="RideSplit Logo" />
              </div>
              <span className="logo-text">RideSplit</span>
            </div>

            <h1 className="brand-title">Join Our Community</h1>
            <p className="brand-subtitle">
              Create your account and start connecting with fellow travelers today.
            </p>

            {/* Benefits */}
            <div className="benefits">
              <div className="benefit">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                </div>
                <span>Free to join</span>
              </div>
              <div className="benefit">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <span>Verified profiles</span>
              </div>
              <div className="benefit">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <span>Safe matching</span>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="brand-decoration">
            <div className="deco-circle circle-1"></div>
            <div className="deco-circle circle-2"></div>
            <div className="deco-circle circle-3"></div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="form-panel">
          <div className="form-wrapper">
            {/* Progress Steps */}
            <div className="progress-steps">
              {[1, 2, 3].map((step) => (
                <div 
                  key={step} 
                  className={`step-indicator ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                >
                  <div className="step-circle">
                    {currentStep > step ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    ) : step}
                  </div>
                  <span className="step-label">
                    {step === 1 ? 'Account' : step === 2 ? 'Profile' : 'Security'}
                  </span>
                </div>
              ))}
              <div className="progress-line">
                <div className="progress-fill" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              {/* Form Header */}
              <div className="form-header">
                <h2>
                  {currentStep === 1 ? 'Create your account' : 
                   currentStep === 2 ? 'Tell us about yourself' : 
                   'Secure your account'}
                </h2>
                <p>
                  {currentStep === 1 ? 'Enter your basic information to get started' : 
                   currentStep === 2 ? 'This helps us match you with the right riders' : 
                   'Choose a strong password to protect your account'}
                </p>
              </div>

              {/* Error Message */}
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

              {/* Step 1: Account Info */}
              <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
                <div className="form-group">
                  <label htmlFor="name">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Full Name
                  </label>
                  <div className={`input-wrapper ${focusedField === 'name' ? 'focused' : ''}`}>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="John Doe"
                      disabled={isLoading}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Email Address
                  </label>
                  <div className={`input-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@example.com"
                      disabled={isLoading}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Profile Info */}
              <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
                <div className="form-group">
                  <label htmlFor="gender">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    Gender
                  </label>
                  <div className="gender-options">
                    <label className={`gender-option ${formData.gender === 'male' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <div className="gender-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="10" cy="14" r="5"/>
                          <line x1="19" y1="5" x2="13.6" y2="10.4"/>
                          <line x1="19" y1="5" x2="15" y2="5"/>
                          <line x1="19" y1="5" x2="19" y2="9"/>
                        </svg>
                      </div>
                      <span>Male</span>
                    </label>
                    <label className={`gender-option ${formData.gender === 'female' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <div className="gender-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="5"/>
                          <line x1="12" y1="13" x2="12" y2="21"/>
                          <line x1="9" y1="18" x2="15" y2="18"/>
                        </svg>
                      </div>
                      <span>Female</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                    Phone Number
                  </label>
                  <div className={`input-wrapper ${focusedField === 'phone' ? 'focused' : ''}`}>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+1 234 567 8900"
                      disabled={isLoading}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Security */}
              <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
                <div className="form-group">
                  <label htmlFor="password">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Password
                  </label>
                  <div className={`input-wrapper password-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
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
                  <div className="password-strength">
                    <div className={`strength-bar ${formData.password.length >= 6 ? 'active' : ''}`}></div>
                    <div className={`strength-bar ${formData.password.length >= 8 ? 'active' : ''}`}></div>
                    <div className={`strength-bar ${formData.password.length >= 10 && /[A-Z]/.test(formData.password) ? 'active' : ''}`}></div>
                    <div className={`strength-bar ${formData.password.length >= 12 && /[!@#$%^&*]/.test(formData.password) ? 'active' : ''}`}></div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Confirm Password
                  </label>
                  <div className={`input-wrapper password-wrapper ${focusedField === 'confirmPassword' ? 'focused' : ''}`}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
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
                  {formData.confirmPassword && (
                    <div className={`password-match ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                          Passwords match
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Passwords don't match
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                {currentStep > 1 && (
                  <button type="button" className="btn-back" onClick={prevStep} disabled={isLoading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button type="button" className="btn-next" onClick={nextStep} disabled={isLoading}>
                    Continue
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                ) : (
                  <button type="submit" className="btn-submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Sign In Link */}
              <div className="signin-link">
                Already have an account?{' '}
                <button type="button" onClick={() => handleNavigate('/login')}>
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        /* ========== PAGE BASE ========== */
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .register-page.loaded {
          opacity: 1;
          transform: translateY(0);
        }

        .register-page.page-exit {
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

        /* ========== MAIN CONTAINER ========== */
        .register-container {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          max-width: 1100px;
          min-height: 700px;
          margin: 20px;
          background: rgba(13, 27, 42, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 
            0 25px 80px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(59, 130, 246, 0.1);
          overflow: hidden;
          animation: containerSlide 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards;
        }

        @keyframes containerSlide {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ========== BRAND PANEL ========== */
        .brand-panel {
          flex: 0 0 42%;
          background: linear-gradient(135deg, #132238 0%, #1a2d47 100%);
          padding: 60px 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .brand-content {
          position: relative;
          z-index: 1;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 48px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .logo:hover {
          transform: translateX(5px);
        }

        .logo-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.35);
          animation: logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .logo-text {
          font-size: 26px;
          font-weight: 800;
          color: white;
        }

        .brand-title {
          font-size: 36px;
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1.2;
          margin-bottom: 16px;
          animation: textSlide 0.6s ease 0.3s backwards;
        }

        .brand-subtitle {
          font-size: 16px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 40px;
          animation: textSlide 0.6s ease 0.4s backwards;
        }

        @keyframes textSlide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .benefits {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .benefit {
          display: flex;
          align-items: center;
          gap: 14px;
          animation: benefitSlide 0.5s ease backwards;
        }

        .benefit:nth-child(1) { animation-delay: 0.5s; }
        .benefit:nth-child(2) { animation-delay: 0.6s; }
        .benefit:nth-child(3) { animation-delay: 0.7s; }

        @keyframes benefitSlide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .benefit-icon {
          width: 44px;
          height: 44px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .benefit:hover .benefit-icon {
          background: rgba(59, 130, 246, 0.25);
          transform: scale(1.1);
        }

        .benefit-icon svg {
          width: 22px;
          height: 22px;
          color: #60a5fa;
        }

        .benefit span {
          font-size: 15px;
          color: #cbd5e1;
          font-weight: 500;
        }

        .brand-decoration {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .deco-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(59, 130, 246, 0.1);
        }

        .circle-1 {
          width: 300px;
          height: 300px;
          top: -100px;
          right: -100px;
          animation: circleRotate 25s linear infinite;
        }

        .circle-2 {
          width: 200px;
          height: 200px;
          bottom: -50px;
          left: -50px;
          animation: circleRotate 20s linear infinite reverse;
        }

        .circle-3 {
          width: 150px;
          height: 150px;
          top: 50%;
          right: 20%;
          animation: circleRotate 15s linear infinite;
        }

        @keyframes circleRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ========== FORM PANEL ========== */
        .form-panel {
          flex: 1;
          padding: 50px 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 22, 40, 0.5);
        }

        .form-wrapper {
          width: 100%;
          max-width: 420px;
        }

        /* ========== PROGRESS STEPS ========== */
        .progress-steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          position: relative;
          padding: 0 10px;
        }

        .progress-line {
          position: absolute;
          top: 20px;
          left: 60px;
          right: 60px;
          height: 3px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: 2px;
          z-index: 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .step-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(30, 58, 95, 0.8);
          border: 2px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: #64748b;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step-circle svg {
          width: 20px;
          height: 20px;
        }

        .step-indicator.active .step-circle {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-color: #3b82f6;
          color: white;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
          animation: stepPulse 2s ease-in-out infinite;
        }

        @keyframes stepPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 4px 30px rgba(59, 130, 246, 0.6); }
        }

        .step-indicator.completed .step-circle {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-color: #22c55e;
          color: white;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.35);
          animation: none;
        }

        .step-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: color 0.3s ease;
        }

        .step-indicator.active .step-label,
        .step-indicator.completed .step-label {
          color: #e2e8f0;
        }

        /* ========== FORM ========== */
        .register-form {
          animation: formFade 0.6s ease 0.4s backwards;
        }

        @keyframes formFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-header {
          margin-bottom: 32px;
          text-align: center;
        }

        .form-header h2 {
          font-size: 26px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .form-header p {
          font-size: 14px;
          color: #94a3b8;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
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

        .form-step {
          display: none;
        }

        .form-step.active {
          display: block;
          animation: stepFade 0.4s ease;
        }

        @keyframes stepFade {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 10px;
        }

        .form-group label svg {
          width: 18px;
          height: 18px;
          color: #60a5fa;
        }

        .input-wrapper {
          position: relative;
          border-radius: 14px;
          transition: all 0.3s ease;
        }

        .input-wrapper::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 16px;
          background: linear-gradient(135deg, transparent, transparent);
          z-index: -1;
          transition: all 0.3s ease;
        }

        .input-wrapper.focused::before {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .form-input {
          width: 100%;
          padding: 16px 20px;
          font-size: 15px;
          color: #e2e8f0;
          background: rgba(19, 34, 56, 0.8);
          border: 2px solid rgba(59, 130, 246, 0.15);
          border-radius: 14px;
          outline: none;
          transition: all 0.3s ease;
        }

        .form-input::placeholder {
          color: #64748b;
        }

        .form-input:focus {
          border-color: #3b82f6;
          background: rgba(19, 34, 56, 1);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ========== GENDER OPTIONS ========== */
        .gender-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .gender-option {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 20px;
          background: rgba(19, 34, 56, 0.6);
          border: 2px solid rgba(59, 130, 246, 0.15);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gender-option:hover {
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(19, 34, 56, 0.8);
          transform: translateY(-2px);
        }

        .gender-option.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
        }

        .gender-option input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .gender-icon {
          width: 52px;
          height: 52px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .gender-option.selected .gender-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }

        .gender-icon svg {
          width: 26px;
          height: 26px;
          color: #60a5fa;
          transition: color 0.3s ease;
        }

        .gender-option.selected .gender-icon svg {
          color: white;
        }

        .gender-option span {
          font-size: 15px;
          font-weight: 600;
          color: #94a3b8;
          transition: color 0.3s ease;
        }

        .gender-option.selected span {
          color: #e2e8f0;
        }

        /* ========== PASSWORD ========== */
        .password-wrapper {
          display: flex;
          align-items: center;
        }

        .password-wrapper .form-input {
          padding-right: 50px;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
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

        .password-strength {
          display: flex;
          gap: 6px;
          margin-top: 12px;
        }

        .strength-bar {
          flex: 1;
          height: 4px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .strength-bar.active:nth-child(1) { background: #ef4444; }
        .strength-bar.active:nth-child(2) { background: #f97316; }
        .strength-bar.active:nth-child(3) { background: #eab308; }
        .strength-bar.active:nth-child(4) { background: #22c55e; }

        .password-match {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          font-size: 13px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .password-match svg {
          width: 16px;
          height: 16px;
        }

        .password-match.match {
          color: #22c55e;
        }

        .password-match.no-match {
          color: #ef4444;
        }

        /* ========== FORM ACTIONS ========== */
        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 32px;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          background: transparent;
          color: #94a3b8;
          border: 2px solid rgba(148, 163, 184, 0.2);
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-back:hover:not(:disabled) {
          border-color: rgba(148, 163, 184, 0.4);
          color: #e2e8f0;
        }

        .btn-back svg {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
        }

        .btn-back:hover svg {
          transform: translateX(-3px);
        }

        .btn-next,
        .btn-submit {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 28px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
          position: relative;
          overflow: hidden;
        }

        .btn-next::before,
        .btn-submit::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .btn-next:hover::before,
        .btn-submit:hover::before {
          left: 100%;
        }

        .btn-next:hover:not(:disabled),
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
        }

        .btn-next:disabled,
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-next svg,
        .btn-submit svg {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .btn-next:hover svg,
        .btn-submit:hover svg {
          transform: translateX(4px);
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
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ========== SIGN IN LINK ========== */
        .signin-link {
          text-align: center;
          margin-top: 28px;
          font-size: 14px;
          color: #64748b;
        }

        .signin-link button {
          background: none;
          border: none;
          color: #60a5fa;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .signin-link button::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #60a5fa;
          transition: width 0.3s ease;
        }

        .signin-link button:hover::after {
          width: 100%;
        }

        .signin-link button:hover {
          color: #93c5fd;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 900px) {
          .register-container {
            flex-direction: column;
            max-width: 500px;
            min-height: auto;
          }

          .brand-panel {
            flex: none;
            padding: 40px 30px;
          }

          .brand-title {
            font-size: 28px;
          }

          .brand-subtitle {
            margin-bottom: 30px;
          }

          .benefits {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 15px;
          }

          .benefit span {
            display: none;
          }

          .form-panel {
            padding: 40px 30px;
          }
        }

        @media (max-width: 500px) {
          .register-container {
            margin: 10px;
            border-radius: 24px;
          }

          .brand-panel {
            padding: 30px 24px;
          }

          .form-panel {
            padding: 30px 24px;
          }

          .progress-steps {
            margin-bottom: 30px;
          }

          .step-label {
            display: none;
          }

          .progress-line {
            left: 40px;
            right: 40px;
          }

          .gender-options {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-back {
            order: 2;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
