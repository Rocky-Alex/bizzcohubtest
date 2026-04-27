import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activity-logger';
import { Resend } from 'resend';

// Resend initialized inside POST

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
}

function generateSessionToken(): string {
    return createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // DDL removed. Schema assumed to exist.


        if (action === 'signup') {
            const { firstName, lastName, username, email, phone, password, avatar } = body;

            if (!username || !password || !email) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            // Check if user exists
            const existing = await sql`
                SELECT id FROM customers WHERE username = ${username} OR email = ${email}
            `;

            if (existing.length > 0) {
                return NextResponse.json({ error: 'Username or Email already exists' }, { status: 409 });
            }

            const passwordHash = hashPassword(password);
            const fullName = `${firstName} ${lastName}`.trim();

            // Insert new customer
            const newCustomer = await sql`
                INSERT INTO customers (name, username, email, phone, password_hash, status, avatar, image_url)
                VALUES (${fullName}, ${username}, ${email}, ${phone}, ${passwordHash}, 'Active', ${avatar || null}, ${avatar || null})
                RETURNING id, name, username, email, avatar, image_url
            `;

            await logActivity(username, 'Customer Signup', `New customer signed up: ${fullName} (${email})`, 'success', 'Customer');

            // Send Welcome Email
            try {
                if (process.env.RESEND_API_KEY) {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    await resend.emails.send({
                        from: 'Bizz Co Hub <onboarding@resend.dev>',
                        to: ['rishadpnpm@gmail.com'], // Restricted to verified email in Resend free tier
                        subject: 'Welcome to Bizz Co Hub!',
                        html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                            <h2 style="color: #4f46e5;">Welcome, ${fullName}!</h2>
                            <p>Thank you for joining <strong>Bizz Co Hub</strong>.</p>
                            <p>We are thrilled to have you on board. Explore our wide range of premium refurbished electronics and professional IT services.</p>
                            
                            <div style="margin: 30px 0; text-align: center;">
                                <a href="https://bizzcohub.com/products" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Browse Collection</a>
                            </div>

                            <p style="color: #666; font-size: 14px;">
                                If you have any questions, feel free to reply to this email or contact our support team.
                            </p>
                            
                            <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                                Happy Shopping!<br/>
                                Bizz Co Hub Team
                            </p>
                        </div>
                    `
                    });
                }
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
            }

            return NextResponse.json({
                success: true,
                message: 'Account created successfully',
                user: {
                    ...newCustomer[0],
                    image_url: newCustomer[0].image_url || newCustomer[0].avatar
                }
            });
        }

        else if (action === 'login') {
            const { identifier, password } = body; // identifier can be username or email

            if (!identifier || !password) {
                return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
            }

            const passwordHash = hashPassword(password);

            const users = await sql`
                SELECT * FROM customers 
                WHERE (username = ${identifier} OR email = ${identifier}) 
                AND password_hash = ${passwordHash}
            `;

            // Special handling for Admin Login (DB Persistence) - Master Key Bypass
            if ((identifier === 'admin' || identifier === 'bizzcohubllc@gmail.com') && password === 'Bizzcoshop@2025') {
                // Check if admin exists by username/email even if password didn't match (though here we want to Create if NOT exists)
                // Actually, if users.length is 0, it means either user missing OR password wrong.
                // Since we verified password === 'admin' in the condition, we assume correct credentials.
                // Now check if user exists at all (maybe password changed? or user deleted?)
                // But for "wipe" resilience, we assume if we are here with correct hardcoded creds, we want to BECOME admin.

                // Let's check existence physically to decide INSERT or UPDATE (or just use ID if exists)
                const existingAdmin = await sql`SELECT * FROM customers WHERE username = 'admin' OR email = 'bizzcohubllc@gmail.com'`;

                let adminUser;
                if (existingAdmin.length === 0) {
                    // Create Admin Customer
                    const newAdmin = await sql`
                        INSERT INTO customers (name, username, email, phone, password_hash, status, avatar, image_url)
                        VALUES ('Super Admin', 'admin', 'bizzcohubllc@gmail.com', '9995862190', ${passwordHash}, 'Active', null, null)
                        RETURNING *
                    `;
                    adminUser = newAdmin[0];
                } else {
                    // Update Admin to ensure active and correct password (optional, but good for "reset")
                    // The user said "we need all datas", meaning if it Was wiped, we recreate.
                    // If it wasn't wiped, we just login.
                    adminUser = existingAdmin[0];
                    // If password in DB is different but we matched Hardcoded 'admin', should we allow?
                    // The prompt says "can login same like as Customer", implies standard flow.
                    // But "even db fully wipe... can login", implies the hardcode is the master key.
                    // So we treat this as a successful login.
                }

                // Mock the 'users' array so the rest of the function proceeds
                if (adminUser) {
                    users.push(adminUser);
                }
            }

            if (users.length === 0) {
                await logActivity(identifier, 'Login Failed', `Failed login attempt for: ${identifier}`, 'failure', 'Customer');
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const user = users[0];

            // Check Deactivation Status
            if (user.status === 'Deactivated') {
                const deactivatedAt = user.deactivated_at ? new Date(user.deactivated_at) : new Date(0); // Default to old if missing
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - deactivatedAt.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 60) {
                    // Permanently Delete
                    await sql`DELETE FROM wishlist WHERE customer_id = ${user.id}`;
                    await sql`DELETE FROM orders WHERE customer_id = ${user.id}`;
                    await sql`DELETE FROM customers WHERE id = ${user.id}`;

                    return NextResponse.json({ error: 'Your account was permanently deleted due to inactivity of over 60 days.' }, { status: 410 }); // 410 Gone
                } else {
                    // Reactivate
                    await sql`UPDATE customers SET status = 'Active', deactivated_at = NULL WHERE id = ${user.id}`;
                    // Proceed to login
                }
            }

            // Set Session Cookie
            const sessionToken = generateSessionToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

            cookies().set('customer_session', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                expires: expiresAt,
                path: '/'
            });

            await logActivity(user.username, 'Customer Login', `Customer logged in: ${user.name}`, 'success', 'Customer');

            // Frontend might want some user info
            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    image_url: user.image_url || user.avatar
                }
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
