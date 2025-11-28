# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Valifi Fintech Platform** is a production-ready standalone fintech application providing banking, digital wallets, investments, payments, and financial services. The platform features multi-chain blockchain operations (Ethereum, Polygon, BSC, Arbitrum, Optimism), P2P trading, precious metals trading, and comprehensive financial services.

**Tech Stack:**

- **Backend:** Express.js + TypeScript, PostgreSQL (Neon), Drizzle ORM
- **Frontend:** React 18 + TypeScript, Vite, TailwindCSS, Shadcn/ui, Wouter routing, TanStack Query
- **Blockchain:** ethers.js v6 for multi-chain Web3 operations
- **Authentication:** JWT-based with bcrypt password hashing
- **Real-Time:** Socket.IO for WebSocket communication

**System Requirements:**

- Node.js 20+ (for TypeScript server)
- PostgreSQL 14+ (Neon cloud database recommended)
- npm package manager

## Development Commands

**Development Server:**

```bash
npm run dev
```

Runs the TypeScript server with hot reload on port 5000. Serves both API and frontend.

**Type Checking:**

```bash
npm run check
```

Runs TypeScript compiler in check mode without emitting files. Use this frequently to catch type errors.

**Database Operations:**

```bash
npm run db:push
```

Push Drizzle schema changes to PostgreSQL database. Schema file: `shared/schema.ts` (1399 lines, 81 tables).

**Testing:**

```bash
# Run all backend tests (Jest)
npm test

# Run frontend tests (Vitest)
npm run test:frontend

# Run core auth flow verification
npx tsx scripts/verify-core.ts
```

**Production Build:**

```bash
npm run build
```

Builds frontend (Vite) and bundles backend (esbuild) to `dist/` directory.

**Start Production Server:**

```bash
npm start
```

Runs the compiled production server from `dist/index.js`.

**Create Admin User:**

```bash
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=your-secure-password npx tsx backend/src/scripts/createAdmin.ts --role=SuperAdmin
```

Creates a Super Admin account with secure bcrypt password hashing.

## Architecture Overview

### Directory Structure

```
valifi/
├── backend/src/          # Express.js server
│   ├── index.ts          # Server entry point (port 5000)
│   ├── authService.ts    # JWT authentication with bcrypt
│   ├── routes.ts         # API endpoints (minimal auth routes)
│   ├── storage.ts        # Database access layer
│   ├── db.ts             # Drizzle connection setup
│   ├── vite.ts           # Vite dev server integration
│   ├── __tests__/        # Jest tests
│   ├── __mocks__/        # Test mocks
│   └── scripts/          # Admin utilities (createAdmin.ts)
├── frontend/src/         # React application
│   ├── App.tsx           # Main app with Wouter routing
│   ├── main.tsx          # React 18 entry point
│   ├── pages/            # Page components (~28 pages)
│   ├── components/       # UI components (Shadcn/ui)
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts    # Authentication hook
│   │   ├── use-toast.ts  # Toast notifications
│   │   └── use-mobile.tsx # Mobile detection
│   └── lib/              # Utilities
│       ├── authUtils.ts  # JWT token storage
│       ├── queryClient.ts # TanStack Query config
│       ├── storage.ts    # Local storage wrapper
│       └── walletConnect.ts # WalletConnect integration
├── shared/
│   └── schema.ts         # Drizzle ORM schema
├── drizzle/              # Database migrations
├── scripts/              # Utility scripts
│   └── verify-core.ts    # Core auth flow verification
├── public/               # Static assets
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── jest.config.js        # Jest test configuration
└── drizzle.config.ts     # Database configuration
```

### Backend Architecture

**Entry Point:** `backend/src/index.ts`

- Express server on port 5000 (configurable via `PORT` env var)
- Serves both API and static frontend in production
- Request logging middleware for API calls
- Error handling middleware

**Authentication Flow:**

- `backend/src/authService.ts` - JWT-based auth with bcrypt hashing
- POST `/api/auth/register` - User registration with password hashing
- POST `/api/auth/login` - User login (returns JWT token, 1 hour expiry)
- POST `/api/auth/logout` - Logout acknowledgment
- GET `/api/auth/user` - Get current authenticated user
- Middleware: `authenticateToken` - JWT verification for protected routes
- JWT tokens stored in `Authorization: Bearer <token>` header
- `JWT_SECRET` must be 32+ characters (environment variable)

**Database Layer:**

