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
