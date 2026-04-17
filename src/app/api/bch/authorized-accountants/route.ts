import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
    try {
        // Fetch all users and check their permission state
        const query = await sql`
            SELECT u.id, u.username, u.first_name, u.last_name, u.role, COALESCE(a.has_access, FALSE) as is_authorized
            FROM users u
            LEFT JOIN authorized_accountants a ON u.id = a.user_id
            ORDER BY u.first_name ASC
        `;
        return NextResponse.json({ success: true, authorized: query });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, username, hasAccess } = await request.json();

        // Upsert permission
        await sql`
            INSERT INTO authorized_accountants (user_id, username, has_access)
            VALUES (${userId}, ${username}, ${hasAccess})
            ON CONFLICT (user_id) 
            DO UPDATE SET has_access = ${hasAccess}, username = EXCLUDED.username
        `;

        return NextResponse.json({ success: true, message: `Access ${hasAccess ? 'granted' : 'revoked'} for ${username}` });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { firstName, lastName, username, password } = await request.json();
        const passwordHash = crypto.createHash('sha256').update(password || '123456').digest('hex');

        // 1. Create User
        const userResult = await sql`
            INSERT INTO users (username, first_name, last_name, password_hash, role, status, approval_status, created_by, visible_password)
            VALUES (${username}, ${firstName}, ${lastName}, ${passwordHash}, 'ACCOUNTANT', 'active', 'approved', 'admin', ${password || '123456'})
            RETURNING id
        ` as any[];

        const newUserId = userResult[0].id;

        // 2. Grant Access Automatically
        await sql`
            INSERT INTO authorized_accountants (user_id, username, has_access)
            VALUES (${newUserId}, ${username}, TRUE)
        `;

        return NextResponse.json({ success: true, message: 'Accountant profile created with ledger access' });
    } catch (e: any) {
        if (e.message.includes('unique constraint')) {
            return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { userId, password } = await request.json();
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        // Check password AND authorization status if they are not admin
        const user = await sql`
            SELECT u.password_hash, u.role, aa.has_access 
            FROM users u
            LEFT JOIN authorized_accountants aa ON u.id = aa.user_id
            WHERE u.id = ${userId}
        ` as any[];

        if (user.length === 0) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const isAdmin = user[0].role?.toUpperCase() === 'ADMIN' || user[0].role?.toUpperCase() === 'SUPER_ADMIN';
        const isAuthorized = user[0].has_access === true;

        if (user[0].password_hash !== passwordHash) {
            return NextResponse.json({ success: false, error: 'Invalid Security PIN' });
        }

        if (!isAdmin && !isAuthorized) {
            return NextResponse.json({ success: false, error: 'Profile access is currently revoked' });
        }

        return NextResponse.json({ success: true, message: 'Authentication successful' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
