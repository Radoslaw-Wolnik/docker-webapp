import React, { useState } from 'react';
import { Plus, Search, Users, Copy, Globe } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useGameStore } from '../../stores/game.store';
import toast from 'react-hot-toast';

const GameLobby: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [gameType, setGameType] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);

  const { createGame, joinGame, findGame, openGames, checkOpenGames } = useGameStore();

  React.useEffect(() => {
    checkOpenGames();
    const interval = setInterval(checkOpenGames, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [checkOpenGames]);

  const handleCreateGame = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const isPublic = gameType === 'public';
      const result = await createGame(isPublic);
      
      if (!isPublic) {
        navigator.clipboard.writeText(result.gameCode);
        toast.success(`Game code ${result.gameCode} copied to clipboard!`);
      }
      
      setShowCreateModal(false);
    } catch (error) {
      // Error handled in store
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!gameCode.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await joinGame(gameCode.trim().toUpperCase());
      setShowJoinModal(false);
      setGameCode('');
    } catch (error) {
      // Error handled in store
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindRandomGame = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await findGame();
    } catch (error) {
      // Error handled in store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Play Card */}
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quick Play
            </h3>
            <p className="text-gray-600 mb-6">
              Jump into a random public game instantly
            </p>
            <Button
              onClick={handleFindRandomGame}
              loading={isLoading}
              variant="secondary"
              className="w-full"
            >
              Find Game
            </Button>
            <div className="mt-4 text-sm text-gray-500 flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{openGames} open games available</span>
            </div>
          </div>
        </div>

        {/* Create Game Card */}
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create Game
            </h3>
            <p className="text-gray-600 mb-6">
              Start a new game and invite friends
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="secondary"
              className="w-full"
            >
              Create Game
            </Button>
          </div>
        </div>

        {/* Join Game Card */}
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Join Game
            </h3>
            <p className="text-gray-600 mb-6">
              Enter a game code to play with friends
            </p>
            <Button
              onClick={() => setShowJoinModal(true)}
              variant="secondary"
              className="w-full"
            >
              Join with Code
            </Button>
          </div>
        </div>
      </div>

      {/* Create Game Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Game"
        size="sm"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Game Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGameType('public')}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${gameType === 'public' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Globe className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <div className="font-medium">Public</div>
                <p className="text-sm text-gray-500 mt-1">
                  Anyone can join
                </p>
              </button>
              
              <button
                onClick={() => setGameType('private')}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${gameType === 'private' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Copy className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <div className="font-medium">Private</div>
                <p className="text-sm text-gray-500 mt-1">
                  Invite with code
                </p>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGame}
              loading={isLoading}
              className="flex-1"
            >
              {gameType === 'public' ? 'Create Public Game' : 'Create Private Game'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join Game Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Game with Code"
        size="sm"
      >
        <div className="space-y-6">
          <div>
            <Input
              label="Enter Game Code"
              placeholder="e.g., ABC123"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength={6}
              icon={<Search className="w-4 h-4" />}
              className="text-center text-lg font-mono tracking-wider"
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
              Ask your friend for the 6-character game code
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowJoinModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinWithCode}
              disabled={!gameCode.trim()}
              loading={isLoading}
              className="flex-1"
            >
              Join Game
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GameLobby;