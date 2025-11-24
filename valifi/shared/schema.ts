import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal, pgEnum, inet } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// ENUMS (Based on data-models.md)
// ============================================

export const kycStatusEnum = pgEnum("kyc_status", [
  "Not Started", 
  "Pending", 
  "Approved", 
  "Rejected", 
  "Resubmit Required"
]);

export const assetTypeEnum = pgEnum("asset_type", [
  "Crypto", 
  "PreciousMetal",
  "Fiat" // For cash balances only
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "Active", 
  "Pending", 
  "Matured", 
  "Withdrawable", 
  "Withdrawn",
  "Collateralized"
]);

export const payoutDestinationEnum = pgEnum("payout_destination", [
  "wallet", 
  "balance"
]);

// Investment action enum removed - actions tracked in transaction types

export const transactionTypeEnum = pgEnum("transaction_type", [
  "Deposit", 
  "Withdrawal", 
  "Trade", 
  "P2P", 
  "Loan Repayment",
  "Exchange",
  "Transfer"
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "Completed", 
  "Pending", 
  "Failed"
]);

export const p2pOfferTypeEnum = pgEnum("p2p_offer_type", [
  "BUY", 
  "SELL"
]);

export const p2pOrderStatusEnum = pgEnum("p2p_order_status", [
  "Pending Payment", 
  "Payment Sent", 
  "Completed", 
  "Disputed",
  "Auto-Cancelled",
  "Cancelled"
]);

export const otcTaskStatusEnum = pgEnum("otc_task_status", [
  "Open",
  "In Progress",
  "Completed",
  "Cancelled"
]);

export const otcOrderStatusEnum = pgEnum("otc_order_status", [
  "Claimed",
  "Pending Proof",
  "Under Review",
  "Approved",
  "Rejected",
  "Paid"
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "Pending", 
  "Approved", 
  "Active",
  "Repaid", 
  "Late",
  "Defaulted",
  "Rejected"
]);

export const cardStatusEnum = pgEnum("card_status", [
  "Not Applied", 
  "Pending Approval", 
  "Approved",
  "Frozen",
  "Cancelled"
]);

export const cardTypeEnum = pgEnum("card_type", [
  "Virtual", 
  "Physical"
]);

export const bankAccountStatusEnum = pgEnum("bank_account_status", [
  "Pending", 
  "Verified", 
  "Rejected"
]);

export const twoFactorMethodEnum = pgEnum("two_factor_method", [
  "none", 
  "email", 
  "sms", 
  "authenticator"
]);

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "superadmin"
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "login",
  "logout",
  "kyc_submitted",
  "kyc_approved",
  "kyc_rejected",
  "user_created",
  "user_updated",
  "user_deleted",
  "role_changed",
  "transaction_created",
  "asset_purchased",
  "loan_applied",
  "card_applied",
  "settings_updated"
]);

// ============================================
// 1. CORE MODELS
// ============================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  profilePhotoUrl: text("profile_photo_url"),
  role: userRoleEnum("role").default("user"),
  kycStatus: kycStatusEnum("kyc_status").default("Not Started"),
  kycRejectionReason: text("kyc_rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique().notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorMethod: twoFactorMethodEnum("two_factor_method").default("none"),
  twoFactorSecret: text("two_factor_secret"), // Encrypted
  loginAlerts: boolean("login_alerts").default(true),
  preferences: jsonb("preferences"), // { currency, language, theme }
  privacy: jsonb("privacy"), // { marketingConsents }
  vaultRecovery: jsonb("vault_recovery"), // Encrypted recovery details
});

