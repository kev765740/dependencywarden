import mongoose from 'mongoose';
import { Repository } from '../types';

export interface Repository {
  id: string;
  userId: string;
  url: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  slackChannel?: string;
  emailNotifications?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create mongoose model
const repoSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  url: { type: String, required: true },
  owner: { type: String, required: true },
  name: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  slackChannel: { type: String },
  emailNotifications: { type: Boolean, default: false }
}, {
  timestamps: true,
  versionKey: false
});

// Add index for case-insensitive URL uniqueness per user
repoSchema.index({ userId: 1, url: 1 }, { unique: true });

// Mock database for testing
const mockDb = new Map<string, Repository>();

export const RepoModel = {
  async find(query: { userId: string }): Promise<Repository[]> {
    return Array.from(mockDb.values())
      .filter(repo => repo.userId === query.userId);
  },

  async findOne(query: { _id?: string; url?: string | { $regex: string }; userId?: string }): Promise<Repository | null> {
    if (query._id) {
      return mockDb.get(query._id) || null;
    }
    if (query.url) {
      const urlRegex = new RegExp(typeof query.url === 'string' ? query.url : query.url.$regex, 'i');
      return Array.from(mockDb.values())
        .find(repo => repo.userId === query.userId && urlRegex.test(repo.url)) || null;
    }
    return null;
  },

  async create(data: Partial<Repository>): Promise<Repository> {
    // Check for case-insensitive duplicate
    const existingRepo = await this.findOne({
      userId: data.userId,
      url: { $regex: `^${data.url}$` }
    });

    if (existingRepo) {
      const error = new Error('Repository already exists');
      error.name = 'DuplicateError';
      throw error;
    }

    const repo: Repository = {
      id: `repo-${mockDb.size + 1}`,
      owner: data.owner || '',
      name: data.name || '',
      url: data.url || '',
      userId: data.userId || '',
      isPrivate: data.isPrivate || false,
      slackChannel: data.slackChannel || null,
      emailNotifications: data.emailNotifications || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockDb.set(repo.id, repo);
    return repo;
  },

  async findByIdAndUpdate(id: string, update: { $set: Partial<Repository> }): Promise<Repository | null> {
    const repo = mockDb.get(id);
    if (!repo) return null;

    const updatedRepo = {
      ...repo,
      ...update.$set,
      updatedAt: new Date()
    };

    mockDb.set(id, updatedRepo);
    return updatedRepo;
  },

  async findByIdAndDelete(id: string): Promise<Repository | null> {
    const repo = mockDb.get(id);
    if (!repo) return null;

    mockDb.delete(id);
    return repo;
  },

  // For testing purposes
  _reset() {
    mockDb.clear();
  }
};

// Export the appropriate model based on environment
export const RepoModelMongoose = process.env.NODE_ENV === 'test'
  ? RepoModel
  : mongoose.model<Repository>('Repository', repoSchema); 