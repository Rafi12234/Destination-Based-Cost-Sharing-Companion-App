/**
 * Main App Component
 * Sets up routing and global providers
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MapPage from './pages/MapPage';
import ChatPage from './pages/ChatPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Main app routes */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
