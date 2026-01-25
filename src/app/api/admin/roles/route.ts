import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

// Helper to check if current user is admin
function isAdmin() {
    const role = cookies().get('user_role')?.value;
    return role?.toLowerCase() === 'admin';
}

export async function GET(request: NextRequest) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Create table if not exists (auto-migration for simplicity)
        await sql`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                permissions JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Fetch roles
        const roles = await sql`SELECT * FROM roles ORDER BY created_at ASC`;

        // If no roles exist, seed default ones
        if (roles.length === 0) {
            const defaultRoles = ['Admin', 'Salesman', 'Accountant'];
            for (const roleName of defaultRoles) {
                await sql`
                    INSERT INTO roles (name, created_at) 
                    VALUES (${roleName}, ${new Date().toISOString()})
                    ON CONFLICT (name) DO NOTHING
                `;
            }
            // Fetch again
            const seededRoles = await sql`SELECT * FROM roles ORDER BY created_at ASC`;
            return NextResponse.json({ roles: seededRoles });
        }

        return NextResponse.json({ roles });
    } catch (error: any) {
        console.error('Error fetching roles:', error);
        return NextResponse.json({ error: 'Failed to fetch roles', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, permissions } = body;

        if (!name) {
            return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
        }

        // Insert new role
        const newRole = await sql`
            INSERT INTO roles (name, permissions, created_at)
            VALUES (${name}, ${permissions || {}}, ${new Date().toISOString()})
            RETURNING *
        `;

        return NextResponse.json({ role: newRole[0] });
    } catch (error: any) {
        console.error('Error creating role:', error);
        if (error.code === '23505') { // Unique violation
            return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create role', details: error.message }, { status: 500 });
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
            return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
        }

        // Optional: Check if role is used by any user? 
        // For now, allow delete. User might need to handle reassignment.
        // Also prevent deleting 'Admin'?
        const role = await sql`SELECT name FROM roles WHERE id = ${id}`;
        if (role.length > 0 && role[0].name.toLowerCase() === 'admin') {
            return NextResponse.json({ error: 'Cannot delete Admin role' }, { status: 403 });
        }

        await sql`DELETE FROM roles WHERE id = ${id}`;

        return NextResponse.json({ message: 'Role deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting role:', error);
        return NextResponse.json({ error: 'Failed to delete role', details: error.message }, { status: 500 });
    }
}
