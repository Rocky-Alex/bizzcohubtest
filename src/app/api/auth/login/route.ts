import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { sql } from '@/lib/db';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Session token generator
function generateSessionToken(): string {
    return createHash('sha256')
        .update(`${Date.now()}-${Math.random()}`)
        .digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Hash the provided password
        const passwordHash = createHash('sha256').update(password).digest('hex');

        // Query the database
        const users = await sql`
            SELECT * FROM users 
            WHERE LOWER(username) = LOWER(${username}) 
            AND password_hash = ${passwordHash}
        `;

        // Special handling for Admin Login (DB Persistence)
        if (users.length === 0 && username.toLowerCase() === 'admin' && password === 'Bizzcohub@2025') {
            const existingAdmin = await sql`SELECT * FROM users WHERE LOWER(username) = 'admin'`;

            let adminUser;
            if (existingAdmin.length === 0) {
                // Create Admin User
                const newAdmin = await sql`
                    INSERT INTO users (username, password_hash, role, status, email, first_name, last_name)
                    VALUES ('admin', ${passwordHash}, 'admin', 'active', 'bizzcohubllc@gmail.com', 'Super', 'Admin')
                    RETURNING *
                `;
                adminUser = newAdmin[0];
            } else {
                adminUser = existingAdmin[0];
                // Update password if mismatch
                if (adminUser.password_hash !== passwordHash) {
                    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${adminUser.id}`;
                    adminUser.password_hash = passwordHash;
                }
            }

            if (adminUser) {
                users.push(adminUser);
            }
        }

        // Special handling for Super Admin (Hidden User)
        if (users.length === 0 && username.toLowerCase() === 'superadmin' && password === 'Rishu0226@Bizzcohub') {
            const existing = await sql`SELECT * FROM users WHERE LOWER(username) = 'superadmin'`;
            let superUser;
            if (existing.length === 0) {
                // Create Super Admin
                superUser = (await sql`
                    INSERT INTO users (username, password_hash, role, status, email, first_name, last_name, phone)
                    VALUES ('superadmin', ${passwordHash}, 'superadmin', 'active', 'rishadpnpmksa@gmail.com', 'Super', 'Admin', '971')
                    RETURNING *
                 `)[0];
            } else {
                superUser = existing[0];
                // Update password if mismatch
                if (superUser.password_hash !== passwordHash) {
                    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${superUser.id}`;
                    superUser.password_hash = passwordHash;
                }
            }
            if (superUser) users.push(superUser);
        }

        if (users.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid username or password' },
                { status: 401 }
            );
        }

        const user = users[0];

        if (user.status !== 'active') {
            return NextResponse.json(
                { success: false, message: 'Account is inactive. Please contact administrator.' },
                { status: 403 }
            );
        }

        // Generate session token
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Set HTTP-only cookies
        cookies().set('admin_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
        });

        // Set user role cookie
        cookies().set('admin_user_role', user.role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
        });

        // Set user id cookie for session retrieval
        cookies().set('admin_user_id', String(user.id), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
        });

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: (user.first_name || user.last_name) ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.username,
                email: user.email,
                image_url: user.avatar || user.image_url
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
