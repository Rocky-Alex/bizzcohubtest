import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const sessionToken = cookies().get('admin_session')?.value;
        const userRole = cookies().get('user_role')?.value;

        if (sessionToken) {
            return NextResponse.json({
                authenticated: true,
                role: userRole || 'accountant', // Default to accountant if missing
                message: 'Valid session'
            });
        } else {
            return NextResponse.json(
                { authenticated: false, message: 'No valid session' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { authenticated: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
