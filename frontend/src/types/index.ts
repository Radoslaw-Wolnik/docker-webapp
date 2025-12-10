// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    winRate: number;
  };
  createdAt: string;
}

export interface GameState {
  gameId: string;
  gameCode: string;
  board: ('X' | 'O' | null)[];
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine?: number[]; // Add this
  players: {
    X: PlayerInfo;
    O: PlayerInfo;
  };
  status: 'waiting' | 'active' | 'finished' | 'abandoned'; // Add abandoned status
  isPublic: boolean;
  createdAt: string;
  finishedAt?: string;
  disconnectedPlayers?: string[]; // Track disconnected players
}

export interface PlayerInfo {
  id: string;
  username: string;
  avatarUrl?: string;
  isAnonymous: boolean;
}

export interface GameHistory {
  games: GameState[];
  total: number;
  page: number;
  pages: number;
}

// WebSocket Events
export type SocketEvent = 
  | { type: 'game_created'; gameId: string; gameCode: string }
  | { type: 'player_joined'; gameId: string; player: PlayerInfo }
  | { type: 'move_made'; gameId: string; position: number; player: string; board: ('X' | 'O' | null)[] }
  | { type: 'game_state'; game: GameState }
  | { type: 'game_ended'; gameId: string; winner: 'X' | 'O' | 'draw' | null }
  | { type: 'error'; message: string };

// Component Props
export interface GameCellProps {
  value: 'X' | 'O' | null;
  position: number;
  onClick: (position: number) => void;
  isWinning?: boolean;
  disabled?: boolean;
}

// Update GameBoardProps
export interface GameBoardProps {
  board: ('X' | 'O' | null)[];
  onCellClick: (position: number) => void;
  winningLine?: number[];
  disabled?: boolean;
  isLoading?: boolean; // Add loading state
}

// Store Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface GameStoreState {
  currentGame: GameState | null;
  openGames: number;
  gameHistory: GameHistory;
  isLoading: boolean;
}