export const activeSessions = pgTable("active_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  device: varchar("device", { length: 255 }),
  location: varchar("location", { length: 255 }),
  ipAddress: inet("ip_address"),
  lastActive: timestamp("last_active", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  actorId: varchar("actor_id").references(() => users.id), // Admin who performed the action
  activityType: activityTypeEnum("activity_type").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional context (e.g., { targetUserId, oldValue, newValue })
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const adminPermissions = pgTable("admin_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  canManageUsers: boolean("can_manage_users").default(true),
  canApproveKYC: boolean("can_approve_kyc").default(true),
  canManageTransactions: boolean("can_manage_transactions").default(false),
  canViewLogs: boolean("can_view_logs").default(true),
  canBroadcastMessages: boolean("can_broadcast_messages").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 2. INVESTMENT & ASSET MODELS
// ============================================

export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., 'Bitcoin', 'Apple Inc. Stake'
  ticker: varchar("ticker", { length: 20 }).notNull(), // e.g., 'BTC', 'AAPL', 'USD'
  type: assetTypeEnum("type").notNull(),
  balance: decimal("balance", { precision: 36, scale: 18 }).default("0"),
  balanceInEscrow: decimal("balance_in_escrow", { precision: 36, scale: 18 }).default("0"),
  valueUSD: decimal("value_usd", { precision: 36, scale: 2 }).default("0"),
  initialInvestment: decimal("initial_investment", { precision: 36, scale: 2 }).default("0"),
  totalEarnings: decimal("total_earnings", { precision: 36, scale: 2 }).default("0"),
  status: assetStatusEnum("status").default("Active"),
  maturityDate: timestamp("maturity_date", { withTimezone: true }),
  payoutDestination: payoutDestinationEnum("payout_destination").default("balance"),
  details: jsonb("details"), // Additional data (e.g., precious metal purity, storage location)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Investment logs removed - use transactions table for all financial activity

// ============================================
// 3. TRANSACTION & FINANCIAL MODELS
// ============================================

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow(),
  description: varchar("description", { length: 255 }).notNull(),
  amountUSD: decimal("amount_usd", { precision: 36, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").default("Pending"),
  type: transactionTypeEnum("type").notNull(),
  txHash: text("tx_hash"), // Optional blockchain hash
  relatedAssetId: varchar("related_asset_id").references(() => assets.id),
});

// ============================================
// 4. P2P EXCHANGE MODELS
// ============================================

export const p2pOffers = pgTable("p2p_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: p2pOfferTypeEnum("type").notNull(),
  assetTicker: varchar("asset_ticker", { length: 20 }).notNull(),
  fiatCurrency: varchar("fiat_currency", { length: 10 }).notNull(),
  price: decimal("price", { precision: 36, scale: 2 }).notNull(),
  availableAmount: decimal("available_amount", { precision: 36, scale: 18 }).notNull(),
  minOrder: decimal("min_order", { precision: 36, scale: 2 }).notNull(),
  maxOrder: decimal("max_order", { precision: 36, scale: 2 }).notNull(),
  paymentTimeLimitMinutes: integer("payment_time_limit_minutes").default(30),
  terms: text("terms"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const p2pOrders = pgTable("p2p_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id").references(() => p2pOffers.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  status: p2pOrderStatusEnum("status").default("Pending Payment"),
  fiatAmount: decimal("fiat_amount", { precision: 36, scale: 2 }).notNull(),
  cryptoAmount: decimal("crypto_amount", { precision: 36, scale: 18 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const p2pChatMessages = pgTable("p2p_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => p2pOrders.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 5. OTC (OVER-THE-COUNTER) PROCUREMENT
// ============================================

export const otcTasks = pgTable("otc_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  cryptoType: varchar("crypto_type", { length: 50 }).notNull(), // e.g., 'BTC', 'ETH', 'USDT'
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  targetPrice: decimal("target_price", { precision: 36, scale: 2 }), // Optional price target
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).notNull(), // e.g., 2.5 for 2.5%
  status: otcTaskStatusEnum("status").default("Open"),
  maxClaimers: integer("max_claimers").default(1), // How many users can claim this task
  currentClaimers: integer("current_claimers").default(0),
  description: text("description"),
  instructions: text("instructions"),
  depositAddress: text("deposit_address"), // Where users should send crypto
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const otcOrders = pgTable("otc_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => otcTasks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: otcOrderStatusEnum("status").default("Claimed"),
  purchaseAmount: decimal("purchase_amount", { precision: 36, scale: 18 }),
  purchasePrice: decimal("purchase_price", { precision: 36, scale: 2 }),
  commissionEarned: decimal("commission_earned", { precision: 36, scale: 2 }),
  proofOfPurchase: jsonb("proof_of_purchase"), // Screenshots, receipts
  transactionHash: text("transaction_hash"), // Crypto TX hash
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const p2pDisputes = pgTable("p2p_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => p2pOrders.id).notNull(),
  raisedBy: varchar("raised_by").references(() => users.id).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 50 }).default("open"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const p2pPaymentMethods = pgTable("p2p_payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  methodName: varchar("method_name", { length: 255 }).notNull(),
  details: jsonb("details"), // Encrypted payment details
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const p2pReviews = pgTable("p2p_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => p2pOrders.id).notNull(),
  reviewerId: varchar("reviewer_id").references(() => users.id).notNull(),
  reviewedUserId: varchar("reviewed_user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 5. FEATURE-SPECIFIC MODELS
// ============================================

export const loanApplications = pgTable("loan_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 36, scale: 2 }).notNull(),
  term: integer("term").notNull(), // Days
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  collateralAssetId: varchar("collateral_asset_id").references(() => assets.id),
  contactsFile: text("contacts_file"), // Encrypted file path
  status: loanStatusEnum("status").default("Pending"),
  details: jsonb("details"), // { repaymentProgress, dueDates, etc. }
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const valifiCards = pgTable("valifi_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: cardStatusEnum("status").default("Not Applied"),
  type: cardTypeEnum("type"),
  currency: varchar("currency", { length: 10 }),
  theme: varchar("theme", { length: 50 }),
  cardNumberHash: varchar("card_number_hash", { length: 255 }), // Hashed
  expiry: text("expiry"), // Encrypted
  cvvHash: varchar("cvv_hash", { length: 255 }), // Hashed
  isFrozen: boolean("is_frozen").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  countryCode: varchar("country_code", { length: 5 }).notNull(),
  nickname: varchar("nickname", { length: 255 }),
  details: jsonb("details"), // Encrypted { IBAN, accountNumber, routingNumber, etc. }
  status: bankAccountStatusEnum("status").default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// EXCHANGE PLATFORM MODELS
// ============================================

export const exchangeOrders = pgTable("exchange_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  assetTicker: varchar("asset_ticker", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  priceUSD: decimal("price_usd", { precision: 36, scale: 2 }).notNull(),
  totalUSD: decimal("total_usd", { precision: 36, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending_admin"), // pending_admin, user_confirmed, admin_confirmed, completed
  bankDetails: jsonb("bank_details"), // User's wire transfer details
  paymentProof: text("payment_proof"), // Upload URL
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ============================================
// ADMIN MODELS
// ============================================

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique().notNull(),
  role: varchar("role", { length: 50 }).default("admin"), // admin, super_admin
  permissions: jsonb("permissions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").references(() => adminUsers.id).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  targetId: varchar("target_id", { length: 255 }),
  targetType: varchar("target_type", { length: 100 }), // user, loan, p2p_order, etc.
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// KYC RECORDS
// ============================================

export const kycRecords = pgTable("kyc_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique().notNull(),
  documentType: varchar("document_type", { length: 100 }),
  documentUrls: jsonb("document_urls"), // Array of uploaded document URLs
  selfieUrl: text("selfie_url"),
  addressProofUrl: text("address_proof_url"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: varchar("reviewed_by").references(() => adminUsers.id),
  rejectionReason: text("rejection_reason"),
});

// ============================================
// ZODB SCHEMAS (for API validation)
// ============================================

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  username: z.string().min(3),
  fullName: z.string().min(2),
  passwordHash: z.string().min(8),
});

// Validation schemas for API endpoints
export const insertAssetSchema = createInsertSchema(assets);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertP2POfferSchema = createInsertSchema(p2pOffers);
export const insertP2POrderSchema = createInsertSchema(p2pOrders);
export const insertLoanApplicationSchema = createInsertSchema(loanApplications);
export const insertBankAccountSchema = createInsertSchema(bankAccounts);
export const insertExchangeOrderSchema = createInsertSchema(exchangeOrders);
export const insertKycRecordSchema = createInsertSchema(kycRecords);
export const insertValifiCardSchema = createInsertSchema(valifiCards);
export const insertP2PPaymentMethodSchema = createInsertSchema(p2pPaymentMethods);
export const insertP2PChatMessageSchema = createInsertSchema(p2pChatMessages);
export const insertP2PDisputeSchema = createInsertSchema(p2pDisputes);
export const insertP2PReviewSchema = createInsertSchema(p2pReviews);

// Type exports for frontend
export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type P2POffer = typeof p2pOffers.$inferSelect;
export type P2POrder = typeof p2pOrders.$inferSelect;
