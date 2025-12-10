import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { JWTPayload } from '../types';
import dotenv from 'dotenv';

dotenv.config();

export class AuthService {
  static async register(
    username: string,
    email: string,
    password: string
  ): Promise<{ user: any; token: string }> {
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create user
    const user = await User.create({
      username,
      email,
      password,
      isAnonymous: false
    });
    
    // Generate token
    const token = this.generateToken({
      userId: user._id.toString(),
      username: user.username,
      isAnonymous: false
    });
    
    return {
      user: this.sanitizeUser(user),
      token
    };
  }
  
  static async login(
    email: string,
    password: string
  ): Promise<{ user: any; token: string }> {
    const user = await User.findOne({ email, isAnonymous: false });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    const token = this.generateToken({
      userId: user._id.toString(),
      username: user.username,
      isAnonymous: false
    });
    
    return {
      user: this.sanitizeUser(user),
      token
    };
  }
  
  static async createAnonymousUser(username: string): Promise<{ user: any; token: string }> {
    // Create anonymous user
    const user = await User.createAnonymous(username);
    
    const token = this.generateToken({
      userId: user._id.toString(),
      username: user.username,
      isAnonymous: true
    });
    
    return {
      user: this.sanitizeUser(user),
      token
    };
  }
  
  static generateToken(payload: object): string {
    const secret: Secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    // Type assertion for expiresIn
    const options: SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, secret, options);
  }
  
  static verifyToken(token: string): JWTPayload | null {
    try {
      const secret: Secret = process.env.JWT_SECRET!;
      
      if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      
      const decoded = jwt.verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }
  
  static sanitizeUser(user: any): any {
    const userObj = user.toObject ? user.toObject() : user;
    const { password, ...userWithoutPassword } = userObj;
    return userWithoutPassword;
  }
}