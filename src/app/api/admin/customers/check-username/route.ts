import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const excludeId = searchParams.get('excludeId');

        if (!username) {
            return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
        }

        let query;

        if (excludeId) {
            query = sql`SELECT id FROM customers WHERE LOWER(username) = LOWER(${username}) AND id != ${excludeId}`;
        } else {
            query = sql`SELECT id FROM customers WHERE LOWER(username) = LOWER(${username})`;
        }

        const existing = await query;

        if (existing.length > 0) {
            return NextResponse.json({ available: false });
        }

        return NextResponse.json({ available: true });
    } catch (error: any) {
        console.error('Error checking customer username:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
