-- ============================================
-- VALIFI FINTECH PLATFORM - FULL REFACTOR MIGRATION
-- This script creates all new tables matching data-models.md
-- ============================================

-- Create all new enum types
CREATE TYPE kyc_status AS ENUM ('Not Started', 'Pending', 'Approved', 'Rejected', 'Resubmit Required');
CREATE TYPE asset_type AS ENUM ('Crypto', 'Stock', 'Cash', 'NFT', 'REIT', 'PreciousMetal');
CREATE TYPE asset_status AS ENUM ('Active', 'Pending', 'Matured', 'Withdrawable', 'Withdrawn', 'Collateralized');
CREATE TYPE payout_destination AS ENUM ('wallet', 'balance');
CREATE TYPE investment_action AS ENUM ('Buy', 'Reward', 'Withdrawal', 'Sell');
CREATE TYPE transaction_type AS ENUM ('Deposit', 'Withdrawal', 'Trade', 'P2P', 'Loan Repayment', 'ROI Payout', 'Maturity', 'Staking Reward');
CREATE TYPE transaction_status AS ENUM ('Completed', 'Pending', 'Failed');
CREATE TYPE p2p_offer_type AS ENUM ('BUY', 'SELL');
CREATE TYPE p2p_order_status AS ENUM ('Pending Payment', 'Payment Sent', 'Completed', 'Disputed', 'Auto-Cancelled', 'Cancelled');
CREATE TYPE loan_status AS ENUM ('Pending', 'Approved', 'Active', 'Repaid', 'Late', 'Defaulted', 'Rejected');
CREATE TYPE card_status AS ENUM ('Not Applied', 'Pending Approval', 'Approved', 'Frozen', 'Cancelled');
CREATE TYPE card_type AS ENUM ('Virtual', 'Physical');
CREATE TYPE bank_account_status AS ENUM ('Pending', 'Verified', 'Rejected');
CREATE TYPE two_factor_method AS ENUM ('none', 'email', 'sms', 'authenticator');

-- Update users table to match new spec (rename/add columns)
ALTER TABLE users 
  DROP COLUMN IF EXISTS first_name CASCADE,
  DROP COLUMN IF EXISTS last_name CASCADE,
  DROP COLUMN IF EXISTS is_admin CASCADE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Update existing users to have full_name and username
UPDATE users SET full_name = COALESCE(full_name, 'User'), username = COALESCE(username, CONCAT('user_', id)) WHERE full_name IS NULL OR username IS NULL;

ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- Rename password column
ALTER TABLE users RENAME COLUMN password TO password_hash;

-- Drop old kyc_status type and recreate
ALTER TABLE users ALTER COLUMN kyc_status DROP DEFAULT;
ALTER TABLE users ALTER COLUMN kyc_status TYPE TEXT;
DROP TYPE IF EXISTS kyc_status_old CASCADE;
ALTER TABLE users ALTER COLUMN kyc_status TYPE kyc_status USING kyc_status::kyc_status;
ALTER TABLE users ALTER COLUMN kyc_status SET DEFAULT 'Not Started';

-- Create new tables
CREATE TABLE IF NOT EXISTS user_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR UNIQUE NOT NULL REFERENCES users(id),
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method two_factor_method DEFAULT 'none',
  two_factor_secret TEXT,
  login_alerts BOOLEAN DEFAULT true,
  preferences JSONB,
  privacy JSONB,
  vault_recovery JSONB
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  device VARCHAR(255),
  location VARCHAR(255),
  ip_address INET,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  type asset_type NOT NULL,
  balance DECIMAL(36,18) DEFAULT 0,
  balance_in_escrow DECIMAL(36,18) DEFAULT 0,
  value_usd DECIMAL(36,2) DEFAULT 0,
  initial_investment DECIMAL(36,2) DEFAULT 0,
  total_earnings DECIMAL(36,2) DEFAULT 0,
  status asset_status DEFAULT 'Active',
  maturity_date TIMESTAMP WITH TIME ZONE,
  payout_destination payout_destination DEFAULT 'balance',
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investment_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id VARCHAR NOT NULL REFERENCES assets(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action investment_action NOT NULL,
  amount_usd DECIMAL(36,2) NOT NULL,
  status transaction_status DEFAULT 'Completed',
  reference_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description VARCHAR(255) NOT NULL,
  amount_usd DECIMAL(36,2) NOT NULL,
  status transaction_status DEFAULT 'Pending',
  type transaction_type NOT NULL,
  tx_hash TEXT,
  related_asset_id VARCHAR REFERENCES assets(id)
);

CREATE TABLE IF NOT EXISTS p2p_offers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  type p2p_offer_type NOT NULL,
  asset_ticker VARCHAR(20) NOT NULL,
  fiat_currency VARCHAR(10) NOT NULL,
  price DECIMAL(36,2) NOT NULL,
  available_amount DECIMAL(36,18) NOT NULL,
  min_order DECIMAL(36,2) NOT NULL,
  max_order DECIMAL(36,2) NOT NULL,
  payment_time_limit_minutes INTEGER DEFAULT 30,
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS p2p_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id VARCHAR NOT NULL REFERENCES p2p_offers(id),
  buyer_id VARCHAR NOT NULL REFERENCES users(id),
  seller_id VARCHAR NOT NULL REFERENCES users(id),
  status p2p_order_status DEFAULT 'Pending Payment',
  fiat_amount DECIMAL(36,2) NOT NULL,
  crypto_amount DECIMAL(36,18) NOT NULL,
  payment_method VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS p2p_chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES p2p_orders(id),
  sender_id VARCHAR NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS p2p_disputes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES p2p_orders(id),
  raised_by VARCHAR NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS p2p_payment_methods (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  method_name VARCHAR(255) NOT NULL,
  details JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS p2p_reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES p2p_orders(id),
  reviewer_id VARCHAR NOT NULL REFERENCES users(id),
  reviewed_user_id VARCHAR NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_applications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  amount DECIMAL(36,2) NOT NULL,
  term INTEGER NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  collateral_asset_id VARCHAR REFERENCES assets(id),
  contacts_file TEXT,
  status loan_status DEFAULT 'Pending',
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS valifi_cards (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  status card_status DEFAULT 'Not Applied',
  type card_type,
  currency VARCHAR(10),
  theme VARCHAR(50),
  card_number_hash VARCHAR(255),
  expiry TEXT,
  cvv_hash VARCHAR(255),
  is_frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  country_code VARCHAR(5) NOT NULL,
  nickname VARCHAR(255),
  details JSONB,
  status bank_account_status DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exchange_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  asset_ticker VARCHAR(20) NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  price_usd DECIMAL(36,2) NOT NULL,
  total_usd DECIMAL(36,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_admin',
  bank_details JSONB,
  payment_proof TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR UNIQUE NOT NULL REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'admin',
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id VARCHAR NOT NULL REFERENCES admin_users(id),
  action VARCHAR(255) NOT NULL,
  target_id VARCHAR(255),
  target_type VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kyc_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR UNIQUE NOT NULL REFERENCES users(id),
  document_type VARCHAR(100),
  document_urls JSONB,
  selfie_url TEXT,
  address_proof_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by VARCHAR REFERENCES admin_users(id),
  rejection_reason TEXT
);

-- Create initial Cash asset for Super Admin
INSERT INTO assets (user_id, name, ticker, type, balance, value_usd, status)
SELECT id, 'US Dollar', 'USD', 'Cash', 0, 0, 'Active'
FROM users WHERE email = 'iamiamiam14all@gmail.com'
ON CONFLICT DO NOTHING;

SELECT 'Migration completed - All new fintech tables created' as status;
