import { pool } from './db';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Create KYC status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE kyc_status AS ENUM ('Not Started', 'Pending', 'Approved', 'Rejected', 'Resubmit Required');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create user role enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create activity type enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE activity_type AS ENUM (
          'login', 'logout', 'kyc_submitted', 'kyc_approved', 'kyc_rejected',
          'user_created', 'user_updated', 'user_deleted', 'role_changed',
          'transaction_created', 'asset_purchased', 'loan_applied', 
          'card_applied', 'settings_updated'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_photo_url TEXT,
        role user_role DEFAULT 'user',
        kyc_status kyc_status DEFAULT 'Not Started',
        kyc_rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Add kyc_status column if it doesn't exist (for existing tables)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN kyc_status kyc_status DEFAULT 'Not Started';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Add role column if it doesn't exist (for existing tables)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Create activity_logs table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id),
        actor_id VARCHAR REFERENCES users(id),
        activity_type activity_type NOT NULL,
        description TEXT,
        metadata JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create admin_permissions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_permissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR UNIQUE NOT NULL REFERENCES users(id),
        can_manage_users BOOLEAN DEFAULT true,
        can_approve_kyc BOOLEAN DEFAULT true,
        can_manage_transactions BOOLEAN DEFAULT false,
        can_view_logs BOOLEAN DEFAULT true,
        can_broadcast_messages BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create asset_type enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE asset_type AS ENUM ('Crypto', 'PreciousMetal', 'Fiat');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create asset_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE asset_status AS ENUM ('Active', 'Pending', 'Matured', 'Withdrawable', 'Withdrawn', 'Collateralized');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create payout_destination enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE payout_destination AS ENUM ('wallet', 'balance');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create transaction_type enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE transaction_type AS ENUM ('Deposit', 'Withdrawal', 'Trade', 'P2P', 'Loan Repayment', 'Exchange', 'Transfer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create transaction_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE transaction_status AS ENUM ('Completed', 'Pending', 'Failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create p2p_offer_type enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE p2p_offer_type AS ENUM ('BUY', 'SELL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create p2p_order_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE p2p_order_status AS ENUM ('Pending Payment', 'Payment Sent', 'Completed', 'Disputed', 'Auto-Cancelled', 'Cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create otc_task_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE otc_task_status AS ENUM ('Open', 'In Progress', 'Completed', 'Cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create otc_order_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE otc_order_status AS ENUM ('Claimed', 'Pending Proof', 'Under Review', 'Approved', 'Rejected', 'Paid');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create loan_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE loan_status AS ENUM ('Pending', 'Approved', 'Active', 'Repaid', 'Late', 'Defaulted', 'Rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create card_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE card_status AS ENUM ('Not Applied', 'Pending Approval', 'Approved', 'Frozen', 'Cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create card_type enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE card_type AS ENUM ('Virtual', 'Physical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create bank_account_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE bank_account_status AS ENUM ('Pending', 'Verified', 'Rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create two_factor_method enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE two_factor_method AS ENUM ('none', 'email', 'sms', 'authenticator');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create all missing tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        ticker VARCHAR(20) NOT NULL,
        type asset_type NOT NULL,
        balance NUMERIC(36, 18) DEFAULT 0,
        balance_in_escrow NUMERIC(36, 18) DEFAULT 0,
        value_usd NUMERIC(36, 2) DEFAULT 0,
        initial_investment NUMERIC(36, 2) DEFAULT 0,
        total_earnings NUMERIC(36, 2) DEFAULT 0,
        status asset_status DEFAULT 'Active',
        maturity_date TIMESTAMP WITH TIME ZONE,
        payout_destination payout_destination DEFAULT 'balance',
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        description VARCHAR(255) NOT NULL,
        amount_usd NUMERIC(36, 2) NOT NULL,
        status transaction_status DEFAULT 'Pending',
        type transaction_type NOT NULL,
        tx_hash TEXT,
        related_asset_id VARCHAR REFERENCES assets(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS p2p_offers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        type p2p_offer_type NOT NULL,
        asset_ticker VARCHAR(20) NOT NULL,
        fiat_currency VARCHAR(10) NOT NULL,
        price NUMERIC(36, 2) NOT NULL,
        available_amount NUMERIC(36, 18) NOT NULL,
        min_order NUMERIC(36, 2) NOT NULL,
        max_order NUMERIC(36, 2) NOT NULL,
        payment_time_limit_minutes INTEGER DEFAULT 30,
        terms TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS p2p_orders (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id VARCHAR NOT NULL REFERENCES p2p_offers(id),
        buyer_id VARCHAR NOT NULL REFERENCES users(id),
        seller_id VARCHAR NOT NULL REFERENCES users(id),
        status p2p_order_status DEFAULT 'Pending Payment',
        fiat_amount NUMERIC(36, 2) NOT NULL,
        crypto_amount NUMERIC(36, 18) NOT NULL,
        payment_method VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS p2p_chat_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR NOT NULL REFERENCES p2p_orders(id),
        sender_id VARCHAR NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS otc_tasks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id VARCHAR NOT NULL REFERENCES users(id),
        crypto_type VARCHAR(50) NOT NULL,
        amount NUMERIC(36, 18) NOT NULL,
        target_price NUMERIC(36, 2),
        commission_percentage NUMERIC(5, 2) NOT NULL,
        status otc_task_status DEFAULT 'Open',
        max_claimers INTEGER DEFAULT 1,
        current_claimers INTEGER DEFAULT 0,
        description TEXT,
        instructions TEXT,
        deposit_address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS otc_orders (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id VARCHAR NOT NULL REFERENCES otc_tasks(id),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        status otc_order_status DEFAULT 'Claimed',
        purchase_amount NUMERIC(36, 18),
        purchase_price NUMERIC(36, 2),
        commission_earned NUMERIC(36, 2),
        proof_of_purchase JSONB,
        transaction_hash TEXT,
        admin_notes TEXT,
        rejection_reason TEXT,
        claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        submitted_at TIMESTAMP WITH TIME ZONE,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
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
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS p2p_payment_methods (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        method_name VARCHAR(255) NOT NULL,
        details JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS p2p_reviews (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR NOT NULL REFERENCES p2p_orders(id),
        reviewer_id VARCHAR NOT NULL REFERENCES users(id),
        reviewed_user_id VARCHAR NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS loan_applications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        amount NUMERIC(36, 2) NOT NULL,
        term INTEGER NOT NULL,
        interest_rate NUMERIC(5, 2) NOT NULL,
        collateral_asset_id VARCHAR REFERENCES assets(id),
        contacts_file TEXT,
        status loan_status DEFAULT 'Pending',
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS exchange_orders (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        asset_ticker VARCHAR(20) NOT NULL,
        amount NUMERIC(36, 18) NOT NULL,
        price_usd NUMERIC(36, 2) NOT NULL,
        total_usd NUMERIC(36, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending_admin',
        bank_details JSONB,
        payment_proof TEXT,
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Check if admin user exists using raw SQL
    const result = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      ['admin@valifi.com']
    );
    
    if (result.rows.length === 0) {
      // Create admin user
      const adminPassword = 'Valifi2024!Admin';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await pool.query(
        `INSERT INTO users (email, password_hash, full_name, username, profile_photo_url, role, kyc_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['admin@valifi.com', hashedPassword, 'Valifi Administrator', 'admin', '', 'admin', 'Approved']
      );

      // Create admin permissions for the admin user
      const adminResult = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        ['admin@valifi.com']
      );
      
      if (adminResult.rows.length > 0) {
        await pool.query(
          `INSERT INTO admin_permissions (user_id, can_manage_users, can_approve_kyc, can_manage_transactions, can_view_logs, can_broadcast_messages)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id) DO NOTHING`,
          [adminResult.rows[0].id, true, true, true, true, true]
        );
      }

      console.log('✅ Admin user created');
      console.log('   Email: admin@valifi.com');
      console.log('   Password: Valifi2024!Admin');
      console.log('   ⚠️  Change password after first login!');
    } else {
      console.log('✅ Database already initialized');
    }

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    // Don't throw - allow app to start even if DB init fails
  }
}
