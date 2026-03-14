/**
 * Main App Component
 * Sets up routing and global providers
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { onAuthChange } from './firebase/auth';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import MapPage from './pages/MapPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

interface RouteGuardProps {
  user: User | null;
  isLoading: boolean;
  children: React.ReactElement;
}

const RouteLoading: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 60%, #0f172a 100%)',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    }}
  >
    Checking session...
  </div>
);

const ProtectedRoute: React.FC<RouteGuardProps> = ({ user, isLoading, children }) => {
  if (isLoading) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute: React.FC<RouteGuardProps> = ({ user, isLoading, children }) => {
  if (isLoading) return <RouteLoading />;
  if (user) return <Navigate to="/map" replace />;
  return children;
};

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setAuthUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute user={authUser} isLoading={isAuthLoading}>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />
        
        <Route
          path="/login"
          element={
            <PublicOnlyRoute user={authUser} isLoading={isAuthLoading}>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute user={authUser} isLoading={isAuthLoading}>
              <Register />
            </PublicOnlyRoute>
          }
        />
        
        <Route
          path="/map"
          element={
            <ProtectedRoute user={authUser} isLoading={isAuthLoading}>
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute user={authUser} isLoading={isAuthLoading}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={authUser} isLoading={isAuthLoading}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="*"
          element={<Navigate to={authUser ? '/map' : '/'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
