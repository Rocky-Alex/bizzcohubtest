import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

// Helper to check if current user is admin
function isAdmin() {
    const role = cookies().get('user_role')?.value;
    return role === 'admin';
}

export async function GET(request: NextRequest) {
    try {
        console.log('[Users API] GET request received');
        console.log('[Users API] Checking admin authorization...');

        if (!isAdmin()) {
            console.log('[Users API] Authorization failed - not admin');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.log('[Users API] Authorization passed, fetching users from database...');

        const users = await sql`
            SELECT id, username, email, phone, role, status, approval_status, avatar, created_by, created_at 
            FROM users 
            ORDER BY created_at DESC
        `;

        console.log('[Users API] Query executed successfully');
        console.log('[Users API] Number of users fetched:', users.length);
        console.log('[Users API] Sample user data:', users[0] || 'No users found');

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('[Users API] Error fetching users:', error);
        console.error('[Users API] Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack
        });
        return NextResponse.json({
            error: 'Failed to fetch users',
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { username, password, email, phone, role, status, avatar } = body;

        if (!username || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!email && !phone) {
            return NextResponse.json({ error: 'Either email or phone is required' }, { status: 400 });
        }

        // Check if username exists
        const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        const passwordHash = createHash('sha256').update(password).digest('hex');

        await sql`
            INSERT INTO users (
                username, 
                password_hash, 
                email, 
                phone, 
                role, 
                status, 
                approval_status, 
                created_by,
                avatar
            )
            VALUES (
                ${username}, 
                ${passwordHash}, 
                ${email || null}, 
                ${phone || null}, 
                ${role}, 
                ${status || 'active'}, 
                'approved', 
                'admin',
                ${avatar || null}
            )
        `;

        return NextResponse.json({ message: 'User created successfully' });
    } catch (error: any) {
        console.error('Error creating user:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint
        });
        return NextResponse.json({
            error: 'Failed to create user',
            details: error.message
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, password, email, phone, role, status, avatar } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (password) {
            const passwordHash = createHash('sha256').update(password).digest('hex');
            await sql`
                UPDATE users 
                SET password_hash = ${passwordHash}, 
                    email = ${email || null}, 
                    phone = ${phone || null}, 
                    role = ${role}, 
                    status = ${status},
                    avatar = ${avatar || null}, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
            `;
        } else {
            await sql`
                UPDATE users 
                SET email = ${email || null}, 
                    phone = ${phone || null}, 
                    role = ${role}, 
                    status = ${status},
                    avatar = ${avatar || null}, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
            `;
        }

        return NextResponse.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent deleting the last admin or self (optional but good practice)
        // For now, just delete
        await sql`DELETE FROM users WHERE id = ${id}`;

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
