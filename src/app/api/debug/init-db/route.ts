
import { NextResponse } from 'next/server';
import migrate from '@/lib/migrate';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await migrate();
        return NextResponse.json({ message: 'Migration run successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
