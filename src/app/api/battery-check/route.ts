import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory storage for reports (cleared on server restart)
// In production, use Redis or a Database.
const reportCache = new Map<string, string>();

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        if (!bodyText) {
            return NextResponse.json({ error: "Empty body" }, { status: 400 });
        }

        const id = uuidv4();
        reportCache.set(id, bodyText);

        return NextResponse.json({ id });
    } catch (error) {
        return NextResponse.json({ error: "Failed to process report" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !reportCache.has(id)) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const xmlData = reportCache.get(id);
    // Optional: Delete after read to be one-time use? 
    // reportCache.delete(id); 

    return NextResponse.json({ xmlData });
}
