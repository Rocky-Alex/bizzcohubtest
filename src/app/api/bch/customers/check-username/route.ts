import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const excludeId = searchParams.get('excludeId');

        if (!username) {
            return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
        }

        let existing: any[] = [];

        if (excludeId) {
            existing = await sql`SELECT id FROM customers WHERE LOWER(username) = LOWER(${username}) AND id != ${excludeId}` as unknown as any[];
        } else {
            existing = await sql`SELECT id FROM customers WHERE LOWER(username) = LOWER(${username})` as unknown as any[];
        }

        if (existing.length > 0) {
            return NextResponse.json({ available: false });
        }

        return NextResponse.json({ available: true });
    } catch (error: unknown) {
        console.error('Error checking customer username:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
