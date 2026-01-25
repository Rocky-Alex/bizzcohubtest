import { NextRequest, NextResponse } from 'next/server';
import { imagekit } from '@/lib/imagekit';

export const dynamic = 'force-dynamic';

// GET /api/imagekit/auth - Get authentication parameters for ImageKit client-side upload
export async function GET(request: NextRequest) {
    try {
        const authenticationParameters = imagekit.getAuthenticationParameters();

        return NextResponse.json(authenticationParameters, { status: 200 });
    } catch (error: any) {
        console.error('ImageKit auth error:', error);
        return NextResponse.json(
            { error: 'Failed to get authentication parameters', details: error.message },
            { status: 500 }
        );
    }
}
