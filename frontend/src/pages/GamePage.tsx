// src/pages/GamePage.tsx
import React, { useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import GameLobby from '../components/game/GameLobby';
import GameBoard from '../components/game/GameBoard';
import GameInfo from '../components/game/GameInfo';
import ConnectionBanner from '../components/game/ConnectionBanner';
import { useGameStore } from '../stores/game.store';
import { useAuthStore } from '../stores/auth.store';
import { useSocketConnection } from '../hooks/useSocketConnection';
import { usePlayerDisconnectCountdown } from '../hooks/usePlayerDisconnectCountdown';
import { useGameSocketHandlers } from '../hooks/useGameSocketHandlers';
import { calculateWinningLine } from '../utils/calculateWinningLine';
import { socketService } from '../api/socket';
import type { GameState } from '../types';

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { currentGame, updateGameState, resetGame } = useGameStore();
  const { user } = useAuthStore();

  // connection hooks
  const { isConnecting, isConnected, reconnect } = useSocketConnection(true);
  const { disconnectedPlayer, countdown } = usePlayerDisconnectCountdown();

  // stable ref to the singleton socket service (avoids dynamic requires)
  const socketRef = useRef(socketService);

  // Handlers: server sends full GameState for both updates and game end
  const handleGameState = useCallback((game: GameState) => {
    updateGameState(game);
  }, [updateGameState]);

  const handleGameEnded = useCallback((game: GameState) => {
    // server sends full GameState when game ends; store it as authoritative
    updateGameState(game);
  }, [updateGameState]);

  // Register socket listeners (keeps the page thin)
  useGameSocketHandlers({
    gameId,
    onGameState: handleGameState,
    onGameEnded: handleGameEnded,
    // we intentionally don't pass an onMove handler — prefer server's full game_state
  });

  // User actions
  const handleCellClick = useCallback((position: number) => {
    if (!currentGame || currentGame.status !== 'active' || !user) return;

    // cell occupied?
    if (currentGame.board[position] !== null) return;

    const isCurrentPlayerX = currentGame.players.X.id === user.id;
    const isCurrentPlayerO = currentGame.players.O.id === user.id;
    const isCurrentPlayerTurn =
      (isCurrentPlayerX && currentGame.currentTurn === 'X') ||
      (isCurrentPlayerO && currentGame.currentTurn === 'O');

    if (!isCurrentPlayerTurn) {
      // optionally: toast to inform user
      return;
    }

    // block if opponent disconnected
    if (disconnectedPlayer) return;

    try {
      socketRef.current.makeMove(currentGame.gameId, position);
    } catch (err) {
      // fallback: try calling store's makeMove (API) or surface error
      console.error('Failed to send move via socket', err);
    }
  }, [currentGame, user, disconnectedPlayer]);

  const handleBackToLobby = useCallback(() => {
    if (currentGame?.gameId) {
      socketRef.current.leaveGame(currentGame.gameId);
    }
    resetGame();
  }, [currentGame?.gameId, resetGame]);

  const handlePlayAgain = useCallback(() => {
    if (currentGame?.gameId) {
      socketRef.current.leaveGame(currentGame.gameId);
    }
    resetGame();
  }, [currentGame?.gameId, resetGame]);

  // Derived values
  const winningLine = useMemo(() => {
    if (!currentGame) return [];
    return currentGame.winningLine ?? calculateWinningLine(currentGame.board);
  }, [currentGame]);

  // Render
  if (currentGame) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <ConnectionBanner
            isConnecting={isConnecting}
            isConnected={isConnected}
            disconnectedPlayer={disconnectedPlayer}
            countdown={countdown}
            onReconnect={reconnect}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={handleBackToLobby} icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Lobby
            </Button>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="text-sm text-gray-500 font-mono">
                Room: <span className="font-bold text-primary-600">{currentGame.gameCode}</span>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <GameInfo
                  game={currentGame}
                  currentUserId={user?.id}
                  connectionStatus={isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected'}
                />

                <div className="bg-white rounded-xl shadow-lg p-5 mt-6">
                  <h3 className="font-bold text-gray-800 mb-4">Game Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Turn:</span>
                      <span className="font-bold text-primary-700">
                        {currentGame.currentTurn === 'X' ? currentGame.players.X.username : currentGame.players.O.username}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentGame.status === 'active' ? 'bg-green-100 text-green-800' :
                        currentGame.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {currentGame.status.charAt(0).toUpperCase() + currentGame.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Moves:</span>
                      <span className="font-bold text-gray-800">{currentGame.board.filter(Boolean).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                {isConnecting ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary-600 rounded-full animate-spin border-t-transparent"></div>
                    </div>
                    <p className="mt-6 text-lg font-medium text-gray-700">Connecting to game...</p>
                    <p className="mt-2 text-gray-500 text-center max-w-md">Please wait while we establish a secure connection with the game server</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <GameBoard
                        board={currentGame.board}
                        onCellClick={handleCellClick}
                        disabled={currentGame.status !== 'active' || !!disconnectedPlayer}
                        winningLine={winningLine}
                        isLoading={isConnecting}
                      />
                    </div>

                    {currentGame.status === 'waiting' && (
                      <div className="mt-8 p-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                          <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-ping"></div>
                        </div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Waiting for Opponent</h3>
                        <p className="text-blue-700 mb-4 max-w-md mx-auto">Share the game code below with your friend to start playing</p>
                        <div className="bg-white inline-block px-6 py-3 rounded-lg border border-blue-300">
                          <p className="text-sm text-blue-600 mb-1">Game Code</p>
                          <p className="text-3xl font-mono font-bold text-blue-800 tracking-wider">{currentGame.gameCode}</p>
                        </div>
                        <p className="text-blue-600 text-sm mt-4">Or wait for a random player to join...</p>
                      </div>
                    )}

                    {currentGame.status === 'finished' && (
                      <div className="mt-8 p-8 bg-linear-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200 text-center">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${currentGame.winner === 'draw' ? 'bg-gray-100' : 'bg-primary-100'}`}>
                          <span className={`text-3xl font-bold ${currentGame.winner === 'draw' ? 'text-gray-700' : 'text-primary-700'}`}>
                            {currentGame.winner === 'draw' ? '🤝' : '🏆'}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-primary-900 mb-2">Game Over!</h3>
                        <p className="text-primary-700 text-lg mb-6">
                          {currentGame.winner === 'draw' ? "It's a draw! Well played both!" : `🎉 ${currentGame.players[currentGame.winner!].username} wins!`}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button onClick={handlePlayAgain} className="px-8 py-3 text-lg">Play Again</Button>
                          <Link to="/profile">
                            <Button variant="outline" className="px-8 py-3 text-lg border-primary-300 hover:bg-primary-50">View Profile</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby UI (no active game)
  return (
    <div className="flex grow p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-linear-to-br from-violet-700 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">X O</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Play Tic Tac Toe</h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            Challenge friends or join random players in the ultimate Tic Tac Toe experience.
            Play as guest or create an account to track your stats and climb the leaderboard!
          </p>
        </div>

        <GameLobby />
      </div>
    </div>
  );
};

export default GamePage;
