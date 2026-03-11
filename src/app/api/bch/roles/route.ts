import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

// Helper to check if current user is admin
// Helper to check if current user is admin
function isAdmin(): boolean {
    const role = cookies().get('admin_user_role')?.value;
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
}

export async function GET(): Promise<NextResponse> {
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
        const roles = await sql`SELECT * FROM roles ORDER BY created_at ASC` as unknown as any[];

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
            const seededRoles = await sql`SELECT * FROM roles ORDER BY created_at ASC` as unknown as any[];
            return NextResponse.json({ roles: seededRoles });
        }

        return NextResponse.json({ roles });
    } catch (error: unknown) {
        console.error('Error fetching roles:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to fetch roles', details: errorMessage }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
        ` as unknown as any[];

        return NextResponse.json({ role: newRole[0] });
    } catch (error: unknown) {
        console.error('Error creating role:', error);
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') { // Unique violation
            return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to create role', details: errorMessage }, { status: 500 });
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
            return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
        }

        // Optional: Check if role is used by any user? 
        // For now, allow delete. User might need to handle reassignment.
        // Also prevent deleting 'Admin'?
        const role = await sql`SELECT name FROM roles WHERE id = ${id}` as unknown as { name: string }[];
        if (role.length > 0 && role[0].name.toLowerCase() === 'admin') {
            return NextResponse.json({ error: 'Cannot delete Admin role' }, { status: 403 });
        }

        await sql`DELETE FROM roles WHERE id = ${id}`;

        return NextResponse.json({ message: 'Role deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting role:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to delete role', details: errorMessage }, { status: 500 });
    }
}
