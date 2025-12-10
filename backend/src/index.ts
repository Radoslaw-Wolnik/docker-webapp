import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import { redisService } from './services/redis.service';
import { SocketService } from './services/socket.service';
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import profileRoutes from './routes/profile.routes';
import { authenticate } from './middleware/auth.middleware';

// Load environment variables - try multiple paths
const envPath = process.env.NODE_ENV === 'production' 
  ? '.env'
  : path.join(__dirname, '../../.env'); // Go up from src to main directory

console.log(`Loading env from: ${envPath}`);
console.log(`Current directory: ${__dirname}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn(`Warning: Could not load .env from ${envPath}`);
  // Fall back to default .env loading
  dotenv.config();
}

// Debug: Log some env vars to verify they're loaded
console.log('Environment check:');
console.log(`- MONGO_URI: ${process.env.MONGO_URI ? 'Set (hidden)' : 'Not set'}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`- REDIS_URL: ${process.env.REDIS_URL ? 'Set (hidden)' : 'Not set'}`);


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Initialize services
let socketService: SocketService;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (avatars)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply authentication middleware globally
app.use(authenticate);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('=== Server Startup Debug ===');
    console.log(`MongoDB URI (first 50 chars): ${process.env.MONGO_URI?.substring(0, 50)}...`);
    console.log(`Redis URL (first 50 chars): ${process.env.REDIS_URL?.substring(0, 50)}...`);
    
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await redisService.connect();
    
    // Initialize Socket.io service
    socketService = new SocketService(io);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`📡 WebSocket server ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Starting graceful shutdown...');
  
  await redisService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Starting graceful shutdown...');
  
  await redisService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

export { app, server, io };