- `backend/src/storage.ts` - Database access methods (currently minimal for QA testing)
- `backend/src/db.ts` - Drizzle connection setup
- `shared/schema.ts` - All table definitions (81 tables)
- Drizzle ORM with PostgreSQL dialect

**API Routes (Minimal):**
Current implementation in `backend/src/routes.ts` includes:

- Authentication endpoints
- User management (`/api/auth/user`, `/api/wallets`)
- Admin endpoints (`/api/admin/*` - analytics, users, bots, audit logs)
- Dashboard endpoints (`/api/dashboard/*` - config, preferences)
- Health check (`/api/health`)

### Frontend Architecture

**Entry Point:** `frontend/src/main.tsx`

- React 18 with strict mode
- TanStack Query for server state management
- Wouter for lightweight client-side routing
- Shadcn/ui component library with Radix UI primitives
- TailwindCSS for styling

**Routing Pattern:**

- Unauthenticated routes: `/` (Landing), `/login`
- Authenticated routes: Protected by `useAuth` hook
- Layout: `<SidebarProvider>` with `<AppSidebar>` navigation
- Header with user info and logout button
- Route guard in `Router` component based on `isAuthenticated` state

**State Management:**

- TanStack Query for all server state (user data, wallets, etc.)
- Local storage for JWT token (`authUtils.ts`)
- No global state library - prefer React Query cache

**Key Pages:**
Dashboard, Exchange, Financial Services, P2P Trading, Stocks, Forex, Bonds, Retirement, Precious Metals, Blockchain, Security, Payments, KYC, Wallet Connect, Analytics Intelligence, Community, Chat, News, Admin.

### Database Schema (81 Tables, 1399 Lines)

**Location:** `shared/schema.ts`

**Design Patterns:**

- Schema-first approach with Drizzle ORM
- Enums for status tracking (kycStatus, transactionStatus, botStatus, etc.)
- Foreign key relationships with cascade rules
- Timestamp tracking (createdAt, updatedAt) via `timestamp().defaultNow()`
- JSONB columns for flexible schemas
- Composite unique constraints on join tables

**Major Table Groups:**

- **Core:** users, sessions
- **Blockchain:** wallets, transactions, nfts, tokens, smartContracts, walletConnectSessions, armorWallets
- **Trading:** exchangeOrders, liquidityPools, tradingBots, botLearningSession, botTrainingData, botSkills, tradingSystemMemory
- **Broker:** brokerAccounts, brokerOrders, brokerPositions, financialHoldings, financialOrders
- **P2P:** p2pOffers, p2pOrders, p2pPaymentMethods, p2pChatMessages, p2pDisputes, p2pReviews
- **Payments:** payments, cryptoPayments, kycRecords
- **Precious Metals:** metalInventory, metalTrades, metalProducts, metalOwnership
- **Admin:** adminUsers, adminAuditLogs, adminBroadcasts, agents, agentLogs
- **Dashboard:** userDashboardConfigs, dashboardWidgets, userWidgetPreferences
- **Community:** forumServers, forumChannels, forumThreads, forumReplies, forumMembers
- **Support:** chatSessions, chatMessages, helpArticles, guideSteps
- **News:** blogPosts, articleComments
- **Security:** securityEvents, mevEvents

**Database Configuration:** `drizzle.config.ts` points to `shared/schema.ts` with migrations in `./drizzle`.

### External Service Integrations

**Blockchain (5 networks):**

- `backend/src/armorWalletService.ts` - Shamir's Secret Sharing for secure wallets
- `backend/src/walletConnectService.ts` - WalletConnect integration
- Networks: Ethereum, Polygon, BSC, Arbitrum, Optimism
- Web3 library: ethers.js v6

**Trading & Broker:**

- `backend/src/alpacaBrokerService.ts` - Alpaca paper & live trading
- `backend/src/brokerIntegrationService.ts` - Multi-broker integration

**Market Data:**

- `backend/src/marketDataService.ts` - Live market data with caching
- `backend/src/marketDataService_enhanced.ts` - Enhanced market data service

**Payments:**

- `backend/src/cryptoProcessorService.ts` - Crypto payment processing
- Stripe integration for fiat payments

## Important Development Notes

### Environment Variables

Required:

- `DATABASE_URL` - PostgreSQL connection string (Neon recommended)
- `JWT_SECRET` - 32+ character secret for JWT signing
- `NODE_ENV` - "development" or "production"
- `PORT` - Server port (default: 5000)

Optional (for full features):

