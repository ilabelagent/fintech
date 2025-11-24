# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Valifi Fintech Platform** is a production-ready fintech application for banking, digital wallets, investments, payments, and financial services. The platform supports blockchain operations across 5 networks (Ethereum, Polygon, BSC, Arbitrum, Optimism), P2P trading, precious metals trading, and comprehensive financial services.

**Tech Stack:**
- **Backend:** Express.js + TypeScript, PostgreSQL (Neon), Drizzle ORM
- **Frontend:** React 18 + TypeScript, Vite, TailwindCSS, Shadcn/ui, Wouter routing, TanStack Query
- **Blockchain:** ethers.js v6 for multi-chain Web3 operations
- **Real-Time:** Socket.IO for WebSocket communication
- **Authentication:** JWT-based with bcrypt password hashing

## Development Commands

**Development Server:**
```bash
cd valifi && npm run dev
```
Runs the TypeScript server with hot reload on port 5000.

**Type Checking:**
```bash
cd valifi && npm run check
```
Runs TypeScript compiler in check mode without emitting files.

**Database Operations:**
```bash
cd valifi && npm run db:push
```
Push Drizzle schema changes to PostgreSQL database.

**Production Build:**
```bash
cd valifi && npm run build
```
Builds frontend (Vite) and bundles backend (esbuild) to `dist/` directory.

**Start Production Server:**
```bash
cd valifi && npm start
```
Runs the compiled production server from `dist/index.js`.

**Create Admin User:**
```bash
cd valifi && ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=your-secure-password npx tsx backend/src/scripts/createAdmin.ts --role=SuperAdmin
```

**Run Core Auth Tests:**
```bash
cd valifi && npx tsx scripts/verify-core.ts
```

## Architecture Overview

### Directory Structure
```
valifi/
├── backend/src/          # Express.js server
│   ├── index.ts          # Server entry point (port 5000)
│   ├── authService.ts    # JWT authentication
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database access layer
│   └── scripts/          # Admin utilities
├── frontend/src/         # React application
│   ├── App.tsx           # Main app with routing
│   ├── pages/            # Page components
│   ├── components/       # UI components (Shadcn/ui)
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities
├── shared/
│   └── schema.ts         # Drizzle ORM schema (49 tables)
└── drizzle/              # Database migrations
```

### Backend Architecture

**Entry Point:** `backend/src/index.ts`
- Express server on port 5000
- Serves both API and static frontend in production

**Authentication Flow:**
- `backend/src/authService.ts` - JWT-based auth with bcrypt
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login (returns JWT)
- POST `/api/auth/logout` - Logout acknowledgment
- JWT tokens expire in 1 hour
- `JWT_SECRET` must be 32+ characters

**Database Layer:**
- `backend/src/storage.ts` - Database access methods
- `backend/src/db.ts` - Drizzle connection setup
- `shared/schema.ts` - All table definitions

### Frontend Architecture

**Entry Point:** `frontend/src/main.tsx`
- React 18 with TanStack Query for data fetching
- Wouter for lightweight client-side routing
- Shadcn/ui component library with Radix UI primitives

**Routing:**
- Unauthenticated: `/` (Landing), `/login`
- Authenticated: Dashboard, Exchange, Financial Services, P2P Trading, Blockchain, etc.
- Admin access via `/admin` for users with `isAdmin: true`

**State Management:**
- TanStack Query for server state
- Local storage for JWT token (`authUtils.ts`)

### Database Schema (49 Tables)

**Location:** `shared/schema.ts`

**Major Table Groups:**
- **Core:** users, sessions
- **Blockchain:** wallets, transactions, nfts, tokens, smartContracts, walletConnectSessions
- **Trading:** exchangeOrders, liquidityPools, brokerAccounts, brokerOrders, brokerPositions
- **P2P:** p2pOffers, p2pOrders, p2pPaymentMethods, p2pChatMessages, p2pDisputes, p2pReviews
- **Payments:** payments, cryptoPayments
- **Precious Metals:** metalInventory, metalTrades, metalProducts, metalOwnership
- **Admin:** adminUsers, adminAuditLogs, adminBroadcasts
- **Community:** forumServers, forumChannels, forumThreads, chatSessions, chatMessages
- **Content:** blogPosts, helpArticles, articleComments

### External Service Integrations

**Blockchain (5 networks):**
- `backend/src/armorWalletService.ts` - Wallet operations
- Networks: Ethereum, Polygon, BSC, Arbitrum, Optimism

**Broker Integration:**
- `backend/src/alpacaBrokerService.ts` - Alpaca paper & live trading
- `backend/src/brokerIntegrationService.ts` - Multi-broker support

**Market Data:**
- `backend/src/marketDataService.ts` - Live market data with caching

**Payments:**
- `backend/src/cryptoProcessorService.ts` - Crypto payment processing

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `JWT_SECRET` - 32+ character secret for JWT signing
- `NODE_ENV` - "development" or "production"
- `PORT` - Server port (default: 5000)

Optional (for full features):
- `ALPACA_API_KEY`, `ALPACA_SECRET_KEY` - Alpaca trading
- `STRIPE_SECRET_KEY` - Stripe payments
- API keys for market data providers

## Key Patterns

**API Response Format:**
```typescript
// Success
res.json({ message: "Success", data: {...} });
// Error
res.status(400).json({ message: "Error description" });
```

**Authentication Middleware:**
```typescript
import { authenticateToken } from "./authService";
app.get("/api/protected", authenticateToken, handler);
```

**Database Queries:**
```typescript
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
```

## Troubleshooting

**Database Connection Issues:**
- Verify `DATABASE_URL` is set correctly
- Check Neon dashboard for connection status

**JWT Errors:**
- Ensure `JWT_SECRET` is at least 32 characters
- Check token expiration (1 hour default)

**Port Conflicts:**
- Default port is 5000
- Set `PORT` environment variable to change
