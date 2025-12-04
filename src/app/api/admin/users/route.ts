import { NextRequest, NextResponse } from 'next/server';
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
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const users = await sql`
            SELECT id, username, email, phone, role, status, approval_status, created_by, created_at 
            FROM users 
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { username, password, email, phone, role, status } = body;

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
                created_by
            )
            VALUES (
                ${username}, 
                ${passwordHash}, 
                ${email || null}, 
                ${phone || null}, 
                ${role}, 
                ${status || 'active'}, 
                'approved', 
                'admin'
            )
        `;

        return NextResponse.json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, password, email, phone, role, status } = body;

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
