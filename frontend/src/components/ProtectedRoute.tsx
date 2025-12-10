import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // true for protected routes, false for public-only routes
  redirectTo?: string;   // Custom redirect path
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo
}) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Handle protected routes (require authentication)
  if (requireAuth && !isAuthenticated) {
    // Redirect to login, saving the attempted location
    const to = redirectTo || '/login';
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  // Handle public-only routes (like login/register when already authenticated)
  if (!requireAuth && isAuthenticated) {
    // Redirect to home or profile if already logged in
    const to = redirectTo || '/';
    return <Navigate to={to} replace />;
  }

  // All checks passed, render the children
  return <>{children}</>;
};

export default ProtectedRoute;