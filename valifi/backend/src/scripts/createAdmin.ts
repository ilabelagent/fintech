#!/usr/bin/env tsx

/**
 * VALIFI SUPER ADMIN PROVISIONING SCRIPT (SECURE)
 * 
 * Creates a Super Admin account with secure password hashing
 * 
 * SECURE USAGE:
 *   export ADMIN_EMAIL=your-email@example.com
 *   export ADMIN_PASSWORD=your-secure-password
 *   npx tsx backend/src/scripts/createAdmin.ts --role=SuperAdmin
 * 
 * ALTERNATIVE (prompts for password):
 *   npx tsx backend/src/scripts/createAdmin.ts --email=EMAIL --role=SuperAdmin
 */

import bcrypt from "bcryptjs";
import { db } from "../db";
import { users, adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

interface AdminConfig {
  email: string;
  password: string;
  role: string;
}

async function parseArgs(): Promise<AdminConfig> {
  const args = process.argv.slice(2);
  const config: Partial<AdminConfig> = {};

  // Parse CLI arguments
  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      config.email = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--role=')) {
      config.role = arg.split('=')[1];
    }
  }

  // Get email from env var if not provided
  if (!config.email) {
    config.email = process.env.ADMIN_EMAIL?.toLowerCase();
  }

  // SECURITY: Get password from environment variable ONLY
  config.password = process.env.ADMIN_PASSWORD;

  // Validate required fields
  if (!config.email) {
    console.error('❌ Missing admin email');
    console.error('Provide via: --email=EMAIL or ADMIN_EMAIL environment variable');
    process.exit(1);
  }

  if (!config.password) {
    console.error('❌ Missing admin password');
    console.error('SECURITY: Password must be provided via ADMIN_PASSWORD environment variable');
    console.error('Example: export ADMIN_PASSWORD=your-secure-password');
    process.exit(1);
  }

  if (!config.role) {
    console.error('❌ Missing admin role');
    console.error('Provide via: --role=SuperAdmin');
    process.exit(1);
  }

  return config as AdminConfig;
}

async function createSuperAdmin(config: AdminConfig) {
  try {
    console.log('═'.repeat(70));
    console.log('VALIFI SUPER ADMIN PROVISIONING');
    console.log('═'.repeat(70));
    console.log(`Email: ${config.email}`);
    console.log(`Role: ${config.role}`);
    console.log('═'.repeat(70));

    // Check if admin already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, config.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('\n⚠️  User already exists!');
      console.log(`User ID: ${existingUser[0].id}`);
      console.log(`Email: ${existingUser[0].email}`);
      
      // Check if admin record exists
      const adminRecord = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.userId, existingUser[0].id))
        .limit(1);
      
      if (adminRecord.length > 0) {
        console.log(`Admin Status: YES (${adminRecord[0].role})`);
        console.log('\n✅ Super Admin account already configured');
        return existingUser[0];
      } else {
        // Create admin record for existing user
        console.log('\n🔧 Promoting existing user to Super Admin...');
        await db
          .insert(adminUsers)
          .values({
            userId: existingUser[0].id,
            role: 'super_admin',
            permissions: {}
          });
        
        console.log('✅ User promoted to Super Admin');
        return existingUser[0];
      }
    }

    // Hash password securely with bcrypt
    console.log('\n🔐 Hashing password securely (bcrypt, 10 rounds)...');
    const passwordHash = await bcrypt.hash(config.password, 10);

    // Create new Super Admin user
    console.log('📝 Creating Super Admin account in database...');
    const newAdmin = await db
      .insert(users)
      .values({
        email: config.email,
        passwordHash: passwordHash,
        fullName: 'Super Admin',
        username: 'superadmin',
        profilePhotoUrl: '',
        kycStatus: 'Approved', // Super Admin is pre-approved
      })
      .returning();

    // Create admin record
    console.log('📝 Creating admin privileges record...');
    await db
      .insert(adminUsers)
      .values({
        userId: newAdmin[0].id,
        role: 'super_admin',
        permissions: {}
      });

    console.log('\n✅ SUPER ADMIN CREATED SUCCESSFULLY');
    console.log('═'.repeat(70));
    console.log(`User ID: ${newAdmin[0].id}`);
    console.log(`Email: ${newAdmin[0].email}`);
    console.log(`Full Name: ${newAdmin[0].fullName}`);
    console.log(`Username: ${newAdmin[0].username}`);
    console.log(`Admin Status: YES (super_admin)`);
    console.log(`KYC Status: ${newAdmin[0].kycStatus}`);
    console.log('═'.repeat(70));

    return newAdmin[0];
  } catch (error) {
    console.error('\n❌ ADMIN PROVISIONING FAILED');
    console.error('Error:', error);
    throw error;
  }
}

async function verifyAdminAccess(email: string, password: string) {
  console.log('\n🧪 VERIFYING ADMIN ACCESS...');
  
  try {
    // Fetch user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      throw new Error('User not found');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user[0].passwordHash!);
    if (!isValid) {
      throw new Error('Password verification failed');
    }

    console.log('✅ Password verification: PASSED');
    
    // Check admin record
    const adminRecord = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.userId, user[0].id))
      .limit(1);
    
    console.log('✅ Admin record verification: ' + (adminRecord.length > 0 ? 'PASSED' : 'FAILED'));
    
    if (adminRecord.length === 0) {
      throw new Error('User is not an admin');
    }

    console.log('\n✅ ADMIN ACCESS VERIFIED - READY FOR LOGIN');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    const config = await parseArgs();
    const admin = await createSuperAdmin(config);
    await verifyAdminAccess(config.email, config.password);
    
    console.log('\n🎉 SUPER ADMIN PROVISIONING COMPLETE');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${config.email}`);
    console.log(`   Password: [SECURELY HASHED IN DATABASE]`);
    console.log('\n✅ System ready for Super Admin login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error during admin provisioning');
    process.exit(1);
  }
})();
