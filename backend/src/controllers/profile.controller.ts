import { Request, Response } from 'express';
import { User } from '../models/User';
import { GameService } from '../services/game.service';

export class ProfileController {
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { username, email } = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      if (username) user.username = username;
      if (email) user.email = email;
      
      await user.save();
      
      res.json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          stats: user.stats
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async updateAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
        return;
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Construct avatar URL
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      user.avatarUrl = avatarUrl;
      
      await user.save();
      
      res.json({
        success: true,
        data: { avatarUrl }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  static async getGameHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      const result = await GameService.getUserGames(userId, page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}