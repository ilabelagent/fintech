import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users } from '@shared/schema';

async function pushSchema() {
  console.log('🔄 Pushing schema to database...');
  
  try {
    // Create all ENUMs
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS kyc_status AS ENUM ('Not Started', 'Pending', 'Approved', 'Rejected', 'Resubmit Required');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS asset_type AS ENUM ('Crypto', 'PreciousMetal', 'Fiat');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS asset_status AS ENUM ('Active', 'Pending', 'Matured', 'Withdrawable', 'Withdrawn', 'Collateralized');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS payout_destination AS ENUM ('wallet', 'balance');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS transaction_type AS ENUM ('Deposit', 'Withdrawal', 'Trade', 'P2P', 'Loan Repayment', 'Exchange', 'Transfer');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS transaction_status AS ENUM ('Completed', 'Pending', 'Failed');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS p2p_offer_type AS ENUM ('BUY', 'SELL');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS p2p_order_status AS ENUM ('Pending Payment', 'Payment Sent', 'Completed', 'Disputed', 'Auto-Cancelled', 'Cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS loan_status AS ENUM ('Pending', 'Approved', 'Active', 'Repaid', 'Late', 'Defaulted', 'Rejected');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS card_status AS ENUM ('Not Applied', 'Pending Approval', 'Approved', 'Frozen', 'Cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS card_type AS ENUM ('Virtual', 'Physical');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS bank_account_status AS ENUM ('Pending', 'Verified', 'Rejected');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE IF NOT EXISTS two_factor_method AS ENUM ('none', 'email', 'sms', 'authenticator');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ ENUMs created');

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_photo_url TEXT,
        kyc_status kyc_status DEFAULT 'Not Started',
        kyc_rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Users table created');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminEmail = 'admin@valifi.com';
    const adminPassword = 'Valifi2024!Admin';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await db.select().from(users).where(sql`email = ${adminEmail}`);
    
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Valifi Administrator',
        username: 'admin',
        profilePhotoUrl: '',
        kycStatus: 'Approved'
      });
      
      console.log('\n🎉 Database setup complete!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Admin Email:    admin@valifi.com');
      console.log('🔑 Admin Password: Valifi2024!Admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

pushSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
