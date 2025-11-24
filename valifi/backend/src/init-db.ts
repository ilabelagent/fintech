import { pool } from './db';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_photo_url TEXT,
        kyc_rejection_reason TEXT,
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
        `INSERT INTO users (email, password_hash, full_name, username, profile_photo_url)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@valifi.com', hashedPassword, 'Valifi Administrator', 'admin', '']
      );

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
