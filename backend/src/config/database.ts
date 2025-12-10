import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    // In Docker, use the environment variable from docker-compose
    // In local development, fall back to the default
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tic-tac-toe';
    
    console.log(`Attempting to connect to MongoDB at: ${mongoUri.replace(/:([^:]*):/, ':****:')}`); // Hide password in logs
    
    await mongoose.connect(mongoUri, {
      // Add these options for better connection handling
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};