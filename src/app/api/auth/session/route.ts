import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const sessionToken = cookies().get('admin_session')?.value;
        const userRole = cookies().get('admin_user_role')?.value;
        const userId = cookies().get('admin_user_id')?.value;

        if (sessionToken) {
            const sessionDuration = 30 * 60 * 1000; // 30 minutes
            const expiresAt = new Date(Date.now() + sessionDuration);

            // Refesh session cookies for a sliding window of 30 minutes
            cookies().set('admin_session', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: expiresAt,
                path: '/',
            });

            if (userRole) {
                cookies().set('admin_user_role', userRole, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    expires: expiresAt,
                    path: '/',
                });
            }

            if (userId) {
                cookies().set('admin_user_id', userId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    expires: expiresAt,
                    path: '/',
                });
            }

            return NextResponse.json({
                authenticated: true,
                role: userRole || 'accountant', // Default to accountant if missing
                user: userId ? { id: userId, role: userRole } : null,
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
