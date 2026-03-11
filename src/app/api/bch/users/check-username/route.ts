import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const excludeId = searchParams.get('excludeId');

        if (!username) {
            return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
        }

        const existing = await (excludeId
            ? sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND id != ${excludeId}`
            : sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username})`
        ) as unknown as { id: number }[];

        if (existing.length > 0) {
            return NextResponse.json({ available: false });
        }

        return NextResponse.json({ available: true });
    } catch (error: unknown) {
        console.error('Error checking username:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
