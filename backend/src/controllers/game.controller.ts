import { Request, Response } from 'express';
import { GameService } from '../services/game.service';
import { redisService } from '../services/redis.service';

export class GameController {
  static async createGame(req: Request, res: Response): Promise<void> {
    try {
      const playerId = req.user?.userId || 'anonymous';
      const { isPublic = false } = req.body;
      
      const result = await GameService.createGame(playerId, isPublic);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async joinGame(req: Request, res: Response): Promise<void> {
    try {
      const { gameCode } = req.body;
      const playerId = req.user?.userId || 'anonymous';
      
      const gameState = await GameService.joinGame(gameCode, playerId);
      
      res.json({
        success: true,
        data: gameState
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async findGame(req: Request, res: Response): Promise<void> {
    try {
      const playerId = req.user?.userId || 'anonymous';
      
      const gameState = await GameService.findPublicGame(playerId);
      
      if (!gameState) {
        // Create new public game if none found
        const newGame = await GameService.createGame(playerId, true);
        
        res.json({
          success: true,
          data: {
            ...newGame,
            message: 'Created new public game'
          }
        });
        return;
      }
      
      res.json({
        success: true,
        data: gameState
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async makeMove(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const { position } = req.body;
      const playerId = req.user?.userId || 'anonymous';
      
      const gameState = await GameService.makeMove(gameId, playerId, position);
      
      res.json({
        success: true,
        data: gameState
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async getGameState(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      
      const gameState = await GameService.getGameState(gameId);
      
      res.json({
        success: true,
        data: gameState
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async getActiveGames(req: Request, res: Response): Promise<void> {
    try {
      const playerId = req.user?.userId;
      
      if (!playerId) {
        res.json({
          success: true,
          data: []
        });
        return;
      }
      
      // This would query for active games
      // Implement based on your needs
      
      res.json({
        success: true,
        data: []
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}