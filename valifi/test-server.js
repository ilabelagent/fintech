// Quick test to see if we can load the environment
require('dotenv/config');

console.log('Environment loaded successfully');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('ERROR: JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

console.log('All environment variables valid!');
