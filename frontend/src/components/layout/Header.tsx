import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Menu, X, LogOut, User } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuthStore } from '../../stores/auth.store';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Tic Tac Toe
              </h1>
              <p className="text-xs text-gray-500">Ultimate Edition</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/game"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Play Game
            </Link>
            {isAuthenticated && (
              <Link
                to="/profile"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Profile
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2">
                  <Avatar src={user?.avatarUrl} size="sm" />
                  <span className="font-medium text-gray-900">
                    {user?.username}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col gap-4">
              <Link
                to="/game"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Play Game
              </Link>
              
              {isAuthenticated && (
                <Link
                  to="/profile"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              )}
              
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-center bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-center bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;