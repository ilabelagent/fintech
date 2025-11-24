import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users } from '@shared/schema';

const connectionString = process.env.DATABASE_URL!;

async function setupDatabase() {
  console.log('Setting up database...');
  
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Create schema by executing the SQL directly
    console.log('Creating database schema...');
    
    // Since we don't have migrations, let's create the basic structure
    await db.execute(sql`
      -- Create ENUMs
      DO $$ BEGIN
        CREATE TYPE kyc_status AS ENUM ('Not Started', 'Pending', 'Approved', 'Rejected', 'Resubmit Required');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE two_factor_method AS ENUM ('none', 'email', 'sms', 'authenticator');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      -- Create users table
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

    console.log('Database schema created successfully!');

    // Create admin user
    console.log('Creating admin user...');
    const adminEmail = 'admin@valifi.com';
    const adminPassword = 'Admin123!@#';
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
      
      console.log('✅ Admin user created successfully!');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('   ⚠️  Please change this password after first login!');
    } else {
      console.log('Admin user already exists');
    }

  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

setupDatabase()
  .then(() => {
    console.log('Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to setup database:', error);
    process.exit(1);
  });
