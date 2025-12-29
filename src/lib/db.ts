import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.warn('⚠️ POSTGRES_URL or DATABASE_URL environment variable is not set! SQL queries will fail.');
}

// Configure Neon with optimizations for performance
export const sql = databaseUrl
    ? neon(databaseUrl, {
        // Enable connection pooling for better performance
        fullResults: false, // Return only rows, not metadata (faster)
        fetchOptions: {
            // Enable caching for repeated queries
            cache: 'force-cache',
        },
    })
    : ((strings: any, ...values: any[]) => {
        console.warn('⚠️ SQL query ignored because Database URL is not set.');
        return Promise.resolve([]);
    }) as any;

