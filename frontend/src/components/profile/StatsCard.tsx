import React from 'react';
import { Trophy, TrendingUp, Gamepad2, BarChart3 } from 'lucide-react';
import type { User } from '../../types';

interface StatsCardProps {
  user: User;
}

const StatsCard: React.FC<StatsCardProps> = ({ user }) => {
  const stats = user.stats;
  
  const statItems = [
    {
      label: 'Total Games',
      value: stats.totalGames,
      icon: Gamepad2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Wins',
      value: stats.wins,
      icon: Trophy,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Losses',
      value: stats.losses,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: Trophy,
    },
    {
      label: 'Draws',
      value: stats.draws,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: Trophy,
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Game Statistics
          </h3>
          <p className="text-sm text-gray-600">
            Your Tic Tac Toe performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 text-center"
            >
              <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Win/Loss/Draw Ratio */}
      {stats.totalGames > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Game Distribution</span>
            <span>{stats.totalGames} games</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden flex">
            <div
              className="h-full bg-green-500"
              style={{ width: `${(stats.wins / stats.totalGames) * 100}%` }}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${(stats.losses / stats.totalGames) * 100}%` }}
            />
            <div
              className="h-full bg-yellow-500"
              style={{ width: `${(stats.draws / stats.totalGames) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Wins: {stats.wins}</span>
            <span>Losses: {stats.losses}</span>
            <span>Draws: {stats.draws}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;