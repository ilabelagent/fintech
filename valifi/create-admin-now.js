const bcrypt = require('bcryptjs');
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

const email = process.env.ADMIN_EMAIL || 'admin@valifi.com';
const password = process.env.ADMIN_PASSWORD || 'Admin123!@#';

async function createAdmin() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log('Creating admin user...');
  console.log('Email:', email);

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Insert user
    const userResult = await sql`
      INSERT INTO users (email, password, first_name, last_name, is_admin, profile_image_url)
      VALUES (${email}, ${hashedPassword}, 'Admin', 'User', true, '')
      ON CONFLICT (email) DO UPDATE 
      SET is_admin = true, password = ${hashedPassword}
      RETURNING id, email, is_admin
    `;

    const user = userResult[0];
    console.log('✅ User created/updated:', user);

    // Insert admin user record
    const adminResult = await sql`
      INSERT INTO admin_users (user_id, role, permissions, is_active)
      VALUES (${user.id}, 'SuperAdmin', '["all"]', true)
      ON CONFLICT (user_id) DO UPDATE 
      SET role = 'SuperAdmin', permissions = '["all"]', is_active = true
      RETURNING *
    `;

    console.log('✅ Admin record created:', adminResult[0]);
    console.log('\n🎉 Admin user ready!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\nYou can now login at: http://localhost:5000/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

createAdmin().then(() => process.exit(0)).catch(() => process.exit(1));
