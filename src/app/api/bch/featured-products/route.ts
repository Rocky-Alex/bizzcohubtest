import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const getSql = () => {
    const dbUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Database configuration missing');
    return neon(dbUrl);
};

export async function GET(): Promise<NextResponse> {
    try {
        const sql = getSql();
        // Ensure table exists
        await sql`CREATE TABLE IF NOT EXISTS featured_products_config (
            slot_number INTEGER PRIMARY KEY,
            product_code TEXT
        )`;

        // Fetch slots joined with product details
        // UPDATED: Case-insensitive join, prioritizing Offer Price as requested
        const rows = await sql`
            SELECT 
                c.slot_number, 
                c.product_code,
                p.product_name,
                p.primary_image_url,
                p.base_price,
                p.offer_price,
                p.stock_quantity,
                p.id as product_id
            FROM featured_products_config c
            LEFT JOIN products p ON (
                TRIM(UPPER(p.product_code)) = TRIM(UPPER(c.product_code)) 
                OR p.id::text = c.product_code
            )
            ORDER BY c.slot_number ASC
        ` as unknown as any[];
        return NextResponse.json({ slots: rows });
    } catch (error: unknown) {
        console.error('Error fetching featured config:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const sql = getSql();
        const body = await req.json();
        const { slots } = body;

        await sql`CREATE TABLE IF NOT EXISTS featured_products_config (
            slot_number INTEGER PRIMARY KEY,
            product_code TEXT
        )`;

        await sql`DELETE FROM featured_products_config`;

        for (const slot of slots as { slot_number: number, product_code: string }[]) {
            // Trim whitespace to ensure clean matching
            if (slot.product_code && slot.product_code.trim() !== '') {
                await sql`INSERT INTO featured_products_config (slot_number, product_code) 
                          VALUES (${slot.slot_number}, ${slot.product_code.trim()})`;
            }
        }

        // Trigger validaton of the home page to ensure real-time update
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/');

        // Return success
        return NextResponse.json({ message: 'Configuration saved' });
    } catch (error: unknown) {
        console.error('Error saving featured config:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
