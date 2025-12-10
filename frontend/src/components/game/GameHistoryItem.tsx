import React from 'react';
import { Trophy, Calendar, User, Hash } from 'lucide-react';
import Avatar from '../ui/Avatar';
import type { GameState } from '../../types';

interface GameHistoryItemProps {
  game: GameState;
  currentUserId: string;
}

const GameHistoryItem: React.FC<GameHistoryItemProps> = ({ game, currentUserId }) => {
  const isPlayerX = game.players.X.id === currentUserId;
  const playerSymbol = isPlayerX ? 'X' : 'O';
  const opponent = isPlayerX ? game.players.O : game.players.X;
  
  const getResult = () => {
    if (game.winner === 'draw') return 'Draw';
    if (game.winner === playerSymbol) return 'Win';
    return 'Loss';
  };

  const getResultColor = () => {
    if (game.winner === 'draw') return 'text-yellow-600 bg-yellow-100';
    if (game.winner === playerSymbol) return 'text-green-600 bg-green-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        {/* Game Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="font-mono font-medium text-gray-900">
                {game.gameCode}
              </span>
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor()}`}>
              {getResult()}
            </span>
            
            {game.isPublic ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Public
              </span>
            ) : (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                Private
              </span>
            )}
          </div>

          {/* Board Preview */}
          <div className="mb-3">
            <div className="grid grid-cols-3 gap-1 max-w-[120px]">
              {game.board.slice(0, 9).map((cell, index) => (
                <div
                  key={index}
                  className={`
                    aspect-square flex items-center justify-center text-xs font-bold
                    ${cell === 'X' ? 'bg-red-100 text-red-700' : ''}
                    ${cell === 'O' ? 'bg-blue-100 text-blue-700' : ''}
                    ${cell === null ? 'bg-gray-100' : ''}
                    border border-gray-200 rounded
                  `}
                >
                  {cell || ''}
                </div>
              ))}
            </div>
          </div>

          {/* Opponent Info */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">vs</span>
            <div className="flex items-center gap-2">
              <Avatar src={opponent.avatarUrl} size="sm" />
              <span className="text-sm font-medium text-gray-900">
                {opponent.username || 'Anonymous'}
              </span>
            </div>
          </div>
        </div>

        {/* Result & Date */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 mb-2">
            {game.winner === playerSymbol && (
              <Trophy className="w-4 h-4 text-yellow-500" />
            )}
            <span className="font-semibold text-gray-900">
              {game.winner === 'draw' ? '½' : game.winner === playerSymbol ? '1' : '0'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(game.finishedAt || game.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHistoryItem;