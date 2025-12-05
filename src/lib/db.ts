import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ POSTGRES_URL or DATABASE_URL environment variable is not set!');
    console.error('Please check your .env file or environment variables.');
    throw new Error('Database URL environment variable is not set');
}

console.log('✅ Initializing database connection...');
export const sql = neon(databaseUrl);

