import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import Button from '../ui/Button';
import GameHistoryItem from '../game/GameHistoryItem';
import { useGameStore } from '../../stores/game.store';
import { useAuthStore } from '../../stores/auth.store';

const GameHistory: React.FC = () => {
  const { gameHistory, loadGameHistory, isLoading } = useGameStore();
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadGameHistory(currentPage);
  }, [currentPage, loadGameHistory]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < gameHistory.pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <History className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Game History
            </h3>
            <p className="text-sm text-gray-600">
              Your past {gameHistory.total} games
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-gray-600">Loading games...</p>
        </div>
      ) : gameHistory.games.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No games yet
          </h4>
          <p className="text-gray-600 max-w-sm mx-auto">
            Play some games and they'll appear here. Try creating or joining a game!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {gameHistory.games.map((game) => (
              <GameHistoryItem
                key={game.gameId}
                game={game}
                currentUserId={user.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {gameHistory.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 10) + 1} to{' '}
                {Math.min(currentPage * 10, gameHistory.total)} of{' '}
                {gameHistory.total} games
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                  Page {currentPage} of {gameHistory.pages}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === gameHistory.pages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GameHistory;