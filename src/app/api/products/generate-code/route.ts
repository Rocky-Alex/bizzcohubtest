import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { sql } from '@/lib/db';

// GET /api/products/generate-code?type=laptop|accessory
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');

        if (!type || (type !== 'laptop' && type !== 'accessory')) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "laptop" or "accessory"' },
                { status: 400 }
            );
        }

        // Determine prefix based on type
        const prefix = type === 'laptop' ? 'BCH-LP' : 'BCH-AC';

        // Query database for the highest code across ALL products (both BCH-LP and BCH-AC)
        const result = await sql`
            SELECT code FROM products 
            WHERE code LIKE 'BCH-%'
            ORDER BY code DESC
            LIMIT 1
        ` as unknown as { code: string }[];

        let nextNumber = 1000; // Start from 1000

        if (result.length > 0) {
            const lastCode = result[0].code;
            // Extract the number part from the code (e.g., "BCH-LP-1005" -> "1005")
            const match = lastCode.match(/-(\d+)$/);
            if (match) {
                const lastNumber = parseInt(match[1], 10);
                nextNumber = lastNumber + 1;
            }
        }

        const newCode = `${prefix}-${nextNumber}`;

        return NextResponse.json({ code: newCode }, { status: 200 });
    } catch (error: any) {
        console.error('Error generating product code:', error);
        return NextResponse.json(
            { error: 'Failed to generate product code', details: error.message },
            { status: 500 }
        );
    }
}
