import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.POSTGRES_URL) {
    console.warn('POSTGRES_URL is not defined - falling back to empty string for build');
}

const sql = neon(process.env.POSTGRES_URL || "postgres://user:pass@host/db");
export const db = drizzle(sql, { schema });
