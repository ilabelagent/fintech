// Valifi Fintech Platform - Storage Layer
import { db } from "./db";
import { 
  users, 
  assets, 
  transactions, 
  p2pOffers, 
  p2pOrders, 
  loanApplications,
  valifiCards,
  bankAccounts,
  exchangeOrders,
  adminUsers,
  kycRecords,
  activityLogs,
  adminPermissions
} from "@shared/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

export const storage = {
  // ============================================
  // USER METHODS
  // ============================================
  
  async getUser(userId: string) {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] || null;
  },

  async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  },

  async getUserByUsername(username: string) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  },

  async createUser(user: {
    email: string;
    fullName: string;
    username: string;
    passwordHash: string;
    profilePhotoUrl?: string;
  }) {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  },

  async updateUser(userId: string, updates: Partial<typeof users.$inferInsert>) {
    const result = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    return result[0];
  },

  // ============================================
  // ASSET METHODS
  // ============================================
  
  async getUserAssets(userId: string) {
    return await db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
  },

  async getAsset(assetId: string) {
    const result = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
    return result[0] || null;
  },

  async createAsset(asset: typeof assets.$inferInsert) {
    const result = await db.insert(assets).values(asset).returning();
    return result[0];
  },

  async updateAsset(assetId: string, updates: Partial<typeof assets.$inferInsert>) {
    const result = await db.update(assets).set(updates).where(eq(assets.id, assetId)).returning();
    return result[0];
  },

  // ============================================
  // TRANSACTION METHODS
  // ============================================
  
  async getUserTransactions(userId: string) {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));
  },

  async createTransaction(transaction: typeof transactions.$inferInsert) {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  },

  // ============================================
  // P2P METHODS
  // ============================================
  
  async getP2POffers() {
    return await db.select().from(p2pOffers).where(eq(p2pOffers.isActive, true)).orderBy(desc(p2pOffers.createdAt));
  },

  async getUserP2POffers(userId: string) {
    return await db.select().from(p2pOffers).where(eq(p2pOffers.userId, userId)).orderBy(desc(p2pOffers.createdAt));
  },

  async createP2POffer(offer: typeof p2pOffers.$inferInsert) {
    const result = await db.insert(p2pOffers).values(offer).returning();
    return result[0];
  },

  async getUserP2POrders(userId: string) {
    return await db.select().from(p2pOrders)
      .where(
        and(
          eq(p2pOrders.buyerId, userId)
        )
      )
      .orderBy(desc(p2pOrders.createdAt));
  },

  async createP2POrder(order: typeof p2pOrders.$inferInsert) {
    const result = await db.insert(p2pOrders).values(order).returning();
    return result[0];
  },

  // ============================================
  // LOAN METHODS
  // ============================================
  
  async getUserLoans(userId: string) {
    return await db.select().from(loanApplications).where(eq(loanApplications.userId, userId)).orderBy(desc(loanApplications.createdAt));
  },

  async createLoan(loan: typeof loanApplications.$inferInsert) {
    const result = await db.insert(loanApplications).values(loan).returning();
    return result[0];
  },

  // ============================================
  // CARD METHODS
  // ============================================
  
  async getUserCard(userId: string) {
    const result = await db.select().from(valifiCards).where(eq(valifiCards.userId, userId)).limit(1);
    return result[0] || null;
  },

  async createCard(card: typeof valifiCards.$inferInsert) {
    const result = await db.insert(valifiCards).values(card).returning();
    return result[0];
  },

  // ============================================
  // BANK ACCOUNT METHODS
  // ============================================
  
  async getUserBankAccounts(userId: string) {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  },

  async createBankAccount(account: typeof bankAccounts.$inferInsert) {
    const result = await db.insert(bankAccounts).values(account).returning();
    return result[0];
  },

  // ============================================
  // EXCHANGE METHODS
  // ============================================
  
  async getUserExchangeOrders(userId: string) {
    return await db.select().from(exchangeOrders).where(eq(exchangeOrders.userId, userId)).orderBy(desc(exchangeOrders.createdAt));
  },

  async createExchangeOrder(order: typeof exchangeOrders.$inferInsert) {
    const result = await db.insert(exchangeOrders).values(order).returning();
    return result[0];
  },

  // ============================================
  // KYC METHODS
  // ============================================
  
  async getUserKYC(userId: string) {
    const result = await db.select().from(kycRecords).where(eq(kycRecords.userId, userId)).limit(1);
    return result[0] || null;
  },

  async createKYCRecord(kyc: typeof kycRecords.$inferInsert) {
    const result = await db.insert(kycRecords).values(kyc).returning();
    return result[0];
  },

  // ============================================
  // ADMIN METHODS
  // ============================================
  
  async getAdminUser(userId: string) {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.userId, userId)).limit(1);
    return result[0] || null;
  },

  async isUserAdmin(userId: string) {
    const user = await this.getUser(userId);
    return user?.role === 'admin' || user?.role === 'superadmin';
  },

  async getAllUsers(limit: number = 50, offset: number = 0) {
    const allUsers = await db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
    const totalCount = await db.select({ count: count() }).from(users);
    return { users: allUsers, total: totalCount[0]?.count || 0 };
  },

  async updateUserRole(userId: string, role: 'user' | 'admin' | 'superadmin') {
    const result = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
    return result[0];
  },

  async updateUserKYCStatus(userId: string, kycStatus: string, rejectionReason?: string) {
    const updates: any = { kycStatus };
    if (rejectionReason) {
      updates.kycRejectionReason = rejectionReason;
    }
    const result = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    return result[0];
  },

  async deleteUser(userId: string) {
    await db.delete(users).where(eq(users.id, userId));
    return true;
  },

  async logActivity(activity: typeof activityLogs.$inferInsert) {
    const result = await db.insert(activityLogs).values(activity).returning();
    return result[0];
  },

  async getActivityLogs(limit: number = 50, offset: number = 0) {
    return await db.select().from(activityLogs).limit(limit).offset(offset).orderBy(desc(activityLogs.createdAt));
  },

  async getUserActivityLogs(userId: string, limit: number = 20) {
    return await db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).limit(limit).orderBy(desc(activityLogs.createdAt));
  },

  async getAdminPermissions(userId: string) {
    const result = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, userId)).limit(1);
    return result[0] || null;
  },

  async createAdminPermissions(permissions: typeof adminPermissions.$inferInsert) {
    const result = await db.insert(adminPermissions).values(permissions).returning();
    return result[0];
  },

  async updateAdminPermissions(userId: string, updates: Partial<typeof adminPermissions.$inferInsert>) {
    const result = await db.update(adminPermissions).set(updates).where(eq(adminPermissions.userId, userId)).returning();
    return result[0];
  },
};
