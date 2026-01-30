import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.warn('⚠️ POSTGRES_URL or DATABASE_URL environment variable is not set! SQL queries will fail.');
}

const client = databaseUrl ? neon(databaseUrl) : null;

export const sql = client || ((strings: any, ...values: any[]) => {
    console.warn('⚠️ SQL query ignored because Database URL is not set.');
    return Promise.resolve([]);
}) as any;

export const db = drizzle(client || neon("postgres://user:pass@host/db"));

