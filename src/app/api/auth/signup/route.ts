import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { sql } from '@/lib/db';
export async function POST(request: NextRequest) {
    try {
        const { username, password, email, phone, role } = await request.json();

        // Validation
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username and password are required' },
                { status: 400 }
            );
        }

        if (!email && !phone) {
            return NextResponse.json(
                { success: false, message: 'Either email or phone number is required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await sql`
            SELECT username FROM users 
            WHERE username = ${username}
        `;

        if (existingUser.length > 0) {
            return NextResponse.json(
                { success: false, message: 'Username already exists' },
                { status: 409 }
            );
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await sql`
                SELECT email FROM users 
                WHERE email = ${email}
            `;

            if (existingEmail.length > 0) {
                return NextResponse.json(
                    { success: false, message: 'Email already registered' },
                    { status: 409 }
                );
            }
        }

        // Hash password
        const passwordHash = createHash('sha256').update(password).digest('hex');

        // Create user with pending status
        const result = await sql`
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
                ${role || 'accountant'},
                'pending',
                'pending',
                'self-registration'
            )
            RETURNING id, username, email, phone, role
        `;

        const newUser = result[0];

        // Send notification email to admins (optional)
        try {
            const admins = await sql`
                SELECT email FROM users 
                WHERE role = 'admin' AND email IS NOT NULL AND status = 'active'
            `;

            for (const admin of admins) {
                if (admin.email) {
                    // You can create a custom email template for admin notifications
                    console.log(`Notification sent to admin: ${admin.email}`);
                }
            }
        } catch (emailError) {
            console.error('Failed to send admin notification:', emailError);
            // Don't fail the registration if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Registration successful. Your account is pending approval.',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { success: false, message: 'Registration failed. Please try again.' },
            { status: 500 }
        );
    }
}
