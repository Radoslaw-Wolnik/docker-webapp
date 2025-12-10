import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUserDocument> {
  createAnonymous(username: string): Promise<IUserDocument>;
}

const UserSchema = new Schema<IUserDocument, IUserModel>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: function(this: IUserDocument) { return !this.isAnonymous; },
    unique: true,
    lowercase: true,
    sparse: true
  },
  password: {
    type: String,
    required: function(this: IUserDocument) { return !this.isAnonymous; },
    minlength: 6
  },
  avatarUrl: {
    type: String,
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    totalGames: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isAnonymous) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Update win rate before saving
UserSchema.pre('save', function(next) {
  if (this.isModified('stats')) {
    const { wins, totalGames } = this.stats;
    this.stats.winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  }
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (this.isAnonymous) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method for anonymous user
UserSchema.statics.createAnonymous = async function(username: string): Promise<IUserDocument> {
  return this.create({
    username: `Guest_${username}`,
    isAnonymous: true
  });
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);