import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisService {
  private client: ReturnType<typeof createClient>;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      console.log('✅ Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('Redis client disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Game state caching
  async cacheGameState(gameId: string, state: any, ttl = 3600): Promise<void> {
    try {
      await this.client.setEx(`game:${gameId}`, ttl, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to cache game state:', error);
    }
  }

  async getCachedGameState(gameId: string): Promise<any> {
    try {
      const data = await this.client.get(`game:${gameId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get cached game state:', error);
      return null;
    }
  }

  async deleteGameCache(gameId: string): Promise<void> {
    try {
      await this.client.del(`game:${gameId}`);
    } catch (error) {
      console.error('Failed to delete game cache:', error);
    }
  }

  // Online users tracking
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    try {
      await this.client.hSet('online_users', userId, socketId);
    } catch (error) {
      console.error('Failed to set user online:', error);
    }
  }

  async setUserOffline(userId: string): Promise<void> {
    try {
      await this.client.hDel('online_users', userId);
    } catch (error) {
      console.error('Failed to set user offline:', error);
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const result = await this.client.hExists('online_users', userId);
      return result;
    } catch (error) {
      console.error('Failed to check user online status:', error);
      return false;
    }
  }

  // Game invitations
  async createInvitation(gameCode: string, inviterId: string, ttl = 300): Promise<void> {
    try {
      await this.client.setEx(`invite:${gameCode}`, ttl, inviterId);
    } catch (error) {
      console.error('Failed to create invitation:', error);
    }
  }

  async getInvitation(gameCode: string): Promise<string | null> {
    try {
      return await this.client.get(`invite:${gameCode}`);
    } catch (error) {
      console.error('Failed to get invitation:', error);
      return null;
    }
  }

  async deleteInvitation(gameCode: string): Promise<void> {
    try {
      await this.client.del(`invite:${gameCode}`);
    } catch (error) {
      console.error('Failed to delete invitation:', error);
    }
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowInSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const windowStart = now - (windowInSeconds * 1000);
    
    try {
      // Remove old entries
      await this.client.zRemRangeByScore(key, 0, windowStart);
      
      // Count requests in window
      const requestCount = await this.client.zCard(key);
      
      if (requestCount >= limit) {
        return {
          allowed: false,
          remaining: 0,
          reset: windowInSeconds
        };
      }
      
      // Add new request
      await this.client.zAdd(key, { score: now, value: now.toString() });
      await this.client.expire(key, windowInSeconds);
      
      return {
        allowed: true,
        remaining: limit - requestCount - 1,
        reset: windowInSeconds
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return {
        allowed: true,
        remaining: limit,
        reset: windowInSeconds
      };
    }
  }
}

export const redisService = new RedisService();