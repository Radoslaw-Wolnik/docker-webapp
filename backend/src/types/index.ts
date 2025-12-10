import { Types } from "mongoose";
import { JwtPayload } from 'jsonwebtoken';

export interface JWTPayload extends JwtPayload {
  userId: string;
  isAnonymous: boolean;
  username: string;
}

export interface IUser {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    winRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}


export interface IGame {
  gameCode: string;
  playerX: string; // User ID or 'anonymous'
  playerO: string; // User ID or 'anonymous'
  board: number[]; // Binary encoded: [0, 0, 0] for 3 bytes = 9 cells
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  moves: GameMove[];
  status: 'waiting' | 'active' | 'finished';
  isPublic: boolean;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  lastActivityAt: Date;
}

export interface GameMove {
  player: string; // User ID or 'anonymous'
  position: number; // 0-8
  symbol: 'X' | 'O';
  timestamp: Date;
}


export interface SocketUser {
  socketId: string;
  userId: string;
  username: string;
  gameId?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface GameStateResponse {
  gameId: Types.ObjectId;
  gameCode: string;
  board: ('X' | 'O' | null)[];
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  players: {
    X: PlayerInfo;
    O: PlayerInfo;
  };
  status: 'waiting' | 'active' | 'finished';
  isPublic: boolean;
}

export interface PlayerInfo {
  id: string;
  username: string;
  avatarUrl?: string;
  isAnonymous: boolean;
}

// WebSocket Event Types
export type SocketEvent = 
  | { type: 'game_created'; gameId: string; gameCode: string }
  | { type: 'player_joined'; gameId: string; player: PlayerInfo }
  | { type: 'move_made'; gameId: string; position: number; player: string; board: ('X' | 'O' | null)[] }
  | { type: 'game_state'; game: GameStateResponse }
  | { type: 'game_ended'; gameId: string; winner: 'X' | 'O' | 'draw' | null }
  | { type: 'error'; message: string };