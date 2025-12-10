import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import GameLobby from '../components/game/GameLobby';
import GameBoard from '../components/game/GameBoard';
import GameInfo from '../components/game/GameInfo';
import { useGameStore } from '../stores/game.store';
import { useAuthStore } from '../stores/auth.store';
import { socketService } from '../api/socket';
import toast from 'react-hot-toast';

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { currentGame, updateGameState, resetGame } = useGameStore();
  const { user } = useAuthStore();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [disconnectedPlayer, setDisconnectedPlayer] = useState<{
    username: string;
    timeout: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Calculate winning line function
  const calculateWinningLine = (board: ('X' | 'O' | null)[]): number[] => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6], // Diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return line;
      }
    }

    return [];
  };

  // Socket connection status effect
  useEffect(() => {
    const handleSocketConnected = () => {
      setIsSocketConnected(true);
      setIsConnecting(false);
      toast.success('Connected to game server');
    };

    const handleSocketDisconnected = (data: { reason: string }) => {
      setIsSocketConnected(false);
      if (data.reason !== 'io client disconnect') {
        toast.error('Disconnected from server. Reconnecting...');
      }
    };

    const handleSocketReconnecting = () => {
      setIsConnecting(true);
    };

    const handleSocketError = (data: { message: string }) => {
      toast.error(`Connection error: ${data.message}`);
    };

    socketService.on('socket:connected', handleSocketConnected);
    socketService.on('socket:disconnected', handleSocketDisconnected);
    socketService.on('socket:reconnecting', handleSocketReconnecting);
    socketService.on('socket:error', handleSocketError);

    return () => {
      socketService.off('socket:connected', handleSocketConnected);
      socketService.off('socket:disconnected', handleSocketDisconnected);
      socketService.off('socket:reconnecting', handleSocketReconnecting);
      socketService.off('socket:error', handleSocketError);
    };
  }, []);

  // Player disconnect/reconnect handlers
  useEffect(() => {
    const handlePlayerDisconnected = (data: { 
      username: string;
      timeout?: number;
    }) => {
      setDisconnectedPlayer({
        username: data.username,
        timeout: data.timeout || 30,
      });
      setCountdown(data.timeout || 30);
      toast.error(`${data.username} disconnected. Waiting for reconnection...`);
    };

    const handlePlayerReconnected = (data: { username: string }) => {
      setDisconnectedPlayer(null);
      setCountdown(null);
      toast.success(`${data.username} reconnected!`);
    };

    socketService.on('player_disconnected', handlePlayerDisconnected);
    socketService.on('player_reconnected', handlePlayerReconnected);

    return () => {
      socketService.off('player_disconnected', handlePlayerDisconnected);
      socketService.off('player_reconnected', handlePlayerReconnected);
    };
  }, []);

  // Countdown timer for disconnected player
  useEffect(() => {
    let interval: number;
    
    if (countdown !== null && countdown > 0) {
      interval = window.setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  // Main game event handlers
  useEffect(() => {
    // Initialize WebSocket connection
    const token = localStorage.getItem('token');
    setIsConnecting(true);
    socketService.connect(token || undefined);

    // Set up event listeners
    const handleGameState = (game: any) => {
      updateGameState(game);
    };

    const handleError = (data: { message: string }) => {
      toast.error(data.message);
    };

    const handleGameEnded = (data: { 
      winner: 'X' | 'O' | 'draw' | null;
      winningLine?: number[];
    }) => {
      if (currentGame) {
        updateGameState({
          ...currentGame,
          winner: data.winner,
          status: 'finished',
          winningLine: data.winningLine
        });
      }
    };

    const handleMoveMade = (data: any) => {
      if (currentGame && currentGame.gameId === data.gameId) {
        updateGameState({
          ...currentGame,
          board: data.board,
          currentTurn: data.currentTurn || (data.player === 'X' ? 'O' : 'X')
        });
      }
    };

    socketService.on('game_state', handleGameState);
    socketService.on('error', handleError);
    socketService.on('game_ended', handleGameEnded);
    socketService.on('move_made', handleMoveMade);

    // Join game room if gameId is provided
    if (gameId && socketService.isConnected()) {
      socketService.joinGame(gameId);
    }

    return () => {
      socketService.off('game_state', handleGameState);
      socketService.off('error', handleError);
      socketService.off('game_ended', handleGameEnded);
      socketService.off('move_made', handleMoveMade);
    };
  }, [gameId, updateGameState, currentGame]);

  useEffect(() => {
    return () => {
      // Leave game room when component unmounts
      if (currentGame?.gameId) {
        socketService.leaveGame(currentGame.gameId);
      }
    };
  }, [currentGame?.gameId]);

  const handleCellClick = async (position: number) => {
    if (!currentGame || currentGame.status !== 'active' || !user) return;
    
    // Check if cell is already occupied
    if (currentGame.board[position] !== null) {
      toast.error('Cell already occupied!');
      return;
    }
    
    // Check if it's current player's turn
    const isCurrentPlayerX = currentGame.players.X.id === user.id;
    const isCurrentPlayerO = currentGame.players.O.id === user.id;
    const isCurrentPlayerTurn = 
      (isCurrentPlayerX && currentGame.currentTurn === 'X') ||
      (isCurrentPlayerO && currentGame.currentTurn === 'O');
    
    if (!isCurrentPlayerTurn) {
      toast.error("It's not your turn!");
      return;
    }

    // Check if opponent is disconnected
    if (disconnectedPlayer) {
      toast.error('Opponent is disconnected. Please wait...');
      return;
    }

    try {
      socketService.makeMove(currentGame.gameId, position);
    } catch (error) {
      toast.error('Failed to make move');
    }
  };

  const handleBackToLobby = () => {
    if (currentGame?.gameId) {
      socketService.leaveGame(currentGame.gameId);
    }
    resetGame();
  };

  const handleReconnect = () => {
    setIsConnecting(true);
    socketService.reconnect();
  };

  const handlePlayAgain = () => {
    if (currentGame?.gameId) {
      socketService.leaveGame(currentGame.gameId);
    }
    resetGame();
  };

  if (currentGame) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Connection Status Bar */}
          <div className="mb-6">
            {!isSocketConnected && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <WifiOff className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <span className="text-red-800 font-semibold">
                      {isConnecting ? 'Connecting to server...' : 'Disconnected from server'}
                    </span>
                    <p className="text-red-600 text-sm mt-1">
                      {isConnecting ? 'Please wait while we establish connection' : 'Your moves may not be saved'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReconnect}
                  disabled={isConnecting}
                  className="border-red-300 hover:bg-red-100"
                  icon={<RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />}
                >
                  {isConnecting ? 'Connecting...' : 'Reconnect'}
                </Button>
              </div>
            )}

            {disconnectedPlayer && (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <span className="text-yellow-800 font-semibold">
                      {disconnectedPlayer.username} disconnected
                      {countdown !== null && ` (${countdown}s)`}
                    </span>
                    <p className="text-yellow-700 text-sm mt-1">
                      Game will be forfeited if they don't reconnect
                    </p>
                  </div>
                </div>
                <div className="text-sm text-yellow-700 font-medium bg-yellow-100 px-3 py-1 rounded-full">
                  Waiting...
                </div>
              </div>
            )}
          </div>

          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToLobby}
              icon={<ArrowLeft className="w-4 h-4" />}
              className="hover:bg-gray-200"
            >
              Back to Lobby
            </Button>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isSocketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm text-gray-500 font-mono">
                Room: <span className="font-bold text-primary-600">{currentGame.gameCode}</span>
              </div>
            </div>
          </div>

          {/* Main Game Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Panel - Game Info */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <GameInfo
                  game={currentGame}
                  currentUserId={user?.id}
                  connectionStatus={isSocketConnected ? 'connected' : 'disconnected'}
                />
                
                {/* Player Stats Box */}
                <div className="bg-white rounded-xl shadow-lg p-5 mt-6">
                  <h3 className="font-bold text-gray-800 mb-4">Game Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Turn:</span>
                      <span className="font-bold text-primary-700">
                        {currentGame.currentTurn === 'X' ? 
                          currentGame.players.X.username : 
                          currentGame.players.O.username}
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
                      <span className="font-bold text-gray-800">
                        {currentGame.board.filter(cell => cell !== null).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Game Board */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                {isConnecting ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary-600 rounded-full animate-spin border-t-transparent"></div>
                    </div>
                    <p className="mt-6 text-lg font-medium text-gray-700">Connecting to game...</p>
                    <p className="mt-2 text-gray-500 text-center max-w-md">
                      Please wait while we establish a secure connection with the game server
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Game Board */}
                    <div className="mb-8">
                      <GameBoard
                        board={currentGame.board}
                        onCellClick={handleCellClick}
                        disabled={currentGame.status !== 'active' || !!disconnectedPlayer}
                        winningLine={currentGame.winningLine || calculateWinningLine(currentGame.board)}
                        isLoading={isConnecting}
                      />
                    </div>
                    
                    {/* Game Status Messages */}
                    {currentGame.status === 'waiting' && (
                      <div className="mt-8 p-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                          <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-ping"></div>
                        </div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">
                          Waiting for Opponent
                        </h3>
                        <p className="text-blue-700 mb-4 max-w-md mx-auto">
                          Share the game code below with your friend to start playing
                        </p>
                        <div className="bg-white inline-block px-6 py-3 rounded-lg border border-blue-300">
                          <p className="text-sm text-blue-600 mb-1">Game Code</p>
                          <p className="text-3xl font-mono font-bold text-blue-800 tracking-wider">
                            {currentGame.gameCode}
                          </p>
                        </div>
                        <p className="text-blue-600 text-sm mt-4">
                          Or wait for a random player to join...
                        </p>
                      </div>
                    )}

                    {currentGame.status === 'finished' && (
                      <div className="mt-8 p-8 bg-linear-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200 text-center">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                          currentGame.winner === 'draw' ? 'bg-gray-100' : 'bg-primary-100'
                        }`}>
                          <span className={`text-3xl font-bold ${
                            currentGame.winner === 'draw' ? 'text-gray-700' : 'text-primary-700'
                          }`}>
                            {currentGame.winner === 'draw' ? '🤝' : '🏆'}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-primary-900 mb-2">
                          Game Over!
                        </h3>
                        <p className="text-primary-700 text-lg mb-6">
                          {currentGame.winner === 'draw'
                            ? "It's a draw! Well played both!"
                            : `🎉 ${currentGame.players[currentGame.winner!].username} wins!`}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button 
                            onClick={handlePlayAgain}
                            className="px-8 py-3 text-lg"
                          >
                            Play Again
                          </Button>
                          <Link to="/profile">
                            <Button 
                              variant="outline" 
                              className="px-8 py-3 text-lg border-primary-300 hover:bg-primary-50"
                            >
                              View Profile
                            </Button>
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

  // Show game lobby if no active game
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-linear-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">X O</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Play Tic Tac Toe
          </h1>
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