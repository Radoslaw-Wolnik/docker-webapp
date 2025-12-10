import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import GamePage from './pages/GamePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuthStore } from './stores/auth.store';
import { socketService } from './api/socket';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const { checkAuth, token } = useAuthStore();

  useEffect(() => {
    // Check authentication on app load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Connect WebSocket with current token
    if (token) {
      socketService.connect(token);
    }
  }, [token]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/game" />} />
          <Route path="game" element={<GamePage />} />
          <Route path="game/:gameId" element={<GamePage />} />
          
          {/* Protected routes - require authentication */}
          <Route path="profile" element={
            <ProtectedRoute requireAuth={true}>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Auth routes - redirect if already authenticated */}
          <Route path="login" element={
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } />
          
          <Route path="register" element={
            <ProtectedRoute requireAuth={false}>
              <RegisterPage />
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;