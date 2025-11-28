// Minimal Valifi Storage Layer - Auth methods for QA testing
import { db } from './db';
import {
  users,
  wallets,
  tradingBots,
  botLearningSession,
  adminAuditLogs,
  userDashboardConfigs,
  userWidgetPreferences,
  adminUsers,
} from '@shared/schema';
import { eq, count } from 'drizzle-orm';

export const storage = {
  // User methods
  async getUsers(limit: number, offset: number) {
    const userList = await db.select().from(users).limit(limit).offset(offset);
    const totalUsers = await db.select({ count: count() }).from(users);
    return { users: userList, total: totalUsers[0].count };
  },

  async getUser(userId: string) {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] || null;
  },

  async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  },

  async createUser(user: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    profileImageUrl?: string;
    isAdmin?: boolean;
  }) {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  },

  async updateUser(userId: string, data: { isAdmin: boolean }) {
    const result = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return result[0];
  },

  async upsertUser(user: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    profileImageUrl?: string;
    isAdmin?: boolean;
  }) {
    // For auth, just create the user
    return this.createUser(user);
  },

  // Wallet methods
  async getUserWallets(userId: string) {
    return await db.select().from(wallets).where(eq(wallets.userId, userId));
  },

  // Admin methods
  async getAdminUser(userId: string) {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.userId, userId)).limit(1);
    return result[0] || null;
  },

  async getAdminAnalytics() {
    // Mock data
    return {
      totalUsers: 1,
      activeBots: 0,
      totalLearningSessions: 0,
      avgWinRate: 0,
    };
  },

  async getBots(limit: number, offset: number) {
    // Mock data
    return { bots: [], total: 0 };
  },

  async getBotTrainingData(botId: string) {
    // Mock data
    return { skills: [], sessions: [] };
  },

  async getAuditLogs(limit: number) {
    // Mock data
    return [];
  },

  async trainBot(botId: string, sessionType: string, trainingDataset: string) {
    // Mock data
    return { success: true };
  },

  async sendBroadcast(data: { message: string; targetUserIds?: string[] }) {
    // Mock data
    return { success: true, messageId: 'broadcast-id' };
  },

  async mintEtherealElement(data: { name: string; rarity: string; metadata: Record<string, unknown> }) {
    // Mock data
    return { ...data, id: 'new-element-id', createdAt: new Date() };
  },

  // Dashboard methods
  async getDashboardConfig(userId: string) {
    // Mock data - in production, query userDashboardConfigs table
    return { layout: [], userId };
  },

  async getDashboardPreferences(userId: string) {
    // Mock data - in production, query userWidgetPreferences table
    return [] as Array<{ widgetId: string; settings: Record<string, unknown> }>;
  },

  async saveDashboardConfig(userId: string, config: { layout: unknown[] }) {
    // Mock data - in production, upsert to userDashboardConfigs
    return { ...config, userId };
  },

  async saveDashboardPreference(userId: string, pref: { widgetId: string; settings: Record<string, unknown> }) {
    // Mock data - in production, upsert to userWidgetPreferences
    return { ...pref, userId };
  },

  async deleteDashboardPreference(userId: string, widgetId: string) {
    // Mock data
    return { success: true };
  },
};
