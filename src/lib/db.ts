import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.error('Please check your .env.local file or Vercel environment variables.');
    throw new Error('DATABASE_URL environment variable is not set');
}

console.log('✅ Initializing database connection...');
export const sql = neon(process.env.DATABASE_URL);
