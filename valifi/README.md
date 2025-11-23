# Valifi Fintech Platform

A comprehensive fintech application providing cryptocurrency exchange, P2P trading, digital banking, and financial services.

## Core Features

### Exchange Platform
- **Cryptocurrency Trading**: Buy and sell cryptocurrencies through admin-sourced procurement
- **Precious Metals Trading**: Invest in gold, silver, platinum, and palladium
- **Secure Transactions**: All trades are verified and processed securely

### P2P Trading
- **Peer-to-Peer Exchange**: Direct cryptocurrency trading between users
- **Escrow Protection**: Automatic escrow system for safe transactions
- **Multiple Payment Methods**: Support for bank transfers, mobile money, and local payment options
- **Dispute Resolution**: Built-in dispute handling for transaction issues

### Portfolio & Assets
- **Asset Management**: Track your cryptocurrency and precious metal holdings
- **Performance Tracking**: Monitor portfolio value and earnings over time
- **Multi-Asset Support**: Manage crypto assets and precious metals in one place

### Banking & Payments
- **Bank Account Linking**: Connect local and international bank accounts
- **Wire Transfers**: Support for domestic and international wire transfers
- **Payment Processing**: Seamless deposits and withdrawals
- **Multi-Currency Support**: Handle multiple fiat currencies

### Financial Services
- **Loans**: Apply for crypto-backed loans or personal credit
- **Valifi Card**: Virtual and physical debit cards linked to your balance
- **Flexible Terms**: Competitive rates and customizable repayment schedules

### Security & Compliance
- **KYC Verification**: Identity verification for regulatory compliance
- **Two-Factor Authentication**: Secure account access with 2FA
- **Transaction Monitoring**: Real-time security alerts and monitoring
- **Data Encryption**: End-to-end encryption for sensitive information

### Admin Panel
- **User Management**: Comprehensive user administration
- **Transaction Oversight**: Monitor and verify all platform transactions
- **Compliance Tools**: KYC review and approval workflows
- **Analytics**: Platform performance and user activity insights

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (18 fintech tables)
- **Authentication**: JWT-based with bcrypt password hashing
- **Real-time Updates**: Live transaction and market data updates

## Project Structure

```
valifi/
├── frontend/              # React frontend application
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components (11 fintech pages)
│       ├── hooks/         # Custom React hooks
│       └── lib/           # Utilities and helpers
│
├── backend/              # Node.js backend application
│   └── src/
│       ├── index.ts      # Server entry point
│       ├── authService.ts # Authentication logic
│       ├── storage.ts    # Database access layer
│       └── scripts/      # Admin and utility scripts
│
├── shared/               # Shared schema and types
│   └── schema.ts         # Database schema (18 core tables)
│
├── drizzle/              # Database migrations
└── package.json          # Dependencies
```

## Database Schema

The platform uses 18 core fintech tables:

1. **users** - User accounts and profiles
2. **user_settings** - User preferences and security settings
3. **active_sessions** - Login session tracking
4. **assets** - User cryptocurrency and precious metal holdings
5. **transactions** - All financial transactions
6. **p2p_offers** - P2P trading offers
7. **p2p_orders** - P2P trade orders
8. **p2p_chat_messages** - P2P order communication
9. **p2p_disputes** - Dispute resolution records
10. **p2p_payment_methods** - User payment methods
11. **p2p_reviews** - User ratings and reviews
12. **loan_applications** - Loan requests and status
13. **valifi_cards** - Virtual and physical card records
14. **bank_accounts** - Linked bank account information
15. **exchange_orders** - Exchange platform orders
16. **admin_users** - Administrator accounts
17. **admin_audit_logs** - Admin action logs
18. **kyc_records** - KYC verification documents

## Setup Instructions

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ilabelagent/fintech.git
   cd fintech/valifi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file or set environment variables:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/valifi
   
   # Authentication
   JWT_SECRET=your-secure-jwt-secret-min-32-chars
   
   # Application
   NODE_ENV=production
   PORT=5000
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Create Super Admin account**
   ```bash
   export ADMIN_EMAIL=your-email@example.com
   export ADMIN_PASSWORD=your-secure-password
   npx tsx backend/src/scripts/createAdmin.ts --role=SuperAdmin
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

7. **Access the platform**
   - Open your browser to `http://localhost:5000`
   - Login with Super Admin credentials

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Assets & Portfolio
- `GET /api/assets` - Get user assets
- `POST /api/assets` - Create new asset entry
- `GET /api/transactions` - Get transaction history

### P2P Trading
- `GET /api/p2p/offers` - List active offers
- `POST /api/p2p/offers` - Create new offer
- `POST /api/p2p/orders` - Place order
- `POST /api/p2p/orders/:id/release` - Release escrow

### Exchange
- `POST /api/exchange/orders` - Place exchange order
- `GET /api/exchange/orders` - Get user exchange orders

### KYC
- `POST /api/kyc/submit` - Submit KYC documents
- `GET /api/kyc/status` - Check KYC status

### Admin
- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/kyc/:id/approve` - Approve KYC (admin only)
- `POST /api/admin/kyc/:id/reject` - Reject KYC (admin only)

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 10 rounds for password security
- **Session Management**: Track and manage active user sessions
- **KYC Compliance**: Identity verification for regulatory requirements
- **Admin Audit Logs**: Complete audit trail of admin actions
- **Encrypted Sensitive Data**: Database-level encryption for sensitive fields

## License

Proprietary - All rights reserved

## Support

For technical support or business inquiries, contact the Valifi team.
