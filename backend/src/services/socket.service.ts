import { Server, Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { GameService } from './game.service';
import { redisService } from './redis.service';
import { SocketUser } from '../types';

export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, SocketUser> = new Map();
  
  constructor(io: Server) {
    this.io = io;
    this.setupSocket();
  }
  
  private setupSocket(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (token) {
          const decoded = AuthService.verifyToken(token);
          if (decoded) {
            socket.data.user = decoded;
          }
        }
        
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
    
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);
      
      const user = socket.data.user;
      if (user) {
        this.handleAuthenticatedConnection(socket, user);
      } else {
        this.handleAnonymousConnection(socket);
      }
      
      // Game events
      socket.on('join_game', (gameId: string) => {
        this.handleJoinGame(socket, gameId);
      });
      
      socket.on('make_move', async (data: { gameId: string; position: number }) => {
        await this.handleMakeMove(socket, data);
      });
      
      socket.on('leave_game', (gameId: string) => {
        this.handleLeaveGame(socket, gameId);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  private handleAuthenticatedConnection(socket: Socket, user: any): void {
    const socketUser: SocketUser = {
      socketId: socket.id,
      userId: user.userId,
      username: user.username
    };
    
    this.connectedUsers.set(socket.id, socketUser);
    
    // Track user as online
    redisService.setUserOnline(user.userId, socket.id);
    
    console.log(`Authenticated user connected: ${user.username} (${socket.id})`);
  }
  
  private handleAnonymousConnection(socket: Socket): void {
    const socketUser: SocketUser = {
      socketId: socket.id,
      userId: 'anonymous',
      username: 'Anonymous'
    };
    
    this.connectedUsers.set(socket.id, socketUser);
    
    console.log(`Anonymous user connected: ${socket.id}`);
  }
  
  private async handleJoinGame(socket: Socket, gameId: string): Promise<void> {
    try {
      const user = this.connectedUsers.get(socket.id);
      if (!user) return;
      
      // Join game room
      socket.join(`game:${gameId}`);
      
      // Update user's current game
      user.gameId = gameId;
      this.connectedUsers.set(socket.id, user);
      
      // Get current game state
      const gameState = await GameService.getGameState(gameId);
      
      // Send game state to user
      socket.emit('game_state', gameState);
      
      // Notify other players in the game
      socket.to(`game:${gameId}`).emit('player_joined', {
        playerId: user.userId,
        username: user.username
      });
      
      console.log(`User ${user.username} joined game ${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  }
  
  private async handleMakeMove(
    socket: Socket,
    data: { gameId: string; position: number }
  ): Promise<void> {
    try {
      const user = this.connectedUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      // Make the move
      const gameState = await GameService.makeMove(
        data.gameId,
        user.userId,
        data.position
      );
      
      // Broadcast updated game state to all players in the game
      this.io.to(`game:${data.gameId}`).emit('game_state', gameState);
      
      // If game ended, notify players
      if (gameState.status === 'finished') {
        this.io.to(`game:${data.gameId}`).emit('game_ended', {
          winner: gameState.winner
        });
      }
      
      console.log(`Move made by ${user.username} in game ${data.gameId}`);
    } catch (error: any) {
      console.error('Error making move:', error);
      socket.emit('error', { message: error.message });
    }
  }
  
  private handleLeaveGame(socket: Socket, gameId: string): void {
    const user = this.connectedUsers.get(socket.id);
    
    socket.leave(`game:${gameId}`);
    
    if (user) {
      user.gameId = undefined;
      this.connectedUsers.set(socket.id, user);
    }
    
    console.log(`User left game ${gameId}`);
  }
  
  private handleDisconnect(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    
    if (user) {
      // Remove from online users if authenticated
      if (user.userId !== 'anonymous') {
        redisService.setUserOffline(user.userId);
      }
      
      // Leave game room if in one
      if (user.gameId) {
        socket.leave(`game:${user.gameId}`);
        
        // Notify other players
        this.io.to(`game:${user.gameId}`).emit('player_left', {
          playerId: user.userId,
          username: user.username
        });
      }
      
      this.connectedUsers.delete(socket.id);
      
      console.log(`User disconnected: ${user.username} (${socket.id})`);
    } else {
      console.log(`Anonymous user disconnected: ${socket.id}`);
    }
  }
  
  // Helper method to send message to specific user
  sendToUser(userId: string, event: string, data: any): void {
    this.connectedUsers.forEach((user, socketId) => {
      if (user.userId === userId) {
        this.io.to(socketId).emit(event, data);
      }
    });
  }
  
  // Helper method to send message to game room
  sendToGame(gameId: string, event: string, data: any): void {
    this.io.to(`game:${gameId}`).emit(event, data);
  }
}