import { Game } from '../models/Game';
import { User } from '../models/User';
import { createGameCode } from '../utils/generate-code';
import { getInitialBoard } from '../utils/board-encoder';
import { redisService } from './redis.service';
import { PlayerInfo, GameStateResponse } from '../types';

interface GetCountOpts {
  type?: 'active' | 'waiting';
  useCache?: boolean;
  cacheTtlSeconds?: number;
}

export class GameService {
  static async createGame(
    playerId: string,
    isPublic: boolean = false
  ): Promise<{ gameId: string; gameCode: string }> {
    const gameCode = createGameCode();
    
    const game = await Game.create({
      gameCode,
      playerX: playerId,
      playerO: null,
      board: getInitialBoard(),
      currentTurn: 'X',
      winner: null,
      status: 'waiting',
      isPublic,
      startedAt: null,
      finishedAt: null
    });
    
    // Cache the invitation if not public
    if (!isPublic) {
      await redisService.createInvitation(gameCode, playerId);
    }
    
    // Cache initial game state
    await this.cacheGameState(game);
    
    return {
      gameId: game._id.toString(),
      gameCode
    };
  }
  
  static async joinGame(
    gameCode: string,
    playerId: string
  ): Promise<GameStateResponse> {
    const game = await Game.findOne({ gameCode, status: 'waiting' });
    
    if (!game) {
      throw new Error('Game not found or already started');
    }
    
    // Check if player is trying to join their own game
    if (game.playerX === playerId) {
      throw new Error('Cannot join your own game');
    }
    
    // Set player O and start game
    game.playerO = playerId;
    game.status = 'active';
    game.startedAt = new Date();
    await game.save();
    
    // Delete invitation cache
    await redisService.deleteInvitation(gameCode);
    
    // Update cache
    await this.cacheGameState(game);
    
    return await this.getGameState(game._id.toString());
  }
  
  static async findPublicGame(playerId: string): Promise<GameStateResponse | null> {
    // Find waiting public game
    const game = await Game.findOne({
      isPublic: true,
      status: 'waiting',
      playerX: { $ne: playerId } // Don't join own game
    }).sort({ createdAt: 1 });
    
    if (!game) {
      return null;
    }
    
    // Join the game
    game.playerO = playerId;
    game.status = 'active';
    game.startedAt = new Date();
    await game.save();
    
    await this.cacheGameState(game);
    
    return await this.getGameState(game._id.toString());
  }
  
  static async makeMove(
    gameId: string,
    playerId: string,
    position: number
  ): Promise<GameStateResponse> {
    const game = await Game.findById(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Determine player symbol
    let symbol: 'X' | 'O';
    if (game.playerX === playerId) {
      symbol = 'X';
    } else if (game.playerO === playerId) {
      symbol = 'O';
    } else {
      throw new Error('Not a player in this game');
    }
    
    // Make the move
    await game.makeMove(position, playerId, symbol);
    
    // Update stats if game finished
    if (game.status === 'finished' && game.winner !== 'draw') {
      await this.updatePlayerStats(game, game.winner);
    }
    
    // Update cache
    await this.cacheGameState(game);
    
    return await this.getGameState(gameId);
  }
  
  static async getGameState(gameId: string): Promise<GameStateResponse> {
    // Try cache first
    const cached = await redisService.getCachedGameState(gameId);
    if (cached) {
      return cached;
    }
    
    const game = await Game.findById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    
    const [playerXInfo, playerOInfo] = await Promise.all([
      this.getPlayerInfo(game.playerX),
      game.playerO ? this.getPlayerInfo(game.playerO) : null
    ]);
    
    const gameState: GameStateResponse = {
      gameId: game._id.toString(),
      gameCode: game.gameCode,
      board: game.getDecodedBoard(),
      currentTurn: game.currentTurn,
      winner: game.winner,
      players: {
        X: playerXInfo,
        O: playerOInfo || {
          id: '',
          username: 'Waiting...',
          isAnonymous: false
        }
      },
      status: game.status,
      isPublic: game.isPublic
    };
    
    // Cache the state
    await this.cacheGameState(game);
    
    return gameState;
  }
  
  static async getPlayerInfo(userId: string): Promise<PlayerInfo> {
    if (userId === 'anonymous') {
      return {
        id: 'anonymous',
        username: 'Anonymous',
        isAnonymous: true
      };
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return {
        id: userId,
        username: 'Unknown',
        isAnonymous: true
      };
    }
    
    return {
      id: user._id.toString(),
      username: user.username,
      avatarUrl: user.avatarUrl,
      isAnonymous: user.isAnonymous
    };
  }
  
  private static async updatePlayerStats(
    game: any,
    winner: 'X' | 'O' | null
  ): Promise<void> {
    const updatePromises = [];
    
    if (game.playerX !== 'anonymous') {
      updatePromises.push(
        User.findByIdAndUpdate(game.playerX, {
          $inc: {
            'stats.totalGames': 1,
            'stats.wins': winner === 'X' ? 1 : 0,
            'stats.losses': winner === 'O' ? 1 : 0,
            'stats.draws': 0
          }
        })
      );
    }
    
    if (game.playerO && game.playerO !== 'anonymous') {
      updatePromises.push(
        User.findByIdAndUpdate(game.playerO, {
          $inc: {
            'stats.totalGames': 1,
            'stats.wins': winner === 'O' ? 1 : 0,
            'stats.losses': winner === 'X' ? 1 : 0,
            'stats.draws': 0
          }
        })
      );
    }
    
    await Promise.all(updatePromises);
  }
  
  private static async cacheGameState(game: any): Promise<void> {
    const gameState = await this.getGameState(game._id.toString());
    await redisService.cacheGameState(game._id.toString(), gameState);
  }
  
  static async getUserGames(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ games: any[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    
    const [games, total] = await Promise.all([
      Game.find({
        $or: [{ playerX: userId }, { playerO: userId }],
        status: 'finished'
      })
        .sort({ finishedAt: -1 })
        .skip(skip)
        .limit(limit),
      
      Game.countDocuments({
        $or: [{ playerX: userId }, { playerO: userId }],
        status: 'finished'
      })
    ]);
    
    return {
      games,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  static async getActivePublicCount(opts: GetCountOpts = {}): Promise<number> {
    const type = opts.type ?? 'active';
    const useCache = Boolean(opts.useCache);
    const ttl = opts.cacheTtlSeconds ?? 8; // short TTL to keep numbers fresh

    // cache key indicates whether we're counting active or waiting games
    const cacheKey = `public_games_count:${type}`;

    if (useCache) {
      try {
        const cached = await redisService.getCachedGameState(cacheKey);
        if (cached && typeof cached.count === 'number') {
          return cached.count;
        }
      } catch (e) {
        // swallow cache read errors
        console.warn('Redis read error for active games count', e);
      }
    }

    // Choose status filter
    const status = type === 'waiting' ? 'waiting' : 'active';

    const filter = {
      isPublic: true,
      status
    };

    // Count in MongoDB
    const count = await Game.countDocuments(filter);

    if (useCache) {
      try {
        // store simple object to reuse redis methods
        await redisService.cacheGameState(cacheKey, { count }, ttl);
      } catch (e) {
        console.warn('Redis write error for active games count', e);
      }
    }

    return count;
  }
  
}