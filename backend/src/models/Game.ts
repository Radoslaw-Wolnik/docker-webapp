import mongoose, { Schema, Document, Types } from 'mongoose';
import { IGame, GameMove } from '../types';
import { encodeBoard, decodeBoard, checkWinner } from '../utils/board-encoder';

export interface IGameDocument extends IGame, Document {
  makeMove(position: number, playerId: string, symbol: 'X' | 'O'): Promise<void>;
  getDecodedBoard(): ('X' | 'O' | null)[];
}

const GameSchema = new Schema<IGameDocument>({
  gameCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  playerX: {
    type: String,
    required: true
  },
  playerO: {
    type: String,
    default: null
  },
  board: {
    type: [Number],
    default: [0, 0, 0] // 3 bytes for 9 cells
  },
  currentTurn: {
    type: String,
    enum: ['X', 'O'],
    default: 'X'
  },
  winner: {
    type: String,
    enum: ['X', 'O', 'draw', null],
    default: null
  },
  moves: [{
    player: String,
    position: { type: Number, min: 0, max: 8 },
    symbol: { type: String, enum: ['X', 'O'] },
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: null
  },
  finishedAt: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
GameSchema.index({ gameCode: 1 });
GameSchema.index({ status: 1, isPublic: 1, createdAt: -1 });
GameSchema.index({ playerX: 1, playerO: 1 });
GameSchema.index({ lastActivityAt: 1 });

// Instance methods
GameSchema.methods.getDecodedBoard = function(): ('X' | 'O' | null)[] {
  return decodeBoard(this.board);
};

GameSchema.methods.makeMove = async function(
  position: number, 
  playerId: string, 
  symbol: 'X' | 'O'
): Promise<void> {
  if (this.status !== 'active') {
    throw new Error('Game is not active');
  }
  
  if (this.currentTurn !== symbol) {
    throw new Error('Not your turn');
  }
  
  if (position < 0 || position > 8) {
    throw new Error('Invalid position');
  }
  
  const board = this.getDecodedBoard();
  if (board[position] !== null) {
    throw new Error('Position already taken');
  }
  
  // Update board
  board[position] = symbol;
  this.board = encodeBoard(board);
  
  // Record move
  this.moves.push({
    player: playerId,
    position,
    symbol,
    timestamp: new Date()
  });
  
  // Check for winner
  const winner = checkWinner(board);
  if (winner) {
    this.winner = winner;
    this.status = 'finished';
    this.finishedAt = new Date();
  } else if (board.every((cell: 'X' | 'O' | null) => cell !== null)) {
    // Fixed: Added type annotation for cell parameter
    this.winner = 'draw';
    this.status = 'finished';
    this.finishedAt = new Date();
  } else {
    this.currentTurn = symbol === 'X' ? 'O' : 'X';
  }
  
  this.lastActivityAt = new Date();
  await this.save();
};

export const Game = mongoose.model<IGameDocument>('Game', GameSchema);