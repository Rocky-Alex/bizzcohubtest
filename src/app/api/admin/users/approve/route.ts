import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const { userId, action } = await request.json();

        if (!userId || !action) {
            return NextResponse.json(
                { success: false, error: 'User ID and action are required' },
                { status: 400 }
            );
        }

        if (action === 'approve') {
            // Approve the user
            const result = await sql`
                UPDATE users 
                SET status = 'active',
                    approval_status = 'approved'
                WHERE id = ${userId} AND approval_status = 'pending'
                RETURNING id, username, email, phone, role
            `;

            if (result.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'User not found or already processed' },
                    { status: 404 }
                );
            }

            const user = result[0];

            // Send welcome email if user has email
            if (user.email) {
                try {
                    const emailTemplate = emailTemplates.welcome(user.username, user.role);
                    await sendEmail(user.email, emailTemplate);
                } catch (emailError) {
                    console.error('Failed to send welcome email:', emailError);
                    // Don't fail the approval if email fails
                }
            }

            return NextResponse.json({
                success: true,
                message: 'User approved successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } else if (action === 'reject') {
            // Delete the rejected user
            const result = await sql`
                DELETE FROM users 
                WHERE id = ${userId} AND approval_status = 'pending'
                RETURNING id, username
            `;

            if (result.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'User not found or already processed' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'User rejected and deleted successfully'
            });

        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid action. Use "approve" or "reject"' },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Approval error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
