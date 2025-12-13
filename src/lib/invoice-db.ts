import { neon } from '@neondatabase/serverless';

// Try to get a specific URL for invoices, otherwise fall back to the main one
const updatedDatabaseUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!updatedDatabaseUrl) {
    console.error('❌ INVOICE_DATABASE_URL, POSTGRES_URL or DATABASE_URL environment variable is not set!');
    throw new Error('Database URL environment variable is not set for Invoices');
}

console.log('✅ Initializing Invoice database connection...');
export const invoiceSql = neon(updatedDatabaseUrl);
