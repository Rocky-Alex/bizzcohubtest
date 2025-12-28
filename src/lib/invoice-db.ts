import { neon } from '@neondatabase/serverless';

// Try to get a specific URL for invoices, otherwise fall back to the main one
const updatedDatabaseUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!updatedDatabaseUrl) {
    console.warn('⚠️ INVOICE_DATABASE_URL, POSTGRES_URL or DATABASE_URL is not set! SQL queries will fail.');
}

export const invoiceSql = updatedDatabaseUrl
    ? neon(updatedDatabaseUrl)
    : ((strings: any, ...values: any[]) => {
        console.warn('⚠️ Invoice SQL query ignored because Database URL is not set.');
        return Promise.resolve([]);
    }) as any;
