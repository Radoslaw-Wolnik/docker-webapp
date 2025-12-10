// src/stores/game.store.ts
import { create } from 'zustand';
import type { GameStoreState, GameState, GameHistory } from '../types';
import { gameApi, profileApi } from '../api/api';
import toast from 'react-hot-toast';

interface GameStore extends GameStoreState {
  setCurrentGame: (game: GameState | null) => void;
  createGame: (isPublic: boolean) => Promise<{ gameId: string; gameCode: string }>;
  joinGame: (gameCode: string) => Promise<GameState>;
  findGame: () => Promise<GameState>;
  makeMove: (gameId: string, position: number) => Promise<GameState>;
  loadGameHistory: (page?: number, limit?: number) => Promise<void>;
  updateGameState: (game: GameState) => void;
  resetGame: () => void;
  checkOpenGames: () => Promise<void>;
  getActiveGames: () => Promise<GameState[]>; // required by interface
}

export const useGameStore = create<GameStore>((set) => ({
  currentGame: null,
  openGames: 0,
  // annotate as GameHistory to actually use the imported type and avoid "declared but never used"
  gameHistory: {
    games: [],
    total: 0,
    page: 1,
    pages: 0,
  } as GameHistory,
  isLoading: false,

  setCurrentGame: (game) => set({ currentGame: game }),

  createGame: async (isPublic: boolean) => {
    set({ isLoading: true });
    try {
      const response = await gameApi.createGame(isPublic);
      if (response.success) {
        const { gameId, gameCode } = response.data!;
        toast.success(isPublic ? 'Public game created!' : `Game created! Code: ${gameCode}`);
        return { gameId, gameCode };
      }
      throw new Error('Failed to create game');
    } catch (error: any) {
      toast.error(error.error || 'Failed to create game');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  joinGame: async (gameCode: string) => {
    set({ isLoading: true });
    try {
      const response = await gameApi.joinGame(gameCode);
      if (response.success) {
        const game = response.data!;
        set({ currentGame: game });
        toast.success(`Joined game ${gameCode}`);
        return game;
      }
      throw new Error('Failed to join game');
    } catch (error: any) {
      toast.error(error.error || 'Failed to join game');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  findGame: async () => {
    set({ isLoading: true });
    try {
      const response = await gameApi.findGame();
      if (response.success) {
        const game = response.data!;
        set({ currentGame: game });
        toast.success(game.status === 'waiting' ? 'Waiting for opponent...' : 'Game found!');
        return game;
      }
      throw new Error('No game found');
    } catch (error: any) {
      toast.error(error.error || 'Failed to find game');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  makeMove: async (gameId: string, position: number) => {
    try {
      const response = await gameApi.makeMove(gameId, position);
      if (response.success) {
        const game = response.data!;
        set({ currentGame: game });
        return game;
      }
      throw new Error('Invalid move');
    } catch (error: any) {
      toast.error(error.error || 'Invalid move');
      throw error;
    }
  },

  // switched to profileApi.getGameHistory (that is where the API helper lives)
  loadGameHistory: async (page = 1, limit = 10) => {
    set({ isLoading: true });
    try {
      const response = await profileApi.getGameHistory(page, limit);
      if (response.success) {
        set({ gameHistory: response.data! });
      } else {
        throw new Error('Failed to load game history');
      }
    } catch (error: any) {
      toast.error(error.error || 'Failed to load game history');
    } finally {
      set({ isLoading: false });
    }
  },

  updateGameState: (game: GameState) => {
    set({ currentGame: game });
  },

  resetGame: () => {
    set({ currentGame: null });
  },

  checkOpenGames: async () => {
    try {
      const response = await gameApi.getOpenGamesCount();
      if (response.success) {
        set({ openGames: response.data!.count });
      }
    } catch (error) {
      console.error('Failed to check open games:', error);
    }
  },

  // Implemented getActiveGames to satisfy the GameStore interface
  getActiveGames: async () => {
    set({ isLoading: true });
    try {
      const response = await gameApi.getActiveGames();
      if (response.success) {
        return response.data!; // GameState[]
      }
      throw new Error('Failed to fetch active games');
    } catch (error) {
      console.error('Failed to get active games:', error);
      return []; // return empty array on failure (matches signature)
    } finally {
      set({ isLoading: false });
    }
  },
}));
