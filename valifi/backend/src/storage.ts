// Minimal Valifi Storage Layer - Auth methods for QA testing
import { db } from "./db";
import { users, wallets } from "@shared/schema";
import { eq } from "drizzle-orm";

export const storage = {
  // User methods
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
};