- `ALPACA_API_KEY`, `ALPACA_SECRET_KEY` - Alpaca trading
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` - Stripe payments
- `INFURA_PROJECT_ID`, `ALCHEMY_API_KEY` - Blockchain RPC providers
- `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY` - KYC verification

### Authentication Pattern

**Backend:**

```typescript
import { authenticateToken } from './authService';
app.get('/api/protected', authenticateToken, async (req: any, res) => {
  const userId = req.user.claims.sub; // Replit Auth compatible format
  // OR
  const userId = req.userId; // Direct format
});
```

**Frontend:**

```typescript
import { useAuth } from '@/hooks/useAuth';
const { user, isAuthenticated, isLoading } = useAuth();

// API calls with TanStack Query
import { useQuery } from '@tanstack/react-query';
const { data } = useQuery({
  queryKey: ['wallets'],
  queryFn: async () => {
    const token = storage.getToken();
    const res = await fetch('/api/wallets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
});
```

### Database Queries Pattern

```typescript
import { db } from './db';
import { users, wallets } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Select
const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

// Insert
const newWallet = await db
  .insert(wallets)
  .values({
    userId,
    network: 'ethereum',
    address: '0x...',
  })
  .returning();

// Update
const updated = await db
  .update(users)
  .set({ isAdmin: true })
  .where(eq(users.id, userId))
  .returning();

// Join
const userWallets = await db
  .select()
  .from(wallets)
  .leftJoin(users, eq(wallets.userId, users.id))
  .where(eq(users.email, email));
```

### Testing Guidelines

**Backend Tests (Jest):**

- Located in `backend/src/__tests__/`
- Use supertest for HTTP testing
- Mock database with `backend/src/__mocks__/`
- Run: `npm test`

**Frontend Tests (Vitest):**

- Setup: `frontend/src/setupTests.ts`
- Environment: jsdom
- Run: `npm run test:frontend`

**Auth Flow Verification:**

```bash
npx tsx scripts/verify-core.ts
```

Tests complete auth flow: register → login → authenticated data loading → logout → re-login.

### API Response Format

```typescript
// Success
res.json({ message: "Success", data: {...} });

// Error
res.status(400).json({ message: "Error description" });

// Paginated
res.json({ items: [...], total: 100 });
```

### TypeScript Path Aliases

```typescript
// Frontend
import { Button } from '@/components/ui/button';
import { users } from '@shared/schema';

// Backend
import { users } from '@shared/schema';
```

Configured in:

- `tsconfig.json` - `@/*` and `@shared/*` paths
- `vite.config.ts` - Frontend build aliases

## Common Development Tasks

### Adding a New API Endpoint

1. Define types in `shared/schema.ts` if database tables needed
2. Add database methods to `backend/src/storage.ts`
3. Add route handler to `backend/src/routes.ts`
4. Use `authenticateToken` middleware for protected routes
5. Add types to frontend and create TanStack Query hook

### Adding a New Page

1. Create page component in `frontend/src/pages/`
2. Add route to `frontend/src/App.tsx` in `<Switch>`
3. Add navigation link to `frontend/src/components/app-sidebar.tsx`
4. Protect route by placing inside authenticated router section

### Database Schema Changes

1. Edit `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Test with existing data to ensure no breaking changes
4. For production, create proper migration file in `drizzle/` directory

### Creating Admin Users

```bash
# Via script (recommended)
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD=SecurePassword123!
npx tsx backend/src/scripts/createAdmin.ts --role=SuperAdmin

# Verify creation
npx tsx scripts/verify-core.ts
```

## Troubleshooting

**Database Connection Issues:**

- Verify `DATABASE_URL` is set correctly
- Check Neon dashboard for connection status
- Test connection: `npx drizzle-kit studio`

**JWT Errors:**

- Ensure `JWT_SECRET` is at least 32 characters
- Check token expiration (1 hour default)
- Verify token is sent in `Authorization: Bearer <token>` header

**Port Conflicts:**

- Default port is 5000 (configurable via `PORT` env var)
- Frontend dev server runs on same port as backend
- Vite proxies API requests to Express in development

**Type Errors:**

- Run `npm run check` to see all TypeScript errors
- Common issue: Path aliases not resolving (check `tsconfig.json`)
- Frontend/backend share types via `@shared` alias

**Build Errors:**

- Frontend build: Check `vite.config.ts` configuration
- Backend build: Check `esbuild` config in `package.json`
- Clear cache: `rm -rf node_modules/.vite dist`
