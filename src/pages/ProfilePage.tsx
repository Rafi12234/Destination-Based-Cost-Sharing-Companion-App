/**
 * Profile Page Component
 * View and edit user profile information
 * Gender cannot be changed after registration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthChange } from '@/firebase/auth';
import { getUserProfile, updateUserProfile } from '@/firebase/firestore';
import { UserProfile } from '@/types/models';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Load user profile
  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (!authUser) {
        navigate('/login');
        return;
      }

      try {
        const profile = await getUserProfile(authUser.uid);
        if (profile) {
          setUser(profile);
          setName(profile.name);
          setPhone(profile.phone);
          setEmail(profile.email);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Handle save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile(user.uid, {
        name: name.trim(),
        phone: phone.trim(),
      });
      
      setUser({ ...user, name: name.trim(), phone: phone.trim() });
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Background */}
      <div className="profile-bg">
        <div className="profile-bg-gradient"></div>
        <div className="profile-bg-pattern"></div>
      </div>

      {/* Header */}
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate('/map')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
        <h1>My Profile</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Main Content */}
      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-large">
              <span>{user?.name?.charAt(0).toUpperCase() || '?'}</span>
              <div className={`avatar-badge ${user?.gender}`}>
                {user?.gender === 'male' ? '♂' : '♀'}
              </div>
            </div>
            <h2 className="user-name">{user?.name}</h2>
            <p className="user-email">{user?.email}</p>
          </div>

          {/* Form Section */}
          <form className="profile-form" onSubmit={handleSave}>
            {/* Name Field */}
            <div className="form-group">
              <label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            {/* Phone Field */}
            <div className="form-group">
              <label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Email Field (Read-only) */}
            <div className="form-group readonly">
              <label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email Address
                <span className="readonly-badge">Cannot be changed</span>
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="disabled-input"
              />
            </div>

            {/* Gender Field (Read-only) */}
            <div className="form-group readonly">
              <label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                Gender
                <span className="readonly-badge">Cannot be changed</span>
              </label>
              <div className="gender-display">
                <span className={`gender-icon ${user?.gender}`}>
                  {user?.gender === 'male' ? '♂' : '♀'}
                </span>
                <span className="gender-text">
                  {user?.gender === 'male' ? 'Male' : 'Female'}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="form-group readonly">
              <label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Member Since
              </label>
              <div className="member-since">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="message error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="message success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {success}
              </div>
            )}

            {/* Save Button */}
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="btn-spinner"></span>
                  Saving...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .profile-page {
    min-height: 100vh;
    position: relative;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* Background */
  .profile-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
  }

  .profile-bg-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0f172a 100%);
  }

  .profile-bg-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 40%);
  }

  /* Loading */
  .loading-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #94a3b8;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(59, 130, 246, 0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    margin: 0 auto 20px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Header */
  .profile-header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: linear-gradient(135deg, rgba(10, 22, 40, 0.95) 0%, rgba(26, 54, 93, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  }

  .profile-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .header-spacer {
    width: 80px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #94a3b8;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    color: #60a5fa;
    transform: translateX(-3px);
  }

  .back-btn svg {
    width: 18px;
    height: 18px;
  }

  /* Content */
  .profile-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
    padding: 32px 24px;
  }

  /* Profile Card */
  .profile-card {
    width: 100%;
    max-width: 500px;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  /* Avatar Section */
  .avatar-section {
    text-align: center;
    padding: 32px 24px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
    border-bottom: 1px solid rgba(59, 130, 246, 0.15);
  }

  .avatar-large {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    font-weight: 700;
    color: white;
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
  }

  .avatar-badge {
    position: absolute;
    bottom: -6px;
    right: -6px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border: 4px solid #0f172a;
  }

  .avatar-badge.male {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
  }

  .avatar-badge.female {
    background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
    color: white;
  }

  .user-name {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 700;
    color: #f1f5f9;
  }

  .user-email {
    margin: 0;
    font-size: 14px;
    color: #64748b;
  }

  /* Form */
  .profile-form {
    padding: 24px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-group label svg {
    width: 16px;
    height: 16px;
    color: #60a5fa;
  }

  .form-group.readonly label {
    color: #64748b;
  }

  .readonly-badge {
    margin-left: auto;
    padding: 2px 8px;
    background: rgba(100, 116, 139, 0.2);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
    color: #64748b;
    text-transform: none;
    letter-spacing: 0;
  }

  .form-group input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    font-size: 15px;
    color: #f1f5f9;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  }

  .form-group input::placeholder {
    color: #475569;
  }

  .form-group input.disabled-input {
    background: rgba(30, 41, 59, 0.5);
    border-color: rgba(100, 116, 139, 0.2);
    color: #64748b;
    cursor: not-allowed;
  }

  /* Gender Display */
  .gender-display {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(30, 41, 59, 0.5);
    border: 2px solid rgba(100, 116, 139, 0.2);
    border-radius: 12px;
  }

  .gender-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .gender-icon.male {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.2) 100%);
    color: #60a5fa;
  }

  .gender-icon.female {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(190, 24, 93, 0.2) 100%);
    color: #f472b6;
  }

  .gender-text {
    font-size: 15px;
    font-weight: 500;
    color: #94a3b8;
  }

  /* Member Since */
  .member-since {
    padding: 14px 16px;
    background: rgba(30, 41, 59, 0.5);
    border: 2px solid rgba(100, 116, 139, 0.2);
    border-radius: 12px;
    font-size: 15px;
    color: #94a3b8;
  }

  /* Messages */
  .message {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .message svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .message.error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .message.success {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
  }

  /* Save Button */
  .save-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 8px;
  }

  .save-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  .save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .save-btn svg {
    width: 20px;
    height: 20px;
  }

  .btn-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .profile-header {
      padding: 12px 16px;
    }

    .profile-header h1 {
      font-size: 18px;
    }

    .back-btn {
      padding: 8px 12px;
    }

    .back-btn span {
      display: none;
    }

    .header-spacer {
      width: 42px;
    }

    .profile-content {
      padding: 20px 16px;
    }

    .avatar-section {
      padding: 24px 20px;
    }

    .avatar-large {
      width: 80px;
      height: 80px;
      font-size: 32px;
      border-radius: 20px;
    }

    .avatar-badge {
      width: 30px;
      height: 30px;
      font-size: 14px;
    }

    .user-name {
      font-size: 20px;
    }

    .profile-form {
      padding: 20px;
    }
  }
`;

export default ProfilePage;
