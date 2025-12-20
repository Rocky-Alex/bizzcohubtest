import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const getSql = () => {
    const dbUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('Database configuration missing');
    }
    return neon(dbUrl);
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const prefix = searchParams.get('prefix') || 'LP'; // Default prefix provided by frontend logic

        const sql = getSql();

        // Query all product codes that follow the BCH-XX-YYYY format
        // We want the global maximum YYYY to ensure continuity across types if that's the requirement.
        // Or at least across 'LP' and 'AC'.

        // Let's assume we want to match BCH-%-% and find the max number at the end.
        const rows = await sql`
            SELECT product_code 
            FROM products 
            WHERE product_code LIKE 'BCH-%-%'
        `;

        let maxNum = 0;

        rows.forEach(row => {
            const parts = row.product_code.split('-');
            // Expected format: BCH, TYPE, NUMBER
            if (parts.length === 3) {
                const num = parseInt(parts[2], 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });

        // Initialize at 1000 if no codes found
        if (maxNum === 0) {
            maxNum = 999;
        }

        const nextNum = maxNum + 1;
        const nextCode = `BCH-${prefix}-${nextNum}`;

        return NextResponse.json({ code: nextCode, nextNumber: nextNum });

    } catch (error: any) {
        console.error('Error generating next product code:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
