import React, { useEffect } from 'react';
import { User, Settings, Trophy } from 'lucide-react';
import AvatarUpload from '../components/profile/AvatarUpload';
import StatsCard from '../components/profile/StatsCard';
import GameHistory from '../components/profile/GameHistory';
import { useAuthStore } from '../stores/auth.store';

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    // Refresh user data when page loads
    // This could be implemented to get latest stats
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // This shouldn't happen with ProtectedRoute, but as a safety check
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-2xl text-white p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=ffffff&color=374151`}
              alt={user.username}
              className="w-24 h-24 rounded-full border-4 border-white"
            />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold">{user.username}</h1>
              {user.isAnonymous && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  Guest
                </span>
              )}
            </div>
            
            <p className="text-primary-100 mb-4">
              {user.email || 'No email provided'}
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">
                  {user.stats.wins} Wins
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium">
                  Member since {new Date(user.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Settings */}
        <div className="lg:col-span-1 space-y-8">
          <AvatarUpload />
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Account Settings
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Username</p>
                <p className="font-medium text-gray-900">{user.username}</p>
              </div>
              
              {user.email && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              )}
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Account Type</p>
                <p className="font-medium text-gray-900">
                  {user.isAnonymous ? 'Guest Account' : 'Registered Account'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & History */}
        <div className="lg:col-span-2 space-y-8">
          <StatsCard user={user} />
          <GameHistory />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;