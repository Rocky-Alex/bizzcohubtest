import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
    try {
        const dbUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('Database configuration missing');
        const sql = neon(dbUrl);

        console.log('Adding "id" column to products table for compatibility...');

        // Add id column and make it serial if it doesn't exist
        // Note: Adding SERIAL to existing table can be tricky in some postgres versions, 
        // but often 'ADD COLUMN id SERIAL' works or 'ADD COLUMN id INTEGER GENERATED ALWAYS AS IDENTITY'.
        // Let's try standard SERIAL.
        try {
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS id SERIAL`;
        } catch (e: any) {
            console.log('Error adding id serial, trying integer + sequence', e.message);
            // Fallback if SERIAL shortcut fails on existing table
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS id INTEGER`;
            await sql`CREATE SEQUENCE IF NOT EXISTS products_id_seq`;
            await sql`ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq')`;
            // Update existing rows
            await sql`UPDATE products SET id = nextval('products_id_seq') WHERE id IS NULL`;
        }

        return NextResponse.json({ message: 'Added id column to products table' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
