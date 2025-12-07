import { NextRequest, NextResponse } from 'next/server';
import { imagekit } from '@/lib/imagekit';

export const dynamic = 'force-dynamic';

// GET /api/imagekit/test - Test ImageKit configuration
export async function GET(request: NextRequest) {
    try {
        // Check if environment variables are set
        const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

        const config = {
            publicKeySet: !!publicKey,
            privateKeySet: !!privateKey,
            urlEndpointSet: !!urlEndpoint,
            publicKey: publicKey ? `${publicKey.substring(0, 10)}...` : 'NOT SET',
            urlEndpoint: urlEndpoint || 'NOT SET',
        };

        // Try to get authentication parameters
        let authTest = { success: false, error: '' };
        try {
            const authParams = imagekit.getAuthenticationParameters();
            authTest = { success: true, error: '' };
        } catch (error: any) {
            authTest = { success: false, error: error.message };
        }

        const allConfigured = config.publicKeySet && config.privateKeySet && config.urlEndpointSet;

        return NextResponse.json({
            status: allConfigured ? 'configured' : 'not_configured',
            config,
            authTest,
            message: allConfigured
                ? '✅ ImageKit is properly configured!'
                : '❌ ImageKit is not properly configured. Check your .env.local file.',
        }, { status: 200 });

    } catch (error: any) {
        console.error('ImageKit test error:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: 'Failed to test ImageKit configuration',
                details: error.message
            },
            { status: 500 }
        );
    }
}
