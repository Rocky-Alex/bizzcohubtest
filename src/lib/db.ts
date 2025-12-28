import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.warn('⚠️ POSTGRES_URL or DATABASE_URL environment variable is not set! SQL queries will fail.');
}

export const sql = databaseUrl
    ? neon(databaseUrl)
    : ((strings: any, ...values: any[]) => {
        throw new Error('Database URL environment variable is not set');
    }) as any;

