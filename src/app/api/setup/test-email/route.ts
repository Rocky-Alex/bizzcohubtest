import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailConfig } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const isConfigured = await verifyEmailConfig();

        if (isConfigured) {
            return NextResponse.json({
                success: true,
                message: 'Email configuration is valid and ready to send emails',
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Email configuration is invalid. Please check your SMTP credentials in .env.local',
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Email test error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
