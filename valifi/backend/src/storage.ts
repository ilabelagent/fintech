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
  kycRecords
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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
    const admin = await this.getAdminUser(userId);
    return admin !== null;
  },
};
