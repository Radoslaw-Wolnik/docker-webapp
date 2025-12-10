// src/hooks/useGameSocketHandlers.ts
import { useEffect } from 'react';
import { socketService } from '../api/socket';
import toast from 'react-hot-toast';
import type { GameState } from '../types';

interface UseGameSocketHandlersParams {
  gameId?: string;
  onGameState: (game: GameState) => void;
  onMove?: (data: any) => void;
  onGameEnded?: (game: GameState) => void;
}

export const useGameSocketHandlers = ({
  gameId,
  onGameState,
  onMove,
  onGameEnded,
}: UseGameSocketHandlersParams) => {
  useEffect(() => {
    const handleGameState = (game: GameState) => onGameState(game);
    const handleError = (data: { message: string }) => toast.error(data.message || 'Socket error');
    const handleMove = (data: any) => onMove?.(data);
    const handleGameEnded = (game: GameState) => onGameEnded?.(game);

    socketService.on('game_state', handleGameState);
    socketService.on('error', handleError);
    socketService.on('move_made', handleMove);
    socketService.on('game_ended', handleGameEnded);

    if (gameId && socketService.isConnected()) {
      socketService.joinGame(gameId);
    }

    return () => {
      socketService.off('game_state', handleGameState);
      socketService.off('error', handleError);
      socketService.off('move_made', handleMove);
      socketService.off('game_ended', handleGameEnded);

      if (gameId) {
        socketService.leaveGame(gameId);
      }
    };
    // We intentionally do NOT include onGameState/onMove/onGameEnded in deps
    // to avoid re-registering listeners repeatedly. They can be stable (wrap with useCallback)
  }, [gameId]);
};
