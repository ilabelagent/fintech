import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for status tracking
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "in_review", "approved", "rejected"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "confirmed", "failed"]);
export const botStatusEnum = pgEnum("bot_status", ["active", "idle", "error", "maintenance"]);
export const agentTypeEnum = pgEnum("agent_type", [
  // Core System Agents (11)
  "orchestrator",
  "blockchain",
  "web3",
  "payment",
  "kyc",
  "security",
  "publishing",
  "quantum",
  "analytics",
  "monitoring",
  "guardian_angel",

  // Financial Services Agents (13)
  "financial_401k",
  "financial_ira",
  "financial_pension",
  "financial_bonds",
  "financial_stocks",
  "financial_options",
  "financial_forex",
  "financial_metals",
  "financial_commodities",
  "financial_mutual_funds",
  "financial_reit",
  "financial_crypto_derivatives",
  "financial_portfolio",

  // Advanced Trading & DeFi Agents (8)
  "trading_amm",
  "trading_liquidity",
  "trading_defi",
  "trading_bridge",
  "trading_lending",
  "trading_gas_optimizer",
  "trading_mining",
  "trading_advanced",

  // Wallet & Security Agents (5)
  "wallet_hd",
  "wallet_hardware",
  "wallet_multisig",
  "wallet_seed_management",
  "security_privacy",

  // Platform Services Agents (15)
  "platform",
  "platform_admin_control",
  "platform_admin_dashboard",
  "platform_contact_manager",
  "platform_communication",
  "platform_mail",
  "platform_translation",
  "platform_education",
  "platform_onboarding",
  "platform_vip_desk",
  "platform_enterprise",
  "platform_escrow",
  "platform_advanced_services",
  "platform_innovative",
  "platform_address_book",

  // Analytics & Intelligence Agents (6)
  "analytics_portfolio",
  "analytics_transaction_history",
  "analytics_divine_oracle",
  "analytics_word",
  "analytics_cyberlab",
  "analytics_banking",

  // NFT & Collectibles Agents (3)
  "nft_minting",
  "collectibles",
  "smart_contract",

  // Community & Social Agents (2)
  "community_exchange",
  "multichain"
]);
export const threatLevelEnum = pgEnum("threat_level", ["none", "low", "medium", "high", "critical"]);
export const networkEnum = pgEnum("network", ["ethereum", "polygon", "bsc", "arbitrum", "optimism"]);
export const cryptoProcessorEnum = pgEnum("crypto_processor", ["bitpay", "binance_pay", "bybit", "kucoin", "luno"]);
export const tradingStrategyEnum = pgEnum("trading_strategy", ["grid", "dca", "arbitrage", "scalping", "market_making", "momentum_ai", "mev"]);
export const botExecutionStatusEnum = pgEnum("bot_execution_status", ["pending", "running", "completed", "failed", "cancelled"]);
export const forumChannelTypeEnum = pgEnum("forum_channel_type", ["text", "voice", "announcement"]);
export const forumMemberRoleEnum = pgEnum("forum_member_role", ["owner", "admin", "moderator", "member", "muted", "banned"]);
export const forumServerVisibilityEnum = pgEnum("forum_server_visibility", ["public", "private"]);

