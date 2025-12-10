// src/api/socket.ts
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types';
import { WS_BASE_URL } from './api';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private isManuallyDisconnected = false;

  connect(token?: string): void {
    if (this.socket?.connected || this.isManuallyDisconnected) return;

    this.isManuallyDisconnected = false;
    
    this.socket = io(WS_BASE_URL, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.emit('socket:connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.emit('socket:disconnected', { reason });
      
      if (reason === 'io server disconnect') {
        this.reconnectTimeout = window.setTimeout(() => {
          this.socket?.connect();
        }, 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.emit('socket:error', { message: error.message });
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.emit('socket:reconnecting', { attempt });
    });

    this.socket.on('reconnect_failed', () => {
      this.emit('socket:reconnect_failed');
    });

    // Core: full authoritative game state
    this.socket.on('game_state', (game: GameState) => {
      this.emit('game_state', game);
    });

    // If server emits game_ended with full GameState
    this.socket.on('game_ended', (game: GameState) => {
      this.emit('game_ended', game);
    });

    // Player connection lifecycle events with consistent shape:
    this.socket.on('player_joined', (data: { playerId: string; username: string }) => {
      this.emit('player_joined', data);
    });

    this.socket.on('player_disconnected', (data: { playerId: string; username: string; timeout?: number }) => {
      this.emit('player_disconnected', data);
    });

    this.socket.on('player_reconnected', (data: { playerId: string; username: string }) => {
      this.emit('player_reconnected', data);
    });

    this.socket.on('error', (data: { message: string }) => {
      this.emit('error', data);
    });
  }

  // Emit events to server
  joinGame(gameId: string): void {
    this.socket?.emit('join_game', gameId);
  }

  makeMove(gameId: string, position: number): void {
    this.socket?.emit('make_move', { gameId, position });
  }

  leaveGame(gameId: string): void {
    this.socket?.emit('leave_game', gameId);
  }

  reconnect(): void {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  // Listen to events from server
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      window.setTimeout(() => {
        callbacks.forEach(callback => callback(data));
      }, 0);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

export const socketService = new SocketService();
