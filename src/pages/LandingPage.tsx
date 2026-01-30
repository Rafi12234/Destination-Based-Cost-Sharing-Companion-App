/**
 * Landing Page Component
 * Animated, interactive landing page with dark blue theme
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth scroll handler for anchor links
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Page transition handler for navigation
  const handleNavigate = (path: string) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 400);
  };

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      
      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>

      {/* Glowing Orbs */}
      <div 
        className="glow-orb orb-1" 
        style={{ 
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)` 
        }}
      ></div>
      <div 
        className="glow-orb orb-2"
        style={{ 
          transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)` 
        }}
      ></div>
      <div 
        className="glow-orb orb-3"
        style={{ 
          transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)` 
        }}
      ></div>

      {/* Main Content */}
      <div className={`content ${isLoaded ? 'loaded' : ''} ${isExiting ? 'exiting' : ''}`}>
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-logo">
            <div className="logo-icon">
              <img src="https://res.cloudinary.com/dnzjg9lq8/image/upload/v1769803479/Adobe_Express_-_file_sul5xs.png" alt="RideSplit Logo" />
            </div>
            <span>RideSplit</span>
          </div>
          
          <div className="nav-links">
            <a href="#features" className="nav-link" onClick={(e) => handleSmoothScroll(e, 'features')}>Features</a>
            <a href="#how-it-works" className="nav-link" onClick={(e) => handleSmoothScroll(e, 'how-it-works')}>How It Works</a>
            <a href="#safety" className="nav-link" onClick={(e) => handleSmoothScroll(e, 'safety')}>Safety</a>
          </div>

          <div className="nav-buttons">
            <button className="btn-signin" onClick={() => handleNavigate('/login')}>
              Sign In
            </button>
            <button className="btn-signup" onClick={() => handleNavigate('/register')}>
              Get Started
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            🚀 Now Live in Your City
          </div>
          
          <h1 className="hero-title">
            <span className="title-line">Share Your</span>
            <span className="title-line gradient-text">Journey Today</span>
          </h1>
          
          <p className="hero-subtitle">
            Connect with travelers heading your way. Split costs, reduce your carbon footprint, 
            and make meaningful connections on every ride.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => handleNavigate('/register')}>
              <span className="btn-content">
                Start Riding Free
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
              <span className="btn-glow"></span>
            </button>
            
            <button className="btn-secondary" onClick={() => handleNavigate('/login')}>
              <span className="btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                </svg>
              </span>
              Sign In to Account
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Active Riders</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">120K</span>
              <span className="stat-label">Rides Shared</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">$2M+</span>
              <span className="stat-label">Costs Saved</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features" id="features">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2>Why Choose RideSplit?</h2>
            <p>Everything you need for smarter, safer, and more affordable travel</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3>Real-time Matching</h3>
              <p>Our smart algorithm finds riders heading to your exact destination within a 2km radius</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Safe & Secure</h3>
              <p>Verified profiles, in-app chat, and optional gender-based matching for your comfort</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <h3>Split Costs</h3>
              <p>Share travel expenses fairly and save up to 60% on every ride you take</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <h3>Instant Chat</h3>
              <p>Connect directly with your matched riders to coordinate pickup and details</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                </svg>
              </div>
              <h3>Go Green</h3>
              <p>Reduce your carbon footprint by sharing rides and help save the planet</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3>Lightning Fast</h3>
              <p>Get matched with compatible riders in seconds, not minutes</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works" id="how-it-works">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2>Start in 3 Simple Steps</h2>
            <p>Getting started with RideSplit is easier than ever</p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Create Account</h3>
              <p>Sign up in seconds with your email and create your rider profile</p>
            </div>

            <div className="step-connector">
              <svg viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q50 10 100 10" stroke="url(#connector-gradient)" strokeWidth="2" fill="none" strokeDasharray="5,5"/>
              </svg>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <h3>Set Destination</h3>
              <p>Enter where you're heading and go online to start matching</p>
            </div>

            <div className="step-connector">
              <svg viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q50 10 100 10" stroke="url(#connector-gradient)" strokeWidth="2" fill="none" strokeDasharray="5,5"/>
              </svg>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3>Connect & Ride</h3>
              <p>Chat with matches, coordinate pickup, and share your journey</p>
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section className="safety-section" id="safety">
          <div className="section-header">
            <span className="section-badge">Safety First</span>
            <h2>Your Safety is Our Priority</h2>
            <p>We've built multiple layers of security to keep you protected</p>
          </div>

          <div className="safety-grid">
            <div className="safety-card">
              <div className="safety-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9,12 11,14 15,10"/>
                </svg>
              </div>
              <h3>Verified Profiles</h3>
              <p>Every user goes through identity verification to ensure authentic connections</p>
            </div>

            <div className="safety-card">
              <div className="safety-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3>Gender Matching</h3>
              <p>Optional gender-based matching for added comfort and peace of mind</p>
            </div>

            <div className="safety-card">
              <div className="safety-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <h3>In-App Messaging</h3>
              <p>Communicate securely without sharing personal contact information</p>
            </div>

            <div className="safety-card">
              <div className="safety-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <h3>Real-time Tracking</h3>
              <p>Share your journey with trusted contacts in real-time</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Start Sharing?</h2>
            <p>Join thousands of smart travelers saving money and making connections every day</p>
            
            <div className="cta-buttons">
              <button className="btn-cta-primary" onClick={() => handleNavigate('/register')}>
                Create Free Account
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="btn-cta-secondary" onClick={() => handleNavigate('/login')}>
                Already have an account? Sign In
              </button>
            </div>
          </div>
          
          <div className="cta-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">
                  <img src="https://res.cloudinary.com/dnzjg9lq8/image/upload/v1769803479/Adobe_Express_-_file_sul5xs.png" alt="RideSplit Logo" />
                </div>
                <span>RideSplit</span>
              </div>
              <p>Making travel smarter, safer, and more affordable for everyone.</p>
            </div>
            
            <div className="footer-bottom">
              <p>© 2026 RideSplit. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* SVG Defs for gradients */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="1"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>

      <style>{`
        /* ========== BASE STYLES ========== */
        .landing-page {
          min-height: 100vh;
          background: #0a1628;
          position: relative;
          overflow-x: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ========== ANIMATED BACKGROUND ========== */
        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
            linear-gradient(180deg, #0a1628 0%, #0d1b2a 50%, #0a1628 100%);
          animation: gradientShift 15s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes gradientShift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
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
          background-size: 60px 60px;
          z-index: 0;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
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
          background: rgba(59, 130, 246, 0.6);
          border-radius: 50%;
          animation: particleFloat 20s infinite ease-in-out;
        }

        ${[...Array(20)].map((_, i) => `
          .particle-${i + 1} {
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 10}s;
            animation-duration: ${15 + Math.random() * 10}s;
            opacity: ${0.3 + Math.random() * 0.5};
            width: ${2 + Math.random() * 4}px;
            height: ${2 + Math.random() * 4}px;
          }
        `).join('')}

        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(50px, -30px) scale(1.2); opacity: 0.6; }
          50% { transform: translate(-20px, -60px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(30px, -20px) scale(1.1); opacity: 0.5; }
        }

        /* ========== GLOWING ORBS ========== */
        .glow-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
          transition: transform 0.3s ease-out;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
          top: -150px;
          right: -100px;
          animation: orbPulse1 8s ease-in-out infinite;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          animation: orbPulse2 10s ease-in-out infinite;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          animation: orbPulse3 12s ease-in-out infinite;
        }

        @keyframes orbPulse1 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          50% { transform: scale(1.2) translate(-30px, 30px); opacity: 0.8; }
        }

        @keyframes orbPulse2 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50% { transform: scale(1.3) translate(40px, -20px); opacity: 0.7; }
        }

        @keyframes orbPulse3 {
          0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 0.4; }
          50% { transform: scale(1.1) translate(-45%, -55%); opacity: 0.6; }
        }

        /* ========== CONTENT ========== */
        .content {
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .content.loaded {
          opacity: 1;
          transform: translateY(0);
        }

        .content.exiting {
          opacity: 0;
          transform: translateY(-30px) scale(0.98);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ========== NAVBAR ========== */
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 60px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(10, 22, 40, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(59, 130, 246, 0.1);
          animation: navSlide 0.6s ease forwards;
        }

        @keyframes navSlide {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .nav-logo .logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }

        .nav-logo .logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .nav-links {
          display: flex;
          gap: 40px;
        }

        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          transition: width 0.3s ease;
        }

        .nav-link:hover {
          color: #60a5fa;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .nav-buttons {
          display: flex;
          gap: 16px;
        }

        .btn-signin {
          padding: 12px 24px;
          background: transparent;
          color: #e2e8f0;
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-signin:hover {
          border-color: #3b82f6;
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.1);
          transform: translateY(-2px);
        }

        .btn-signup {
          padding: 12px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .btn-signup svg {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
        }

        .btn-signup:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .btn-signup:hover svg {
          transform: translateX(4px);
        }

        /* ========== HERO SECTION ========== */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 140px 20px 80px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 50px;
          color: #60a5fa;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 32px;
          animation: badgeFade 0.8s ease 0.3s backwards;
        }

        @keyframes badgeFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: dotPulse 2s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }

        .hero-title {
          font-size: clamp(48px, 8vw, 80px);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
        }

        .title-line {
          display: block;
          color: #f1f5f9;
          animation: titleSlide 0.8s ease backwards;
        }

        .title-line:nth-child(1) { animation-delay: 0.4s; }
        .title-line:nth-child(2) { animation-delay: 0.5s; }

        @keyframes titleSlide {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 20px;
          color: #94a3b8;
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 48px;
          animation: subtitleFade 0.8s ease 0.6s backwards;
        }

        @keyframes subtitleFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-buttons {
          display: flex;
          gap: 20px;
          margin-bottom: 80px;
          animation: buttonsFade 0.8s ease 0.7s backwards;
        }

        @keyframes buttonsFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .btn-primary {
          position: relative;
          padding: 18px 36px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        }

        .btn-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-content svg {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .btn-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: all 0.5s ease;
        }

        .btn-primary:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.5);
        }

        .btn-primary:hover .btn-glow {
          width: 300px;
          height: 300px;
        }

        .btn-primary:hover .btn-content svg {
          transform: translateX(5px);
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 32px;
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon svg {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-4px);
        }

        .btn-secondary:hover .btn-icon svg {
          transform: translateX(-3px);
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 40px;
          animation: statsFade 0.8s ease 0.8s backwards;
        }

        @keyframes statsFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 36px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #f1f5f9 0%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-divider {
          width: 1px;
          height: 50px;
          background: linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.3), transparent);
        }

        /* ========== FEATURES SECTION ========== */
        .features {
          padding: 120px 60px;
          scroll-margin-top: 100px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-badge {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 50px;
          color: #60a5fa;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 44px;
          font-weight: 800;
          color: #f1f5f9;
          margin-bottom: 16px;
        }

        .section-header p {
          font-size: 18px;
          color: #64748b;
          max-width: 500px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background: linear-gradient(135deg, rgba(19, 34, 56, 0.8) 0%, rgba(26, 45, 71, 0.6) 100%);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 24px;
          padding: 40px 32px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa, #a78bfa);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 20px 50px rgba(59, 130, 246, 0.15);
        }

        .feature-card:hover::before {
          transform: scaleX(1);
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          transition: all 0.4s ease;
        }

        .feature-icon svg {
          width: 32px;
          height: 32px;
          color: #60a5fa;
        }

        .feature-card:hover .feature-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          transform: scale(1.1) rotate(5deg);
        }

        .feature-card:hover .feature-icon svg {
          color: white;
        }

        .feature-card h3 {
          font-size: 20px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 12px;
        }

        .feature-card p {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
        }

        /* ========== HOW IT WORKS ========== */
        .how-it-works {
          padding: 120px 60px;
          background: linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.03) 50%, transparent 100%);
          scroll-margin-top: 100px;
        }

        .steps-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .step-card {
          background: linear-gradient(135deg, rgba(19, 34, 56, 0.9) 0%, rgba(26, 45, 71, 0.7) 100%);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 24px;
          padding: 48px 36px;
          text-align: center;
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          flex: 1;
          max-width: 320px;
        }

        .step-card:hover {
          transform: translateY(-10px);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 25px 60px rgba(59, 130, 246, 0.2);
        }

        .step-number {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: white;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
        }

        .step-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          transition: all 0.4s ease;
        }

        .step-icon svg {
          width: 40px;
          height: 40px;
          color: #60a5fa;
        }

        .step-card:hover .step-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          transform: scale(1.1);
        }

        .step-card:hover .step-icon svg {
          color: white;
        }

        .step-card h3 {
          font-size: 22px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 12px;
        }

        .step-card p {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .step-connector {
          width: 80px;
          height: 20px;
          flex-shrink: 0;
        }

        .step-connector svg {
          width: 100%;
          height: 100%;
        }

        /* ========== SAFETY SECTION ========== */
        .safety-section {
          padding: 120px 60px;
          position: relative;
          scroll-margin-top: 100px;
        }

        .safety-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .safety-card {
          background: linear-gradient(135deg, rgba(19, 34, 56, 0.8) 0%, rgba(26, 45, 71, 0.6) 100%);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 24px;
          padding: 40px 32px;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .safety-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .safety-card:hover {
          transform: translateY(-8px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 20px 50px rgba(59, 130, 246, 0.15);
        }

        .safety-card:hover::before {
          opacity: 1;
        }

        .safety-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.1) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s ease;
        }

        .safety-card:hover .safety-icon {
          transform: scale(1.1) rotate(5deg);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(96, 165, 250, 0.15) 100%);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
        }

        .safety-icon svg {
          width: 36px;
          height: 36px;
          color: #60a5fa;
        }

        .safety-card h3 {
          font-size: 20px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 12px;
        }

        .safety-card p {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
        }

        /* ========== CTA SECTION ========== */
        .cta-section {
          padding: 100px 60px;
          position: relative;
          overflow: hidden;
        }

        .cta-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
          background: linear-gradient(135deg, rgba(19, 34, 56, 0.95) 0%, rgba(26, 45, 71, 0.9) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 32px;
          padding: 80px 60px;
        }

        .cta-content h2 {
          font-size: 40px;
          font-weight: 800;
          color: #f1f5f9;
          margin-bottom: 16px;
        }

        .cta-content > p {
          font-size: 18px;
          color: #94a3b8;
          margin-bottom: 40px;
        }

        .cta-buttons {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .btn-cta-primary {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 40px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        }

        .btn-cta-primary svg {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .btn-cta-primary:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.5);
        }

        .btn-cta-primary:hover svg {
          transform: translateX(5px);
        }

        .btn-cta-secondary {
          padding: 12px 24px;
          background: transparent;
          color: #94a3b8;
          border: none;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cta-secondary:hover {
          color: #60a5fa;
        }

        .cta-decoration {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 0;
        }

        .decoration-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(59, 130, 246, 0.1);
        }

        .circle-1 {
          width: 400px;
          height: 400px;
          top: -100px;
          left: -100px;
          animation: circleRotate 30s linear infinite;
        }

        .circle-2 {
          width: 300px;
          height: 300px;
          bottom: -50px;
          right: -50px;
          animation: circleRotate 25s linear infinite reverse;
        }

        .circle-3 {
          width: 200px;
          height: 200px;
          top: 50%;
          left: 10%;
          animation: circleRotate 20s linear infinite;
        }

        @keyframes circleRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ========== FOOTER ========== */
        .footer {
          padding: 60px;
          border-top: 1px solid rgba(59, 130, 246, 0.1);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-brand {
          text-align: center;
          margin-bottom: 40px;
        }

        .footer-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }

        .footer-logo .logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .footer-logo .logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .footer-brand p {
          color: #64748b;
          font-size: 15px;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-bottom p {
          color: #475569;
          font-size: 14px;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1024px) {
          .navbar {
            padding: 16px 30px;
          }

          .nav-links {
            display: none;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .steps-container {
            flex-direction: column;
            gap: 40px;
          }

          .step-connector {
            transform: rotate(90deg);
            width: 40px;
          }

          .step-card {
            max-width: 400px;
          }
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 14px 20px;
          }

          .nav-buttons {
            gap: 10px;
          }

          .btn-signin {
            padding: 10px 16px;
            font-size: 14px;
          }

          .btn-signup {
            padding: 10px 16px;
            font-size: 14px;
          }

          .btn-signup span {
            display: none;
          }

          .hero {
            padding: 120px 20px 60px;
          }

          .hero-buttons {
            flex-direction: column;
            width: 100%;
            max-width: 320px;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            justify-content: center;
          }

          .hero-stats {
            flex-direction: column;
            gap: 24px;
          }

          .stat-divider {
            width: 50px;
            height: 1px;
          }

          .features,
          .how-it-works {
            padding: 80px 20px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .section-header h2 {
            font-size: 32px;
          }

          .cta-section {
            padding: 60px 20px;
          }

          .cta-content {
            padding: 50px 30px;
          }

          .cta-content h2 {
            font-size: 28px;
          }

          .footer {
            padding: 40px 20px;
          }
        }

        @media (max-width: 480px) {
          .nav-logo span {
            display: none;
          }

          .hero-title {
            font-size: 36px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .feature-card {
            padding: 30px 24px;
          }

          .step-card {
            padding: 40px 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
