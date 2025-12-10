import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = undefined;
      return next();
    }
    
    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      req.user = undefined;
      return next();
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    req.user = undefined;
    next();
  }
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }
  next();
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Authentication is optional
  next();
};