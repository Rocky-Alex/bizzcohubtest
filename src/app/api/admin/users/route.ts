import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Set max duration to 10 seconds for Vercel
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { User } from '@/types';

// Helper to check if current user is admin
function isAdmin(): boolean {
    const role = cookies().get('user_role')?.value;
    return role?.toLowerCase() === 'admin';
}

export async function GET(): Promise<NextResponse> {
    try {
        console.log('[Users API] GET request received');
        console.log('[Users API] Checking admin authorization...');

        if (!isAdmin()) {
            console.log('[Users API] Authorization failed - not admin');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.log('[Users API] Authorization passed, fetching users from database...');

        // Migration: Ensure visible_password column exists
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS visible_password TEXT`;

        const users = await sql`
            SELECT id, username, first_name, last_name, email, phone, role, status, approval_status, avatar, created_by, created_at, visible_password 
            FROM users 
            WHERE role != 'superadmin' AND username != 'superadmin'
            ORDER BY created_at DESC
        ` as unknown as User[];

        console.log('[Users API] Query executed successfully');
        console.log('[Users API] Number of users fetched:', users.length);

        return NextResponse.json({ users });
    } catch (error: unknown) {
        console.error('[Users API] Error fetching users:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({
            error: 'Failed to fetch users',
            details: errorMessage
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { username, first_name, last_name, password, email, phone, role, status, avatar } = body;

        if (!username || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!email && !phone) {
            return NextResponse.json({ error: 'Either email or phone is required' }, { status: 400 });
        }

        // Check if username exists (Case Insensitive)
        const existing = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username})` as unknown as { id: number }[];
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        const passwordHash = createHash('sha256').update(password).digest('hex');

        await sql`
            INSERT INTO users (
                username, 
                first_name,
                last_name,
                password_hash, 
                email, 
                phone, 
                role, 
                status, 
                approval_status, 
                created_by,
                avatar,
                visible_password
            )
            VALUES (
                ${username}, 
                ${first_name || null},
                ${last_name || null},
                ${passwordHash}, 
                ${email || null}, 
                ${phone || null}, 
                ${role}, 
                ${status || 'active'}, 
                'approved', 
                'admin',
                ${avatar || null},
                ${password}
            )
        `;

        return NextResponse.json({ message: 'User created successfully' });
    } catch (error: unknown) {
        console.error('Error creating user:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({
            error: 'Failed to create user',
            details: errorMessage
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, password, first_name, last_name, email, phone, role, status, avatar } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (password) {
            const passwordHash = createHash('sha256').update(password).digest('hex');
            await sql`
                UPDATE users 
                SET password_hash = ${passwordHash}, 
                    first_name = ${first_name || null},
                    last_name = ${last_name || null},
                    email = ${email || null}, 
                    phone = ${phone || null}, 
                    role = ${role}, 
                    status = ${status},
                    avatar = ${avatar || null}, 
                    visible_password = ${password},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
            `;
        } else {
            await sql`
                UPDATE users 
                SET email = ${email || null}, 
                    first_name = ${first_name || null},
                    last_name = ${last_name || null},
                    phone = ${phone || null}, 
                    role = ${role}, 
                    status = ${status},
                    avatar = ${avatar || null}, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
            `;
        }

        return NextResponse.json({ message: 'User updated successfully' });
    } catch (error: unknown) {
        console.error('Error updating user:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to update user', details: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
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
    } catch (error: unknown) {
        console.error('Error deleting user:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to delete user', details: errorMessage }, { status: 500 });
    }
}
