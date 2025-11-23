# Valifi Fintech Platform

A comprehensive standalone fintech application providing banking, investment, and financial services.

## Features

### Core Banking & Payments
- **Wallet Management**: Secure blockchain wallets with multi-chain support (Ethereum, Polygon, BSC, Arbitrum, Optimism)
- **Fiat Payments**: Stripe integration for seamless fiat transactions
- **Crypto Payments**: Support for multiple crypto payment processors (BitPay, Binance Pay, Bybit, KuCoin, Luno)
- **WalletConnect**: Connect with MetaMask, Trust Wallet, and other Web3 wallets

### Investment Services
- **Stocks & Bonds**: Trade traditional securities through integrated brokers (Alpaca)
- **Forex Trading**: Access foreign exchange markets
- **Precious Metals**: Buy, sell, and store gold, silver, platinum, and palladium
- **Retirement Accounts**: 401(k), IRA, and pension management
- **Cryptocurrency**: Trade and manage digital assets

### Exchange & Trading
- **Exchange Orders**: Market, limit, stop-loss, and advanced order types
- **Liquidity Pools**: Participate in DeFi liquidity provision
- **P2P Trading**: Peer-to-peer cryptocurrency exchange with escrow
- **MEV Protection**: Front-running and MEV attack detection

### Blockchain Features
- **NFT Marketplace**: Mint, buy, sell, and manage NFT collections
- **Smart Contracts**: Deploy and interact with ERC-20, ERC-721, ERC-1155 contracts
- **Multi-chain Support**: Seamless cross-chain transactions

### Security & Compliance
- **KYC Verification**: Integrated Sumsub verification
- **Armor Wallets**: Shamir's Secret Sharing for enhanced wallet security
- **Security Monitoring**: Real-time threat detection and alerts
- **Admin Controls**: Comprehensive admin dashboard with audit logs

### Community & Support
- **Forums**: Community discussion boards and threads
- **Live Chat**: Real-time customer support
- **News Feed**: Financial news and market updates
- **Analytics Dashboard**: Customizable widgets and insights

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (49 fintech tables)
- **Authentication**: Session-based with bcrypt
- **Blockchain**: ethers.js for Web3 interactions
- **Payment Processing**: Stripe, crypto payment processors
- **Real-time**: Socket.IO for WebSocket connections

## Project Structure

```
/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (26 fintech pages)
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and helpers
│   └── index.html
│
├── backend/           # Node.js backend application
│   └── src/
│       ├── routes.ts     # API endpoints
│       ├── db.ts         # Database connection
│       └── storage.ts    # Database access layer
│
├── shared/            # Shared schema and types
│   └── schema.ts      # Database schema (768 lines, 49 tables)
│
├── drizzle/           # Database migrations
│
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
└── drizzle.config.ts  # Database configuration
```

## Setup Instructions

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ilabelagent/valifi.git
   cd valifi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory (see `.env.example` for all available options):
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/valifi
   
   # Application
   NODE_ENV=development
   PORT=5000
   SESSION_SECRET=your-secure-session-secret
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # Blockchain (optional)
   INFURA_PROJECT_ID=your-infura-id
   ALCHEMY_API_KEY=your-alchemy-key
   
   # KYC (optional)
   SUMSUB_APP_TOKEN=your-sumsub-token
   SUMSUB_SECRET_KEY=your-sumsub-secret
   
   # Broker Integration (optional)
   ALPACA_API_KEY=your-alpaca-key
   ALPACA_SECRET_KEY=your-alpaca-secret
   ALPACA_BASE_URL=https://paper-api.alpaca.markets
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Database Schema

The database includes 49 core fintech tables organized into:
- **Core**: sessions, users
- **Blockchain**: wallets, transactions, armorWallets, walletConnectSessions
- **NFTs**: nfts, tokens, nftCollections, nftMints, smartContracts
- **Payments**: payments, cryptoPayments, kycRecords, securityEvents
- **P2P Trading**: p2pOffers, p2pOrders, p2pPaymentMethods, p2pChatMessages, p2pDisputes, p2pReviews
- **Exchange**: exchangeOrders, liquidityPools, mevEvents
- **Broker**: brokerAccounts, brokerOrders, brokerPositions, financialHoldings, financialOrders
- **Precious Metals**: metalInventory, metalTrades, metalProducts, metalOwnership
- **Admin**: adminUsers, adminAuditLogs, adminBroadcasts
- **Dashboard**: userDashboardConfigs, dashboardWidgets, userWidgetPreferences
- **Community**: forumServers, forumChannels, forumThreads, forumReplies
- **Support**: chatSessions, chatMessages, helpArticles, guideSteps
- **News**: blogPosts, articleComments

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Wallets
- `GET /api/wallets` - Get user wallets
- `POST /api/wallets` - Create new wallet
- `GET /api/wallets/:id` - Get wallet details
- `GET /api/wallets/:id/balance` - Get wallet balance

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:hash` - Get transaction status

### Payments
- `POST /api/payments/stripe/create` - Create Stripe payment
- `POST /api/payments/crypto/create` - Create crypto payment
- `GET /api/payments/:id` - Get payment status

### Trading
- `GET /api/exchange/orders` - Get user orders
- `POST /api/exchange/orders` - Place new order
- `DELETE /api/exchange/orders/:id` - Cancel order

### P2P
- `GET /api/p2p/offers` - Get P2P offers
- `POST /api/p2p/offers` - Create P2P offer
- `POST /api/p2p/orders` - Create P2P order
- `POST /api/p2p/orders/:id/pay` - Mark order as paid
- `POST /api/p2p/orders/:id/release` - Release escrow

## Security Best Practices

1. **Never commit sensitive keys** - Use environment variables
2. **Enable 2FA** for admin accounts
3. **Regular security audits** - Monitor security events dashboard
4. **Use Armor Wallets** for high-value assets
5. **Verify KYC** before enabling trading features

## Contributing

This is a standalone Valifi Fintech application. For enterprise deployments or custom features, contact the development team.

## License

MIT License - see LICENSE file for details

## Support

For support, please use the in-app chat feature or contact support@valifi.example.com

---

**Valifi** - Your Complete Fintech Solution
