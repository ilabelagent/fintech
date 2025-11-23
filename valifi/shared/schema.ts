import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const kycStatusEnum = pgEnum("kyc_status", ["pending", "in_review", "approved", "rejected"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "confirmed", "failed"]);
export const threatLevelEnum = pgEnum("threat_level", ["none", "low", "medium", "high", "critical"]);
export const networkEnum = pgEnum("network", ["ethereum", "polygon", "bsc", "arbitrum", "optimism"]);
export const cryptoProcessorEnum = pgEnum("crypto_processor", ["bitpay", "binance_pay", "bybit", "kucoin", "luno"]);
export const contractTypeEnum = pgEnum("contract_type", ["ERC20", "ERC721", "ERC1155", "ERC721A", "custom"]);
export const contractStatusEnum = pgEnum("contract_status", ["deploying", "deployed", "verified", "failed"]);
export const orderTypeEnum = pgEnum("order_type", ["market", "limit", "stop_loss", "stop_limit"]);
export const orderSideEnum = pgEnum("order_side", ["buy", "sell"]);
export const orderStatusEnum = pgEnum("order_status", ["open", "partially_filled", "filled", "cancelled", "expired"]);
export const p2pOfferTypeEnum = pgEnum("p2p_offer_type", ["buy", "sell"]);
export const p2pOfferStatusEnum = pgEnum("p2p_offer_status", ["active", "paused", "completed", "cancelled"]);
export const p2pOrderStatusEnum = pgEnum("p2p_order_status", ["created", "escrowed", "paid", "released", "disputed", "cancelled", "completed"]);
export const p2pDisputeStatusEnum = pgEnum("p2p_dispute_status", ["open", "reviewing", "resolved", "escalated"]);
export const walletConnectSessionStatusEnum = pgEnum("wallet_connect_session_status", ["active", "expired", "disconnected"]);
export const metalTypeEnum = pgEnum("metal_type", ["gold", "silver", "platinum", "palladium", "copper"]);
export const metalTradeStatusEnum = pgEnum("metal_trade_status", ["pending", "confirmed", "shipped", "delivered", "cancelled"]);
export const metalFormEnum = pgEnum("metal_form", ["bar", "coin", "round"]);
export const ownershipLocationEnum = pgEnum("ownership_location", ["vault", "delivery_pending", "delivered"]);
export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "admin", "moderator", "support"]);
export const forumChannelTypeEnum = pgEnum("forum_channel_type", ["text", "voice", "announcement"]);

// ============================================
// CORE TABLES
// ============================================

