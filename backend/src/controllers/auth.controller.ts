import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { redisService } from '../services/redis.service';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      
      const result = await AuthService.register(username, email, password);
      
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
  
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const result = await AuthService.login(email, password);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (userId) {
        await redisService.setUserOffline(userId);
      }
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async createAnonymous(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.body;
      
      const result = await AuthService.createAnonymousUser(username);
      
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
  
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: req.user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}