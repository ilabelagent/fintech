# Valifi Fintech Platform

## Overview

Valifi is a comprehensive standalone fintech application providing banking, investment, and financial services. This platform enables users to manage digital wallets, trade securities, invest in precious metals, and access various financial products through a single integrated interface.

## Recent Changes (v3.0.0)

**Major Refactor (November 23, 2025)**: Complete transformation from multi-system monorepo to standalone banking and financial services application.

### What Changed

- Removed 7 major system folders (blue_elites, LIGHTNING_MIGRATION, agents, deployment, etc.)
- Removed ~13 non-fintech client pages (trading bots, celebrity platform, publishing, etc.)
- Removed ~27 non-fintech server services
- Cleaned database schema from 3,293 lines to ~1,100 lines
- Reorganized into clean `/backend/src` and `/frontend/src` structure
- Focused entirely on fintech core: banking, investments, trading, and financial services

See `CHANGELOG.md` and `REMOVAL_CANDIDATES.md` for complete details.

## User Preferences

Preferred communication style: Simple, everyday language.
Focus: Banking and financial services only - no mock data, production-ready code.

## System Architecture

### Frontend Architecture

**Framework & Styling**

- React 18 with TypeScript using Vite as the build tool
- TailwindCSS with custom design system inspired by Stripe and Coinbase
- Shadcn/ui component library (New York style) with Radix UI primitives
- Dark mode primary with optional light mode for trading views
- Custom color palette: divine gold accents (#FFD700), covenant blue, Kingdom standard theming

**State Management**

- TanStack Query (React Query) for server state and API caching
- Wouter for client-side routing (lightweight alternative to React Router)
- Custom hooks for authentication, mobile detection, and toast notifications

**UI Components**

- Complete Shadcn/ui component set: forms, dialogs, dropdowns, charts, calendars
- Custom sidebar navigation with collapsible groups
- Real-time WebSocket integration for live updates

### Backend Architecture

**Core Server**

- Express.js server with TypeScript
- Session management with PostgreSQL-backed session store
- Custom middleware for request logging and error handling

**API Architecture**

- RESTful endpoints organized by domain (wallets, transactions, NFTs, payments)
- Zod schema validation on all inputs
- Structured error handling with HTTP status codes
- Real-time updates via Socket.IO WebSocket service

### Data Storage Solutions

**Primary Database**

- PostgreSQL via Neon serverless database (@neondatabase/serverless)
- Drizzle ORM for type-safe database operations
- Schema-first approach with automated migrations

**Database Schema Design (49 tables)**

_Core Tables_

- Users table
- Wallets: multi-chain support with encrypted private key storage
- Transactions: blockchain transaction tracking with status enums
- NFTs & Tokens: ERC-721/ERC-20 contract tracking

_P2P Trading System_

- p2pOffers: User buy/sell crypto offers with payment methods and limits
- p2pOrders: Peer-to-peer trade orders with escrow, buyer/seller tracking
- p2pPaymentMethods: User payment method registry with verification status
- p2pChatMessages: Order-specific chat with attachments support
- p2pDisputes: Dispute resolution with admin oversight and evidence tracking
- p2pReviews: Post-trade rating system (1-5 stars)

_WalletConnect Sessions_

- walletConnectSessions: External wallet session management (MetaMask, Trust, Rainbow, Coinbase)

_Data Integrity Features_

- Composite unique constraints on all join tables to prevent duplicate relationships
- Foreign key relationships with cascade rules for data consistency
- Timestamp tracking for audit trails (createdAt, updatedAt)
- Status enums for workflow state management

**Session Storage**

- PostgreSQL sessions table
- Redis integration ready (configured but optional)

### Authentication & Authorization

**Authentication Strategy**

- Session-based auth with secure HTTP-only cookies
- JWT tokens for API authentication (infrastructure present)
- OAuth provider support (Google, GitHub, Twitter - configured)

**Security Measures**

- Encryption service using AES-256-GCM for sensitive data (private keys, mnemonics)
- User-specific encryption keys derived via PBKDF2
- Master encryption key requirement enforced at startup
- RBAC system with admin flags
- Multi-factor authentication support in schema

### External Service Integrations

**Blockchain Networks**

- Ethers.js v6 for Web3 interactions
- Multi-chain support: Ethereum, Polygon, BSC, Arbitrum, Optimism
- Network configurations with RPC endpoints and explorers
- Wallet generation with HD derivation paths
- Real on-chain balance queries and transaction submission

**Payment Systems (Complete Infrastructure)**

_Fiat Payments_ (3 processors)

- Stripe: cards, ACH, webhooks for real-time updates (`payments` table)
- PayPal SDK: orders, subscriptions, payouts
- Plaid: bank account linking and transfers

_Crypto Payments_ (5 processors + Direct Blockchain)

- BitPay: invoice generation with QR codes
- Binance Pay: merchant integration
- Bybit: crypto payment processing
- KuCoin Pay: order creation
- Luno: deposit/withdrawal APIs
- Direct Blockchain: Web3Service for ETH, ERC-20 transfers across 5 networks (`cryptoPayments` table)

_P2P Trading System_

- p2pOffers: User buy/sell crypto offers with payment methods
- p2pOrders: Peer-to-peer trade orders with escrow support
- p2pPaymentMethods: User payment method registry (bank_transfer, PayPal, Venmo, etc.)
- p2pChatMessages: Order-specific chat for buyer-seller communication
- p2pDisputes: Dispute resolution system with admin oversight
- p2pReviews: Post-trade rating system (1-5 stars)
- API: 18 endpoints for offers, orders, chat, disputes, reviews

_WalletConnect Integration_

- External wallet connection (MetaMask, Trust, Rainbow, Coinbase)
- Multi-network support via browser wallet injection
- Session management with database persistence (`walletConnectSessions` table)
- Network switching & transaction signing via `walletConnectService.ts`
- API: 4 endpoints for session management and wallet operations

**Trading & Market Data**

- Market data integrations: Polygon.io, Alpha Vantage, IEX Cloud
- Broker APIs: Alpaca (paper & live trading), Interactive Brokers Gateway

**AI & ML Services**

- Anthropic Claude (@anthropic-ai/sdk)
- Google Gemini (@google/genai)

**KYC & Compliance**

- Sumsub API: biometric verification, document scanning, liveness detection
- AML transaction monitoring
- Sanctions screening
- Automated compliance workflows

**Real-Time Infrastructure**

- Socket.IO WebSocket server for live updates
- Channel subscriptions: blockchain, payments, security
- Alchemy webhooks for blockchain event monitoring
- DEX aggregator price feeds

**Security & Monitoring**

- Immutable security event audit log
- Threat level classification: none, low, medium, high, critical
- Automated incident response workflows

**Development & Deployment**

- Vite dev server with HMR
- TypeScript strict mode with path aliases
- ESBuild for production bundling
- Environment-based configuration (development/production)