// Session storage table - REQUIRED for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Compatible with Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Bcrypt hashed password (nullable for safe migration)
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  kycStatus: kycStatusEnum("kyc_status").default("pending"),
  kycUserId: text("kyc_user_id"), // Sumsub user ID
  isAdmin: boolean("is_admin").default(false),
  kingdomFeaturesEnabled: jsonb("kingdom_features_enabled").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blockchain wallets
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  address: text("address").notNull().unique(),
  network: networkEnum("network").notNull(),
  privateKeyEncrypted: text("private_key_encrypted").notNull(), // Encrypted with master key
  isMain: boolean("is_main").default(false),
  balance: decimal("balance", { precision: 36, scale: 18 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blockchain transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  txHash: text("tx_hash").unique(),
  network: networkEnum("network").notNull(),
  type: text("type").notNull(), // transfer, nft_mint, token_deploy, etc.
  from: text("from").notNull(),
  to: text("to").notNull(),
  value: decimal("value", { precision: 36, scale: 18 }),
  gasUsed: text("gas_used"),
  status: transactionStatusEnum("status").default("pending"),
  metadata: jsonb("metadata"), // Additional tx data
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

// NFT collections and tokens
export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(),
  network: networkEnum("network").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  metadataUrl: text("metadata_url"), // IPFS URL
  attributes: jsonb("attributes"),
  mintTxHash: text("mint_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ERC-20 tokens
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

// NFT Collections
export const nftCollections = pgTable("nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description"),
  contractAddress: text("contract_address").notNull().unique(),
  network: networkEnum("network").notNull(),
  collectionType: text("collection_type").notNull(), // ERC-721, ERC-1155, ERC-721A
  totalSupply: integer("total_supply"),
  maxSupply: integer("max_supply"),
  floorPrice: decimal("floor_price", { precision: 36, scale: 18 }),
  volumeTraded: decimal("volume_traded", { precision: 36, scale: 18 }).default("0"),
  royaltyBps: integer("royalty_bps").default(0), // Basis points (500 = 5%)
  royaltyRecipient: text("royalty_recipient"),
  baseUri: text("base_uri"), // Base URI for metadata
  coverImage: text("cover_image"),
  deployTxHash: text("deploy_tx_hash"),
  isVerified: boolean("is_verified").default(false),
  isPublic: boolean("is_public").default(true),
  metadata: jsonb("metadata"), // Collection-level metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NFT Mint Records
export const nftMints = pgTable("nft_mints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => nftCollections.id),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  nftId: varchar("nft_id").references(() => nfts.id),
  tokenId: text("token_id").notNull(),
  recipientAddress: text("recipient_address").notNull(),
  mintType: text("mint_type").notNull(), // single, batch, lazy
  quantity: integer("quantity").default(1),
  mintPrice: decimal("mint_price", { precision: 36, scale: 18 }),
  gasUsed: text("gas_used"),
  mintTxHash: text("mint_tx_hash").unique(),
  metadataUrl: text("metadata_url"), // IPFS URL
  rarityScore: decimal("rarity_score", { precision: 10, scale: 4 }),
  rarityRank: integer("rarity_rank"),
  status: text("status").default("pending"), // pending, confirmed, failed
  network: networkEnum("network").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

// Smart Contracts
export const contractTypeEnum = pgEnum("contract_type", ["ERC20", "ERC721", "ERC1155", "ERC721A", "custom"]);
export const contractStatusEnum = pgEnum("contract_status", ["deploying", "deployed", "verified", "failed"]);

export const smartContracts = pgTable("smart_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  contractType: contractTypeEnum("contract_type").notNull(),
  contractAddress: text("contract_address").unique(),
  network: networkEnum("network").notNull(),
  abi: jsonb("abi"), // Contract ABI
  bytecode: text("bytecode"), // Contract bytecode
  sourceCode: text("source_code"), // Solidity source
  compilerVersion: text("compiler_version"),
  optimizationEnabled: boolean("optimization_enabled").default(true),
  optimizationRuns: integer("optimization_runs").default(200),
  constructorArgs: jsonb("constructor_args"), // Constructor arguments
  deployTxHash: text("deploy_tx_hash").unique(),
  deployedBy: text("deployed_by"), // Deployer address
  gasUsed: text("gas_used"),
  status: contractStatusEnum("status").default("deploying"),
  isVerified: boolean("is_verified").default(false),
  verificationTxHash: text("verification_tx_hash"),
  etherscanUrl: text("etherscan_url"),
  metadata: jsonb("metadata"), // Additional contract info
  createdAt: timestamp("created_at").defaultNow(),
  deployedAt: timestamp("deployed_at"),
  verifiedAt: timestamp("verified_at"),
});

// Jesus Cartel songs (publishing pipeline)
export const songs = pgTable("songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  albumArt: text("album_art"), // IPFS hash
  audioFile: text("audio_file"), // IPFS hash
  nftId: varchar("nft_id").references(() => nfts.id),
  tokenId: varchar("token_id").references(() => tokens.id),
  metadata: jsonb("metadata"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Jesus Cartel Music Ministry - Releases
export const jesusCartelReleases = pgTable("jesus_cartel_releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  albumArt: text("album_art").notNull(),
  streamUrl: text("stream_url").notNull(),
  releaseDate: timestamp("release_date").notNull(),
  genre: text("genre"),
  duration: integer("duration"), // in seconds
  isFeatured: boolean("is_featured").default(false),
  streamCount: integer("stream_count").default(0),
  likeCount: integer("like_count").default(0),
  nftId: varchar("nft_id").references(() => nfts.id),
  tokenId: varchar("token_id").references(() => tokens.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jesus Cartel Music Ministry - Events
export const jesusCartelEvents = pgTable("jesus_cartel_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  venue: text("venue").notNull(),
  location: text("location").notNull(),
  ticketUrl: text("ticket_url"),
  imageUrl: text("image_url"),
  artistLineup: text("artist_lineup").array(),
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }),
  capacity: integer("capacity"),
  attendeeCount: integer("attendee_count").default(0),
  isFeatured: boolean("is_featured").default(false),
  status: text("status").default("upcoming"), // upcoming, ongoing, completed, cancelled
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jesus Cartel Stream Tracking
export const jesusCartelStreams = pgTable("jesus_cartel_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  releaseId: varchar("release_id").references(() => jesusCartelReleases.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  duration: integer("duration"), // how long they listened in seconds
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Multi-agent system
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: agentTypeEnum("type").notNull(),
  status: botStatusEnum("status").default("idle"),
  config: jsonb("config"), // Agent-specific configuration
  capabilities: jsonb("capabilities"), // What this agent can do
  currentTask: text("current_task"),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0"),
  totalOperations: integer("total_operations").default(0),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent communications and task logs
export const agentLogs = pgTable("agent_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  action: text("action").notNull(),
  status: text("status").notNull(), // success, failed, pending
  input: jsonb("input"),
  output: jsonb("output"),
  errorMessage: text("error_message"),
  duration: integer("duration"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Security system (Guardian Angel)
export const securityEvents = pgTable("security_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  agentId: varchar("agent_id").references(() => agents.id),
  eventType: text("event_type").notNull(), // suspicious_login, threat_detected, etc.
  threatLevel: threatLevelEnum("threat_level").notNull(),
  description: text("description").notNull(),
  ipAddress: text("ip_address"),
  metadata: jsonb("metadata"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment transactions (Stripe)
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  stripePaymentId: text("stripe_payment_id").unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  status: text("status").notNull(), // succeeded, pending, failed
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// KYC verification records
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

// Quantum computing jobs
export const quantumJobs = pgTable("quantum_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  algorithm: text("algorithm").notNull(),
  parameters: jsonb("parameters"),
  qubitsUsed: integer("qubits_used"),
  status: text("status").default("queued"), // queued, running, completed, failed
  result: jsonb("result"),
  ibmJobId: text("ibm_job_id"),
  executionTime: integer("execution_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Crypto payment processors
export const cryptoPayments = pgTable("crypto_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  processor: cryptoProcessorEnum("processor").notNull(),
  processorInvoiceId: text("processor_invoice_id").unique(), // BitPay invoice ID, Binance order ID, etc.
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  currency: text("currency").notNull(), // BTC, ETH, USDT, etc.
  fiatAmount: decimal("fiat_amount", { precision: 12, scale: 2 }),
  fiatCurrency: text("fiat_currency").default("usd"),
  status: text("status").notNull(), // new, paid, confirmed, completed, expired, failed
  paymentUrl: text("payment_url"), // Customer payment URL
  qrCode: text("qr_code"), // Payment QR code URL
  txHash: text("tx_hash"), // Blockchain transaction hash
  expiresAt: timestamp("expires_at"),
  confirmedAt: timestamp("confirmed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// P2P Trading System
export const p2pOfferTypeEnum = pgEnum("p2p_offer_type", ["buy", "sell"]);
export const p2pOfferStatusEnum = pgEnum("p2p_offer_status", ["active", "paused", "completed", "cancelled"]);
export const p2pOrderStatusEnum = pgEnum("p2p_order_status", ["created", "escrowed", "paid", "released", "disputed", "cancelled", "completed"]);
export const p2pDisputeStatusEnum = pgEnum("p2p_dispute_status", ["open", "reviewing", "resolved", "escalated"]);

export const p2pOffers = pgTable("p2p_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: p2pOfferTypeEnum("type").notNull(),
  cryptocurrency: text("cryptocurrency").notNull(), // BTC, ETH, USDT, etc.
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  fiatCurrency: text("fiat_currency").notNull(), // USD, EUR, etc.
  pricePerUnit: decimal("price_per_unit", { precision: 12, scale: 2 }).notNull(),
  paymentMethods: text("payment_methods").array(), // bank_transfer, paypal, etc.
  minAmount: decimal("min_amount", { precision: 36, scale: 18 }),
  maxAmount: decimal("max_amount", { precision: 36, scale: 18 }),
  timeLimit: integer("time_limit").default(30), // minutes
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
  type: text("type").notNull(), // bank_transfer, paypal, venmo, cash_app, zelle, etc.
  details: jsonb("details"), // account number, email, etc.
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
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const p2pReviews = pgTable("p2p_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => p2pOrders.id).notNull(),
  reviewerId: varchar("reviewer_id").references(() => users.id).notNull(),
  reviewedUserId: varchar("reviewed_user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// WalletConnect Sessions
export const walletConnectSessionStatusEnum = pgEnum("wallet_connect_session_status", ["active", "expired", "disconnected"]);

export const walletConnectSessions = pgTable("wallet_connect_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletAddress: text("wallet_address").notNull(),
  walletType: text("wallet_type").notNull(), // metamask, trust, rainbow, coinbase, etc.
  chainId: integer("chain_id").notNull(),
  network: text("network").notNull(), // ethereum, polygon, bsc, etc.
  status: walletConnectSessionStatusEnum("status").default("active"),
  sessionData: jsonb("session_data"),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Trading bot configurations
export const tradingBots = pgTable("trading_bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  strategy: tradingStrategyEnum("strategy").notNull(),
  exchange: text("exchange").notNull(), // binance, bybit, kucoin, etc.
  tradingPair: text("trading_pair").notNull(), // BTC/USDT, ETH/BTC, etc.
  isActive: boolean("is_active").default(false),
  config: jsonb("config").notNull(), // Strategy-specific parameters
  riskLimit: decimal("risk_limit", { precision: 12, scale: 2 }), // Max risk per trade
  dailyLimit: decimal("daily_limit", { precision: 12, scale: 2 }), // Max daily loss limit
  totalProfit: decimal("total_profit", { precision: 36, scale: 18 }).default("0"),
  totalLoss: decimal("total_loss", { precision: 36, scale: 18 }).default("0"),
  totalTrades: integer("total_trades").default(0),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0"),
  lastExecutionAt: timestamp("last_execution_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading bot executions (individual trades)
export const botExecutions = pgTable("bot_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").references(() => tradingBots.id).notNull(),
  strategy: tradingStrategyEnum("strategy").notNull(),
  status: botExecutionStatusEnum("status").default("pending"),
  entryPrice: decimal("entry_price", { precision: 36, scale: 18 }),
  exitPrice: decimal("exit_price", { precision: 36, scale: 18 }),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  profit: decimal("profit", { precision: 36, scale: 18 }),
  fees: decimal("fees", { precision: 36, scale: 18 }),
  slippage: decimal("slippage", { precision: 10, scale: 6 }), // Percentage
  orderId: text("order_id"), // Exchange order ID
  txHash: text("tx_hash"), // For DEX trades
  reason: text("reason"), // Entry/exit reason
  metadata: jsonb("metadata"), // Indicators, signals, etc.
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Armor Wallet integrations
export const armorWallets = pgTable("armor_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletType: text("wallet_type").notNull(), // standard, trading
  address: text("address").notNull().unique(),
  chains: jsonb("chains").notNull(), // Array of supported chains
  dailyLimit: decimal("daily_limit", { precision: 36, scale: 18 }),
  requiresTwoFa: boolean("requires_two_fa").default(false),
  armorApiKey: text("armor_api_key"), // Encrypted
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// MEV and mempool monitoring
export const mevEvents = pgTable("mev_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  eventType: text("event_type").notNull(), // sandwich, frontrun, backrun, arbitrage
  network: networkEnum("network").notNull(),
  txHash: text("tx_hash"),
  targetTxHash: text("target_tx_hash"), // The transaction being MEV'd
  profitAmount: decimal("profit_amount", { precision: 36, scale: 18 }),
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }), // 0-100
  isProtected: boolean("is_protected").default(false),
  protectionMethod: text("protection_method"), // private_relayer, etc.
  metadata: jsonb("metadata"),
  detectedAt: timestamp("detected_at").defaultNow(),
});

// Exchange platform for coin procurement
export const orderTypeEnum = pgEnum("order_type", ["market", "limit", "stop_loss", "stop_limit"]);
export const orderSideEnum = pgEnum("order_side", ["buy", "sell"]);
export const orderStatusEnum = pgEnum("order_status", ["open", "partially_filled", "filled", "cancelled", "expired"]);

export const exchangeOrders = pgTable("exchange_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orderType: orderTypeEnum("order_type").notNull(),
  orderSide: orderSideEnum("order_side").notNull(),
  tradingPair: text("trading_pair").notNull(), // BTC/USDT, ETH/USDT
  price: decimal("price", { precision: 36, scale: 18 }),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  filled: decimal("filled", { precision: 36, scale: 18 }).default("0"),
  status: orderStatusEnum("status").default("open"),
  total: decimal("total", { precision: 36, scale: 18 }),
  fees: decimal("fees", { precision: 36, scale: 18 }),
  network: networkEnum("network").notNull(),
  externalOrderId: text("external_order_id"), // Exchange order ID
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const liquidityPools = pgTable("liquidity_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  poolName: text("pool_name").notNull(),
  tokenA: text("token_a").notNull(), // Token symbol
  tokenB: text("token_b").notNull(),
  reserveA: decimal("reserve_a", { precision: 36, scale: 18 }).default("0"),
  reserveB: decimal("reserve_b", { precision: 36, scale: 18 }).default("0"),
  lpTokens: decimal("lp_tokens", { precision: 36, scale: 18 }).default("0"),
  apy: decimal("apy", { precision: 10, scale: 4 }), // Annual percentage yield
  network: networkEnum("network").notNull(),
  contractAddress: text("contract_address").notNull(),
  totalValueLocked: decimal("total_value_locked", { precision: 36, scale: 18 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coin mixing service for privacy
export const mixingStatusEnum = pgEnum("mixing_status", ["pending", "mixing", "completed", "failed"]);

export const mixingRequests = pgTable("mixing_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  inputAddress: text("input_address").notNull(),
  outputAddress: text("output_address").notNull(),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  currency: text("currency").notNull(), // BTC, ETH, etc.
  mixingFee: decimal("mixing_fee", { precision: 36, scale: 18 }),
  delayMinutes: integer("delay_minutes").default(30), // Mixing delay for privacy
  status: mixingStatusEnum("status").default("pending"),
  inputTxHash: text("input_tx_hash"),
  outputTxHash: text("output_tx_hash"),
  mixingRounds: integer("mixing_rounds").default(3), // Number of mixing iterations
  privacyScore: decimal("privacy_score", { precision: 5, scale: 2 }), // 0-100
  network: networkEnum("network").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// VIP Community and Forum
export const forumCategories = pgTable("forum_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // Lucide icon name
  order: integer("order").default(0),
  isVipOnly: boolean("is_vip_only").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumThreads = pgTable("forum_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => forumCategories.id).notNull(),
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

// AI Chat Automator
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  agentType: text("agent_type"), // Which AI agent is handling this
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id).notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  agentName: text("agent_name"), // Which specific agent responded
  metadata: jsonb("metadata"), // Citations, tool calls, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Metals and Gold Trading
export const metalTypeEnum = pgEnum("metal_type", ["gold", "silver", "platinum", "palladium", "copper"]);
export const metalTradeStatusEnum = pgEnum("metal_trade_status", ["pending", "confirmed", "shipped", "delivered", "cancelled"]);

export const metalInventory = pgTable("metal_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metalType: metalTypeEnum("metal_type").notNull(),
  weight: decimal("weight", { precision: 12, scale: 4 }).notNull(), // Troy ounces
  purity: decimal("purity", { precision: 5, scale: 2 }).default("99.99"), // Percentage
  pricePerOunce: decimal("price_per_ounce", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }),
  supplier: text("supplier"),
  vaultLocation: text("vault_location"),
  certificateUrl: text("certificate_url"), // Authenticity certificate
  isAvailable: boolean("is_available").default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const metalTrades = pgTable("metal_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  inventoryId: varchar("inventory_id").references(() => metalInventory.id).notNull(),
  tradeType: text("trade_type").notNull(), // buy, sell
  weight: decimal("weight", { precision: 12, scale: 4 }).notNull(),
  pricePerOunce: decimal("price_per_ounce", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  status: metalTradeStatusEnum("status").default("pending"),
  paymentMethod: text("payment_method"), // crypto, fiat
  deliveryAddress: text("delivery_address"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

// Precious Metals Exchange - Crypto to Physical conversion
export const metalFormEnum = pgEnum("metal_form", ["bar", "coin", "round"]);
export const ownershipLocationEnum = pgEnum("ownership_location", ["vault", "delivery_pending", "delivered"]);

export const metalProducts = pgTable("metal_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metal: metalTypeEnum("metal").notNull(),
  weight: decimal("weight", { precision: 12, scale: 4 }).notNull(), // Troy ounces
  form: metalFormEnum("form").notNull(),
  productName: text("product_name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  premium: decimal("premium", { precision: 5, scale: 2 }).default("5.00"), // Percentage over spot
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
  cryptoPaymentTx: text("crypto_payment_tx"), // Transaction hash of crypto payment
  certificateUrl: text("certificate_url"),
  deliveryAddress: text("delivery_address"),
  trackingNumber: text("tracking_number"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

// Blog and News Section
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  category: text("category"), // Trading, DeFi, Kingdom, Ministry, exchange_update, platform_news, market_analysis
  tags: jsonb("tags"),
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
  parentCommentId: varchar("parent_comment_id"),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// KINGDOM TRANSFORMATION - NEW FEATURES
// ============================================

// Dynamic Dashboard System
export const userDashboardConfigs = pgTable("user_dashboard_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  layout: jsonb("layout").notNull(), // Grid layout configuration
  theme: text("theme").default("dark"),
  preferences: jsonb("preferences"), // Widget visibility, sizes, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // stats, chart, quick-action, news-feed, etc.
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
  position: jsonb("position").notNull(), // { x, y, w, h }
  config: jsonb("config"), // Widget-specific settings
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userWidgetUnique: unique().on(table.userId, table.widgetId),
}));

// Admin Panel Infrastructure
export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "admin", "moderator", "support"]);

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  role: adminRoleEnum("role").notNull(),
  permissions: jsonb("permissions"), // Specific permissions
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id).notNull(),
  action: text("action").notNull(), // user_banned, post_deleted, etc.
  targetType: text("target_type"), // user, post, transaction
  targetId: varchar("target_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminBroadcasts = pgTable("admin_broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id).notNull(),
  recipientType: text("recipient_type").notNull(), // all, specific_users, user_group
  recipientIds: jsonb("recipient_ids"), // If specific users
  message: text("message").notNull(),
  title: text("title"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  sentAt: timestamp("sent_at").defaultNow(),
});

// Individual Assets & Ethereal Elements
export const assetTypeEnum = pgEnum("asset_type", ["crypto", "stock", "bond", "real_estate", "ethereal", "precious_metal", "collectible"]);

export const individualAssets = pgTable("individual_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  assetType: assetTypeEnum("asset_type").notNull(),
  marketValue: decimal("market_value", { precision: 36, scale: 18 }).notNull(),
  purchasePrice: decimal("purchase_price", { precision: 36, scale: 18 }),
  quantity: decimal("quantity", { precision: 36, scale: 8 }).default("1"),
  metadata: jsonb("metadata"), // Asset-specific data
  imageUrl: text("image_url"),
  certificateUrl: text("certificate_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const etherealElements = pgTable("ethereal_elements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  elementType: text("element_type").notNull(), // spiritual, divine, quantum, dimensional
  power: integer("power").default(0), // Power level 0-1000
  rarity: text("rarity").notNull(), // common, rare, epic, legendary, divine
  attributes: jsonb("attributes"), // Special properties
  imageUrl: text("image_url"),
  animationUrl: text("animation_url"),
  totalSupply: integer("total_supply"),
  mintedCount: integer("minted_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const etherealOwnership = pgTable("ethereal_ownership", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  elementId: varchar("element_id").references(() => etherealElements.id).notNull(),
  quantity: integer("quantity").default(1),
  acquiredAt: timestamp("acquired_at").defaultNow(),
}, (table) => ({
  userElementUnique: unique().on(table.userId, table.elementId),
}));

// Bot Marketplace System
export const botListingStatusEnum = pgEnum("bot_listing_status", ["active", "paused", "sold_out", "inactive"]);

export const botMarketplaceListings = pgTable("bot_marketplace_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  botId: varchar("bot_id").references(() => tradingBots.id), // Reference if selling existing bot
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // trading, research, automation, etc.
  price: decimal("price", { precision: 12, scale: 2 }),
  rentalPriceHourly: decimal("rental_price_hourly", { precision: 12, scale: 2 }),
  rentalPriceDaily: decimal("rental_price_daily", { precision: 12, scale: 2 }),
  subscriptionPriceMonthly: decimal("subscription_price_monthly", { precision: 12, scale: 2 }),
  performanceMetrics: jsonb("performance_metrics"), // Win rate, ROI, etc.
  features: jsonb("features"),
  images: jsonb("images"),
  status: botListingStatusEnum("status").default("active"),
  totalSales: integer("total_sales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const botRentals = pgTable("bot_rentals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  renterId: varchar("renter_id").references(() => users.id).notNull(),
  listingId: varchar("listing_id").references(() => botMarketplaceListings.id).notNull(),
  rentalType: text("rental_type").notNull(), // hourly, daily, weekly
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const botSubscriptions = pgTable("bot_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").references(() => users.id).notNull(),
  listingId: varchar("listing_id").references(() => botMarketplaceListings.id).notNull(),
  plan: text("plan").notNull(), // basic, pro, enterprise
  monthlyPrice: decimal("monthly_price", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("active"), // active, cancelled, paused
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const botReviews = pgTable("bot_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").references(() => users.id).notNull(),
  listingId: varchar("listing_id").references(() => botMarketplaceListings.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content").notNull(),
  performanceRating: integer("performance_rating"), // 1-5
  supportRating: integer("support_rating"), // 1-5
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bot Learning & Training System
export const botLearningSession = pgTable("bot_learning_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").references(() => tradingBots.id).notNull(),
  sessionType: text("session_type").notNull(), // supervised, reinforcement, transfer
  trainingDataset: text("training_dataset"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  status: text("status").default("training"), // training, completed, failed
  performanceBefore: jsonb("performance_before"),
  performanceAfter: jsonb("performance_after"),
  improvementRate: decimal("improvement_rate", { precision: 5, scale: 2 }),
});

export const botTrainingData = pgTable("bot_training_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").references(() => tradingBots.id).notNull(),
  dataType: text("data_type").notNull(), // market_data, user_feedback, strategy_result
  input: jsonb("input").notNull(),
  expectedOutput: jsonb("expected_output"),
  actualOutput: jsonb("actual_output"),
  reward: decimal("reward", { precision: 10, scale: 4 }), // For reinforcement learning
  createdAt: timestamp("created_at").defaultNow(),
});

export const botSkills = pgTable("bot_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").references(() => tradingBots.id).notNull(),
  skillName: text("skill_name").notNull(),
  skillLevel: integer("skill_level").default(0), // 0-100
  category: text("category"), // analysis, execution, risk_management, etc.
  experiencePoints: integer("experience_points").default(0),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

// Broker Integration System (Alpaca, etc.)
export const brokerProviderEnum = pgEnum("broker_provider", ["alpaca", "interactive_brokers", "td_ameritrade", "binance", "bybit"]);
export const brokerAccountStatusEnum = pgEnum("broker_account_status", ["active", "inactive", "suspended", "pending_verification"]);

export const brokerAccounts = pgTable("broker_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: brokerProviderEnum("provider").notNull(),
  accountType: text("account_type").notNull(), // paper, live
  apiKeyEncrypted: text("api_key_encrypted").notNull(),
  apiSecretEncrypted: text("api_secret_encrypted").notNull(),
  accountId: text("account_id"), // External broker account ID
  status: brokerAccountStatusEnum("status").default("active"),
  buyingPower: decimal("buying_power", { precision: 36, scale: 18 }).default("0"),
  cashBalance: decimal("cash_balance", { precision: 36, scale: 18 }).default("0"),
  portfolioValue: decimal("portfolio_value", { precision: 36, scale: 18 }).default("0"),
  lastSyncAt: timestamp("last_sync_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brokerOrderTypeEnum = pgEnum("broker_order_type", ["market", "limit", "stop", "stop_limit", "trailing_stop"]);
export const brokerOrderSideEnum = pgEnum("broker_order_side", ["buy", "sell"]);
export const brokerOrderStatusEnum = pgEnum("broker_order_status", ["pending", "submitted", "filled", "partially_filled", "cancelled", "rejected", "expired"]);
export const brokerOrderTimeInForceEnum = pgEnum("broker_order_time_in_force", ["day", "gtc", "ioc", "fok"]);

export const brokerOrders = pgTable("broker_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brokerAccountId: varchar("broker_account_id").references(() => brokerAccounts.id).notNull(),
  botId: varchar("bot_id").references(() => tradingBots.id),
  botExecutionId: varchar("bot_execution_id").references(() => botExecutions.id),
  externalOrderId: text("external_order_id").unique(),
  symbol: text("symbol").notNull(),
  orderType: brokerOrderTypeEnum("order_type").notNull(),
  orderSide: brokerOrderSideEnum("order_side").notNull(),
  timeInForce: brokerOrderTimeInForceEnum("time_in_force").default("day"),
  quantity: decimal("quantity", { precision: 36, scale: 8 }).notNull(),
  limitPrice: decimal("limit_price", { precision: 36, scale: 8 }),
  stopPrice: decimal("stop_price", { precision: 36, scale: 8 }),
  filledQuantity: decimal("filled_quantity", { precision: 36, scale: 8 }).default("0"),
  filledAvgPrice: decimal("filled_avg_price", { precision: 36, scale: 8 }),
  status: brokerOrderStatusEnum("status").default("pending"),
  fees: decimal("fees", { precision: 36, scale: 8 }),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  filledAt: timestamp("filled_at"),
  cancelledAt: timestamp("cancelled_at"),
});

export const brokerPositions = pgTable("broker_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brokerAccountId: varchar("broker_account_id").references(() => brokerAccounts.id).notNull(),
  symbol: text("symbol").notNull(),
  quantity: decimal("quantity", { precision: 36, scale: 8 }).notNull(),
  averageEntryPrice: decimal("average_entry_price", { precision: 36, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 36, scale: 8 }),
  marketValue: decimal("market_value", { precision: 36, scale: 18 }),
  unrealizedPL: decimal("unrealized_pl", { precision: 36, scale: 18 }),
  unrealizedPLPercent: decimal("unrealized_pl_percent", { precision: 10, scale: 4 }),
  costBasis: decimal("cost_basis", { precision: 36, scale: 18 }),
  side: text("side").notNull(), // long, short
  metadata: jsonb("metadata"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
}, (table) => ({
  brokerSymbolUnique: unique().on(table.brokerAccountId, table.symbol),
}));

// Celebrity Fan Platform (TWinn System)
export const celebrityProfiles = pgTable("celebrity_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  stageName: text("stage_name").notNull(),
  bio: text("bio"),
  category: text("category"), // musician, athlete, influencer, etc.
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  followerCount: integer("follower_count").default(0),
  totalStaked: decimal("total_staked", { precision: 36, scale: 18 }).default("0"),
  profileImage: text("profile_image"),
  coverImage: text("cover_image"),
  socialLinks: jsonb("social_links"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fanFollows = pgTable("fan_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  celebrityId: varchar("celebrity_id").references(() => celebrityProfiles.id).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  followedAt: timestamp("followed_at").defaultNow(),
}, (table) => ({
  fanCelebrityUnique: unique().on(table.fanId, table.celebrityId),
}));

export const fanStakes = pgTable("fan_stakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  celebrityId: varchar("celebrity_id").references(() => celebrityProfiles.id).notNull(),
  amountStaked: decimal("amount_staked", { precision: 36, scale: 18 }).notNull(),
  currency: text("currency").default("USDT"),
  stakingPeriod: integer("staking_period"), // Days
  expectedReturn: decimal("expected_return", { precision: 10, scale: 4 }), // Percentage
  actualReturn: decimal("actual_return", { precision: 36, scale: 18 }),
  status: text("status").default("active"), // active, completed, withdrawn
  stakedAt: timestamp("staked_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const fanBets = pgTable("fan_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  celebrityId: varchar("celebrity_id").references(() => celebrityProfiles.id).notNull(),
  betType: text("bet_type").notNull(), // achievement, milestone, event_outcome
  description: text("description").notNull(),
  amountBet: decimal("amount_bet", { precision: 36, scale: 18 }).notNull(),
  odds: decimal("odds", { precision: 10, scale: 4 }).notNull(),
  potentialPayout: decimal("potential_payout", { precision: 36, scale: 18 }),
  actualPayout: decimal("actual_payout", { precision: 36, scale: 18 }),
  status: text("status").default("pending"), // pending, won, lost, cancelled
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const predictionMarkets = pgTable("prediction_markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  celebrityId: varchar("celebrity_id").references(() => celebrityProfiles.id),
  question: text("question").notNull(),
  description: text("description"),
  outcomes: jsonb("outcomes").notNull(), // Possible outcomes
  totalPool: decimal("total_pool", { precision: 36, scale: 18 }).default("0"),
  resolutionCriteria: text("resolution_criteria").notNull(),
  resolvedOutcome: text("resolved_outcome"),
  status: text("status").default("open"), // open, closed, resolved
  closesAt: timestamp("closes_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const celebrityContent = pgTable("celebrity_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  celebrityId: varchar("celebrity_id").references(() => celebrityProfiles.id).notNull(),
  contentType: text("content_type").notNull(), // post, video, audio, exclusive
  title: text("title").notNull(),
  content: text("content"),
  mediaUrl: text("media_url"),
  isExclusive: boolean("is_exclusive").default(false),
  accessLevel: text("access_level").default("public"), // public, followers, stakers, premium
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  publishedAt: timestamp("published_at").defaultNow(),
});

// Hit System & Analytics
export const hitAnalytics = pgTable("hit_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  eventType: text("event_type").notNull(), // page_view, click, form_submit, etc.
  eventCategory: text("event_category"),
  eventLabel: text("event_label"),
  eventValue: text("event_value"),
  page: text("page"),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  country: text("country"),
  city: text("city"),
  device: text("device"), // mobile, tablet, desktop
  browser: text("browser"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userJourneys = pgTable("user_journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id").notNull(),
  path: jsonb("path").notNull(), // Array of pages visited
  events: jsonb("events"), // Key events in journey
  conversionGoal: text("conversion_goal"),
  converted: boolean("converted").default(false),
  duration: integer("duration"), // Session duration in seconds
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Help & Documentation System
export const helpArticles = pgTable("help_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(), // getting_started, features, troubleshooting, etc.
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  difficulty: text("difficulty").default("beginner"), // beginner, intermediate, advanced
  relatedArticles: jsonb("related_articles"),
  tags: jsonb("tags"),
  videoUrl: text("video_url"),
  isPublished: boolean("is_published").default(true),
  viewCount: integer("view_count").default(0),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const guideSteps = pgTable("guide_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => helpArticles.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  codeSnippet: text("code_snippet"),
  estimatedTime: integer("estimated_time"), // Minutes
  createdAt: timestamp("created_at").defaultNow(),
});

// Discord-Style Forum Enhancement
export const forumServers = pgTable("forum_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false),
  memberCount: integer("member_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumChannels = pgTable("forum_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").references(() => forumServers.id).notNull(),
  name: text("name").notNull(),
  type: text("type").default("text"), // text, voice, announcement
  topic: text("topic"),
  isPrivate: boolean("is_private").default(false),
  requiredRole: text("required_role"),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const channelMessages = pgTable("channel_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => forumChannels.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  isPinned: boolean("is_pinned").default(false),
  isEdited: boolean("is_edited").default(false),
  replyToId: varchar("reply_to_id"), // Self-reference
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
});

// Financial Services - Stocks, Forex, Bonds, Retirement
export const financialAssetTypeEnum = pgEnum("financial_asset_type", ["stock", "forex", "bond", "retirement_401k", "retirement_ira", "retirement_pension"]);
export const financialOrderTypeEnum = pgEnum("financial_order_type", ["buy", "sell"]);
export const financialOrderStatusEnum = pgEnum("financial_order_status", ["pending", "executed", "cancelled", "failed"]);

export const financialOrders = pgTable("financial_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  assetType: financialAssetTypeEnum("asset_type").notNull(),
  symbol: text("symbol").notNull(), // Stock ticker, forex pair, bond CUSIP, etc.
  orderType: financialOrderTypeEnum("order_type").notNull(),
  quantity: decimal("quantity", { precision: 36, scale: 18 }).notNull(),
  price: decimal("price", { precision: 36, scale: 18 }).notNull(),
  totalValue: decimal("total_value", { precision: 36, scale: 18 }).notNull(),
  status: financialOrderStatusEnum("status").default("pending"),
  metadata: jsonb("metadata"), // Additional order details
  createdAt: timestamp("created_at").defaultNow(),
  executedAt: timestamp("executed_at"),
});

export const financialHoldings = pgTable("financial_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  assetType: financialAssetTypeEnum("asset_type").notNull(),
  symbol: text("symbol").notNull(),
  quantity: decimal("quantity", { precision: 36, scale: 18 }).notNull(),
  averagePurchasePrice: decimal("average_purchase_price", { precision: 36, scale: 18 }).notNull(),
  currentValue: decimal("current_value", { precision: 36, scale: 18 }),
  totalInvested: decimal("total_invested", { precision: 36, scale: 18 }),
  profitLoss: decimal("profit_loss", { precision: 36, scale: 18 }),
  metadata: jsonb("metadata"), // Additional holding details (maturity date for bonds, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userAssetUnique: unique().on(table.userId, table.assetType, table.symbol),
}));

// Trading Bots Arsenal - System Memory
export const tradingSystemMemory = pgTable("trading_system_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").references(() => tradingBots.id).notNull(),
  memoryType: text("memory_type").notNull(), // pattern, strategy, market_condition
  memoryKey: text("memory_key").notNull(),
  memoryValue: jsonb("memory_value").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"), // 0-100
  usageCount: integer("usage_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0"),
  lastAccessed: timestamp("last_accessed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// INSERT SCHEMAS AND TYPES
// ============================================

export const insertUserSchema = createInsertSchema(users);
export const insertWalletSchema = createInsertSchema(wallets);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertNFTSchema = createInsertSchema(nfts);
export const insertTokenSchema = createInsertSchema(tokens);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertKYCRecordSchema = createInsertSchema(kycRecords);
export const insertExchangeOrderSchema = createInsertSchema(exchangeOrders);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertMetalTradeSchema = createInsertSchema(metalTrades);
export const insertForumThreadSchema = createInsertSchema(forumThreads);
export const insertForumReplySchema = createInsertSchema(forumReplies);
export const insertCryptoPaymentSchema = createInsertSchema(cryptoPayments);
export const insertBlogPostSchema = createInsertSchema(blogPosts);

// Type exports for frontend
export type User = typeof users.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type Nft = typeof nfts.$inferSelect;
export type ExchangeOrder = typeof exchangeOrders.$inferSelect;
export type LiquidityPool = typeof liquidityPools.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type MetalInventory = typeof metalInventory.$inferSelect;
export type MetalTrade = typeof metalTrades.$inferSelect;
export type ForumThread = typeof forumThreads.$inferSelect;
export type ForumReply = typeof forumReplies.$inferSelect;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type WalletConnectSession = typeof walletConnectSessions.$inferSelect;
export type JesusCartelRelease = typeof jesusCartelReleases.$inferSelect;
export type JesusCartelEvent = typeof jesusCartelEvents.$inferSelect;
export type TradingBot = typeof tradingBots.$inferSelect;
export type BotExecution = typeof botExecutions.$inferSelect;
export type BrokerAccount = typeof brokerAccounts.$inferSelect;
export type BrokerOrder = typeof brokerOrders.$inferSelect;
export type BrokerPosition = typeof brokerPositions.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type CelebrityProfile = typeof celebrityProfiles.$inferSelect;
export type FinancialOrder = typeof financialOrders.$inferSelect;
export type FinancialHolding = typeof financialHoldings.$inferSelect;