// Session storage - REQUIRED for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  kycStatus: kycStatusEnum("kyc_status").default("pending"),
  kycUserId: text("kyc_user_id"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// BLOCKCHAIN & WALLETS
// ============================================

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  address: text("address").notNull().unique(),
  network: networkEnum("network").notNull(),
  privateKeyEncrypted: text("private_key_encrypted").notNull(),
  isMain: boolean("is_main").default(false),
  balance: decimal("balance", { precision: 36, scale: 18 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  txHash: text("tx_hash").unique(),
  network: networkEnum("network").notNull(),
  type: text("type").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  value: decimal("value", { precision: 36, scale: 18 }),
  gasUsed: text("gas_used"),
  status: transactionStatusEnum("status").default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

export const armorWallets = pgTable("armor_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletType: text("wallet_type").notNull(),
  address: text("address").notNull().unique(),
  chains: jsonb("chains").notNull(),
  dailyLimit: decimal("daily_limit", { precision: 36, scale: 18 }),
  requiresTwoFa: boolean("requires_two_fa").default(false),
  armorApiKey: text("armor_api_key"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletConnectSessions = pgTable("wallet_connect_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletAddress: text("wallet_address").notNull(),
  walletType: text("wallet_type").notNull(),
  chainId: integer("chain_id").notNull(),
  network: text("network").notNull(),
  status: walletConnectSessionStatusEnum("status").default("active"),
  sessionData: jsonb("session_data"),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// ============================================
// NFTs & SMART CONTRACTS
// ============================================

export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(),
  network: networkEnum("network").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  metadataUrl: text("metadata_url"),
  attributes: jsonb("attributes"),
  mintTxHash: text("mint_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  contractAddress: text("contract_address").notNull().unique(),
  network: networkEnum("network").notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimals: integer("decimals").default(18),
  totalSupply: decimal("total_supply", { precision: 36, scale: 18 }),
  deployTxHash: text("deploy_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nftCollections = pgTable("nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description"),
  contractAddress: text("contract_address").notNull().unique(),
  network: networkEnum("network").notNull(),
  collectionType: text("collection_type").notNull(),
  totalSupply: integer("total_supply"),
  maxSupply: integer("max_supply"),
  floorPrice: decimal("floor_price", { precision: 36, scale: 18 }),
  volumeTraded: decimal("volume_traded", { precision: 36, scale: 18 }).default("0"),
  royaltyBps: integer("royalty_bps").default(0),
  royaltyRecipient: text("royalty_recipient"),
  baseUri: text("base_uri"),
  coverImage: text("cover_image"),
  deployTxHash: text("deploy_tx_hash"),
  isVerified: boolean("is_verified").default(false),
  isPublic: boolean("is_public").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nftMints = pgTable("nft_mints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => nftCollections.id),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  nftId: varchar("nft_id").references(() => nfts.id),
  tokenId: text("token_id").notNull(),
  recipientAddress: text("recipient_address").notNull(),
  mintType: text("mint_type").notNull(),
  quantity: integer("quantity").default(1),
  mintPrice: decimal("mint_price", { precision: 36, scale: 18 }),
  gasUsed: text("gas_used"),
  mintTxHash: text("mint_tx_hash").unique(),
  metadataUrl: text("metadata_url"),
  rarityScore: decimal("rarity_score", { precision: 10, scale: 4 }),
  rarityRank: integer("rarity_rank"),
  status: text("status").default("pending"),
  network: networkEnum("network").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

export const smartContracts = pgTable("smart_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  contractType: contractTypeEnum("contract_type").notNull(),
  contractAddress: text("contract_address").unique(),
  network: networkEnum("network").notNull(),
  abi: jsonb("abi"),
  bytecode: text("bytecode"),
  sourceCode: text("source_code"),
  compilerVersion: text("compiler_version"),
  optimizationEnabled: boolean("optimization_enabled").default(true),
  optimizationRuns: integer("optimization_runs").default(200),
  constructorArgs: jsonb("constructor_args"),
  deployTxHash: text("deploy_tx_hash").unique(),
  deployedBy: text("deployed_by"),
  gasUsed: text("gas_used"),
  status: contractStatusEnum("status").default("deploying"),
  isVerified: boolean("is_verified").default(false),
  verificationTxHash: text("verification_tx_hash"),
  etherscanUrl: text("etherscan_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  deployedAt: timestamp("deployed_at"),
  verifiedAt: timestamp("verified_at"),
});

// ============================================
// PAYMENTS & KYC
// ============================================

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  stripePaymentId: text("stripe_payment_id").unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  status: text("status").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cryptoPayments = pgTable("crypto_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  processor: cryptoProcessorEnum("processor").notNull(),
  processorInvoiceId: text("processor_invoice_id").unique(),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  currency: text("currency").notNull(),
  fiatAmount: decimal("fiat_amount", { precision: 12, scale: 2 }),
  fiatCurrency: text("fiat_currency").default("usd"),
  status: text("status").notNull(),
  paymentUrl: text("payment_url"),
  qrCode: text("qr_code"),
  txHash: text("tx_hash"),
  expiresAt: timestamp("expires_at"),
  confirmedAt: timestamp("confirmed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const kycRecords = pgTable("kyc_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sumsubApplicantId: text("sumsub_applicant_id").unique(),
  verificationStatus: kycStatusEnum("verification_status").default("pending"),
  documentType: text("document_type"),
  reviewResult: jsonb("review_result"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const securityEvents = pgTable("security_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  threatLevel: threatLevelEnum("threat_level").notNull(),
  description: text("description").notNull(),
  ipAddress: text("ip_address"),
  metadata: jsonb("metadata"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// P2P TRADING
// ============================================

export const p2pOffers = pgTable("p2p_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: p2pOfferTypeEnum("type").notNull(),
  cryptocurrency: text("cryptocurrency").notNull(),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  fiatCurrency: text("fiat_currency").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 12, scale: 2 }).notNull(),
  paymentMethods: text("payment_methods").array(),
  minAmount: decimal("min_amount", { precision: 36, scale: 18 }),
  maxAmount: decimal("max_amount", { precision: 36, scale: 18 }),
  timeLimit: integer("time_limit").default(30),
  terms: text("terms"),
  status: p2pOfferStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const p2pOrders = pgTable("p2p_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id").references(() => p2pOffers.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  fiatAmount: decimal("fiat_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: p2pOrderStatusEnum("status").default("created"),
  escrowTxHash: text("escrow_tx_hash"),
  releaseTxHash: text("release_tx_hash"),
  disputeReason: text("dispute_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  completedAt: timestamp("completed_at"),
});

export const p2pPaymentMethods = pgTable("p2p_payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  details: jsonb("details"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const p2pChatMessages = pgTable("p2p_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => p2pOrders.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const p2pDisputes = pgTable("p2p_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => p2pOrders.id).notNull(),
  raisedBy: varchar("raised_by").references(() => users.id).notNull(),
  reason: text("reason").notNull(),
  evidence: jsonb("evidence"),
  status: p2pDisputeStatusEnum("status").default("open"),
  resolution: text("resolution"),
  resolvedBy: varchar("resolved_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const p2pReviews = pgTable("p2p_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => p2pOrders.id).notNull(),
  reviewerId: varchar("reviewer_id").references(() => users.id).notNull(),
  reviewedUserId: varchar("reviewed_user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// EXCHANGE & TRADING
// ============================================

export const exchangeOrders = pgTable("exchange_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orderType: orderTypeEnum("order_type").notNull(),
  orderSide: orderSideEnum("order_side").notNull(),
  tradingPair: text("trading_pair").notNull(),
  price: decimal("price", { precision: 36, scale: 18 }),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  filled: decimal("filled", { precision: 36, scale: 18 }).default("0"),
  status: orderStatusEnum("status").default("open"),
  total: decimal("total", { precision: 36, scale: 18 }),
  fees: decimal("fees", { precision: 36, scale: 18 }),
  network: networkEnum("network").notNull(),
  externalOrderId: text("external_order_id"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const liquidityPools = pgTable("liquidity_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  poolName: text("pool_name").notNull(),
  tokenA: text("token_a").notNull(),
  tokenB: text("token_b").notNull(),
  reserveA: decimal("reserve_a", { precision: 36, scale: 18 }).default("0"),
  reserveB: decimal("reserve_b", { precision: 36, scale: 18 }).default("0"),
  lpTokens: decimal("lp_tokens", { precision: 36, scale: 18 }).default("0"),
  apy: decimal("apy", { precision: 10, scale: 4 }),
  network: networkEnum("network").notNull(),
  contractAddress: text("contract_address").notNull(),
  totalValueLocked: decimal("total_value_locked", { precision: 36, scale: 18 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mevEvents = pgTable("mev_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  network: networkEnum("network").notNull(),
  txHash: text("tx_hash"),
  targetTxHash: text("target_tx_hash"),
  profitAmount: decimal("profit_amount", { precision: 36, scale: 18 }),
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }),
  isProtected: boolean("is_protected").default(false),
  protectionMethod: text("protection_method"),
  metadata: jsonb("metadata"),
  detectedAt: timestamp("detected_at").defaultNow(),
});

// ============================================
// BROKER & INVESTMENTS
// ============================================

export const brokerAccounts = pgTable("broker_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  brokerName: text("broker_name").notNull(),
  accountNumber: text("account_number").unique(),
  accountType: text("account_type").notNull(),
  apiKeyEncrypted: text("api_key_encrypted"),
  secretKeyEncrypted: text("secret_key_encrypted"),
  isActive: boolean("is_active").default(true),
  buyingPower: decimal("buying_power", { precision: 12, scale: 2 }).default("0"),
  cashBalance: decimal("cash_balance", { precision: 12, scale: 2 }).default("0"),
  portfolioValue: decimal("portfolio_value", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brokerOrders = pgTable("broker_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => brokerAccounts.id).notNull(),
  symbol: text("symbol").notNull(),
  orderType: text("order_type").notNull(),
  side: text("side").notNull(),
  quantity: decimal("quantity", { precision: 16, scale: 8 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }),
  status: text("status").notNull(),
  brokerOrderId: text("broker_order_id"),
  filledQuantity: decimal("filled_quantity", { precision: 16, scale: 8 }).default("0"),
  averagePrice: decimal("average_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  filledAt: timestamp("filled_at"),
});

export const brokerPositions = pgTable("broker_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => brokerAccounts.id).notNull(),
  symbol: text("symbol").notNull(),
  quantity: decimal("quantity", { precision: 16, scale: 8 }).notNull(),
  averageCost: decimal("average_cost", { precision: 12, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 12, scale: 2 }),
  marketValue: decimal("market_value", { precision: 12, scale: 2 }),
  unrealizedPL: decimal("unrealized_pl", { precision: 12, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financialHoldings = pgTable("financial_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  holdingType: text("holding_type").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name"),
  quantity: decimal("quantity", { precision: 16, scale: 8 }).notNull(),
  averageCost: decimal("average_cost", { precision: 12, scale: 2 }),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  unrealizedGain: decimal("unrealized_gain", { precision: 12, scale: 2 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financialOrders = pgTable("financial_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orderType: text("order_type").notNull(),
  assetType: text("asset_type").notNull(),
  symbol: text("symbol").notNull(),
  quantity: decimal("quantity", { precision: 16, scale: 8 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  filledAt: timestamp("filled_at"),
});

// ============================================
// PRECIOUS METALS
// ============================================

export const metalInventory = pgTable("metal_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metalType: metalTypeEnum("metal_type").notNull(),
  weight: decimal("weight", { precision: 12, scale: 4 }).notNull(),
  purity: decimal("purity", { precision: 5, scale: 2 }).default("99.99"),
  pricePerOunce: decimal("price_per_ounce", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }),
  supplier: text("supplier"),
  vaultLocation: text("vault_location"),
  certificateUrl: text("certificate_url"),
  isAvailable: boolean("is_available").default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const metalTrades = pgTable("metal_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  inventoryId: varchar("inventory_id").references(() => metalInventory.id).notNull(),
  tradeType: text("trade_type").notNull(),
  weight: decimal("weight", { precision: 12, scale: 4 }).notNull(),
  pricePerOunce: decimal("price_per_ounce", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  status: metalTradeStatusEnum("status").default("pending"),
  paymentMethod: text("payment_method"),
  deliveryAddress: text("delivery_address"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

export const metalProducts = pgTable("metal_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metal: metalTypeEnum("metal").notNull(),
  weight: decimal("weight", { precision: 12, scale: 4 }).notNull(),
  form: metalFormEnum("form").notNull(),
  productName: text("product_name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  premium: decimal("premium", { precision: 5, scale: 2 }).default("5.00"),
  inStock: boolean("in_stock").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const metalOwnership = pgTable("metal_ownership", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => metalProducts.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  location: ownershipLocationEnum("location").default("vault"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }).notNull(),
  spotPriceAtPurchase: decimal("spot_price_at_purchase", { precision: 12, scale: 2 }).notNull(),
  cryptoPaymentTx: text("crypto_payment_tx"),
  certificateUrl: text("certificate_url"),
  deliveryAddress: text("delivery_address"),
  trackingNumber: text("tracking_number"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

// ============================================
// ADMIN & DASHBOARD
// ============================================

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  role: adminRoleEnum("role").notNull(),
  permissions: jsonb("permissions").array(),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id).notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: varchar("target_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminBroadcasts = pgTable("admin_broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id).notNull(),
  recipientType: text("recipient_type").notNull(),
  recipientIds: jsonb("recipient_ids").array(),
  message: text("message").notNull(),
  title: text("title"),
  priority: text("priority").default("normal"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const userDashboardConfigs = pgTable("user_dashboard_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  layout: jsonb("layout").notNull(),
  theme: text("theme").default("dark"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  icon: text("icon"),
  defaultConfig: jsonb("default_config"),
  isSystemWidget: boolean("is_system_widget").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userWidgetPreferences = pgTable("user_widget_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  widgetId: varchar("widget_id").references(() => dashboardWidgets.id).notNull(),
  position: jsonb("position").notNull(),
  config: jsonb("config"),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userWidgetUnique: unique().on(table.userId, table.widgetId),
}));

// ============================================
// COMMUNITY & SUPPORT
// ============================================

export const forumServers = pgTable("forum_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  iconUrl: text("icon_url"),
  bannerUrl: text("banner_url"),
  memberCount: integer("member_count").default(0),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumChannels = pgTable("forum_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").references(() => forumServers.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  channelType: forumChannelTypeEnum("channel_type").default("text"),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumThreads = pgTable("forum_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => forumChannels.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  lastReplyAt: timestamp("last_reply_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").references(() => forumThreads.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const helpArticles = pgTable("help_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  viewCount: integer("view_count").default(0),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const guideSteps = pgTable("guide_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id").references(() => helpArticles.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// NEWS & BLOG
// ============================================

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  category: text("category"),
  tags: text("tags").array(),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const articleComments = pgTable("article_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => blogPosts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  parentCommentId: varchar("parent_comment_id").references(() => articleComments.id),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// ZORM SCHEMAS FOR VALIDATION
// ============================================

export const insertUserSchema = createInsertSchema(users);
export const insertWalletSchema = createInsertSchema(wallets);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertNFTSchema = createInsertSchema(nfts);
export const insertTokenSchema = createInsertSchema(tokens);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertKYCRecordSchema = createInsertSchema(kycRecords);
