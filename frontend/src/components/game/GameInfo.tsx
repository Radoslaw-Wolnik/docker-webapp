import React from 'react';
import { Gamepad2, Users, Trophy, Clock } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import type { GameState } from '../../types';

interface GameInfoProps {
  game: GameState;
  currentUserId?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting'; // Add this
}

const GameInfo: React.FC<GameInfoProps> = ({ game, currentUserId, connectionStatus }) => {
  const isCurrentPlayerX = game.players.X.id === currentUserId;
  const isCurrentPlayerO = game.players.O.id === currentUserId;
  const isCurrentPlayerTurn = 
    (isCurrentPlayerX && game.currentTurn === 'X') ||
    (isCurrentPlayerO && game.currentTurn === 'O');

  const getStatusBadge = () => {
    switch (game.status) {
      case 'waiting':
        return <Badge variant="warning">Waiting for opponent</Badge>;
      case 'active':
        return <Badge variant="success">Game in progress</Badge>;
      case 'finished':
        return <Badge variant="secondary">Game finished</Badge>;
      default:
        return null;
    }
  };

  const getTurnIndicator = () => {
    if (game.status !== 'active') return null;
    
    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full animate-pulse ${
          game.currentTurn === 'X' ? 'bg-red-500' : 'bg-blue-500'
        }`} />
        <span className="text-sm font-medium">
          {isCurrentPlayerTurn ? 'Your turn!' : `${game.players[game.currentTurn].username}'s turn`}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Game {game.gameCode}
          </h2>
        </div>
        {getStatusBadge()}
        {connectionStatus && (
          // And add this somewhere in the component (maybe after the status badge):
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
          </div>
        )}
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Player X */}
        <div className={`
          p-4 rounded-lg border-2
          ${isCurrentPlayerX ? 'border-red-300 bg-red-50' : 'border-gray-200'}
        `}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={game.players.X.avatarUrl} size="md" />
            <div>
              <h3 className="font-semibold text-gray-900">
                {game.players.X.username}
                {isCurrentPlayerX && <span className="ml-2 text-sm text-red-600">(You)</span>}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-600">X</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player O */}
        <div className={`
          p-4 rounded-lg border-2
          ${isCurrentPlayerO ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}
        `}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={game.players.O.avatarUrl} size="md" />
            <div>
              <h3 className="font-semibold text-gray-900">
                {game.players.O.username || 'Waiting...'}
                {isCurrentPlayerO && <span className="ml-2 text-sm text-blue-600">(You)</span>}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-blue-600">O</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      


      {/* Game Info */}
      <div className="space-y-4">
        {getTurnIndicator()}
        
        {game.status === 'finished' && game.winner && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800">
              {game.winner === 'draw' ? 'Game ended in a draw!' : `${game.players[game.winner].username} wins!`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Created {new Date(game.createdAt).toLocaleDateString()}</span>
          </div>
          
          {game.isPublic ? (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Public Game</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
              Private • Code: {game.gameCode}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;