import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

// Use Resend as fallback or if configured explicitly, but prefer Gmail if credentials exist
// Resend client is initialized inside the handler if needed

const getGmailConfig = (req: NextRequest) => {
    const headers = req.headers;
    const rawUser = headers.get('x-gmail-user') || process.env.GMAIL_USER || null;
    const rawPass = headers.get('x-gmail-password') || process.env.GMAIL_APP_PASSWORD || null;

    return {
        user: rawUser ? rawUser.trim() : null,
        password: rawPass ? rawPass.replace(/\s+/g, '') : null
    };
};

/* 
// Old static config
const gmailConfig = {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD
};
*/

// Function to sync emails from Gmail
// Function to sync emails from Gmail
async function syncGmail(config: { user: string | null, password: string | null }) {
    if (!config.user || !config.password) return { success: false, message: 'No credentials' };

    let debugLog = `Starting sync for ${config.user}... `;
    try {
        const imapConfig = {
            imap: {
                user: config.user,
                password: config.password,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                authTimeout: 10000 // Increased timeout
            }
        };

        debugLog += "Connecting... ";
        const connection = await imaps.connect(imapConfig);
        debugLog += "Connected. Opening Box... ";
        await connection.openBox('INBOX');

        // Fetch ALL emails (no date restriction)
        // Note: For very large inboxes, this might be slow. We'll limit by count instead.
        const searchCriteria = ['ALL'];

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: false,
            struct: true
        };

        debugLog += "Searching... ";
        let messages = await connection.search(searchCriteria, fetchOptions);
        debugLog += `Found ${messages.length} messages. `;

        // Take the last 200 messages (increased from 50)
        // This ensures we get a significant history without timing out
        if (messages.length > 200) {
            messages = messages.slice(messages.length - 200);
        }

        let insertedCount = 0;

        for (const item of messages) {
            const all = item.parts.find((part: any) => part.which === '');
            const flags = item.attributes.flags || [];
            const isRead = flags.includes('\\Seen');

            if (all) {
                const parsed = await simpleParser(all.body);
                const senderName = parsed.from?.value[0]?.name || parsed.from?.value[0]?.address || 'Unknown';
                const senderEmail = parsed.from?.value[0]?.address || 'unknown@example.com';
                const body = parsed.text || parsed.html || '';
                const snippet = body.substring(0, 100);
                const subject = parsed.subject || 'No Subject';

                // Check if exists
                // We check if this specific email (subject + sender + somewhat recent time) exists
                // Expanded check window to 1 year to avoid duplicates on deep fetch
                const exists = await sql`
                    SELECT id FROM admin_emails 
                    WHERE subject = ${subject} 
                    AND sender_email = ${senderEmail} 
                    AND created_at > NOW() - INTERVAL '1 year'
                `;

                if (exists.length === 0) {
                    await sql`
                        INSERT INTO admin_emails (
                            sender_name, sender_email, recipient_email, subject, body, snippet, folder, is_read, labels, avatar, created_at
                        ) VALUES (
                            ${senderName}, ${senderEmail}, ${config.user}, ${subject}, ${body}, ${snippet}, 'inbox', ${isRead}, ARRAY['Gmail'], 'https://ui-avatars.com/api/?name=' || ${senderName}, ${parsed.date || new Date().toISOString()}
                        )
                    `;
                    insertedCount++;
                }
            }
        }

        connection.end();
        return { success: true, message: `Synced ${insertedCount} new emails (checked last 200). Log: ${debugLog}` };
    } catch (e: any) {
        console.error("Gmail Sync Error:", e);
        return { success: false, message: `Sync Error: ${e.message}. Log: ${debugLog}` };
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const folder = searchParams.get('folder') || 'inbox';
        const search = searchParams.get('search') || '';

        // Trigger sync if Inbox
        const gmailConfig = getGmailConfig(request);
        let syncResult = null;

        if (folder === 'inbox') {
            syncResult = await syncGmail(gmailConfig);
        }

        console.log("Sync Status:", syncResult);

        let emails;
        const currentUser = gmailConfig.user;

        // Show ALL emails if logged in, prioritized by recent sync

        if (currentUser) {
            if (search) {
                emails = await sql`
                    SELECT * FROM admin_emails 
                    WHERE (subject ILIKE ${'%' + search + '%'} OR sender_name ILIKE ${'%' + search + '%'} OR body ILIKE ${'%' + search + '%'})
                    AND folder = ${folder}
                    AND (
                        recipient_email ILIKE ${'%' + currentUser + '%'} 
                        OR sender_email ILIKE ${'%' + currentUser + '%'}
                    )
                    ORDER BY created_at DESC
                `;
            } else {
                emails = await sql`
                    SELECT * FROM admin_emails 
                    WHERE folder = ${folder}
                    AND (
                        recipient_email ILIKE ${'%' + currentUser + '%'} 
                        OR sender_email ILIKE ${'%' + currentUser + '%'}
                    )
                    ORDER BY created_at DESC
                `;
            }
        } else {
            // Not logged in (or using env vars as fallback, but getGmailConfig handles that)
            // If getGmailConfig returns null, it means no auth provided at all.
            if (search) {
                emails = await sql`
                    SELECT * FROM admin_emails 
                    WHERE (subject ILIKE ${'%' + search + '%'} OR sender_name ILIKE ${'%' + search + '%'} OR body ILIKE ${'%' + search + '%'})
                    AND folder = ${folder}
                    ORDER BY created_at DESC
                `;
            } else {
                emails = await sql`
                    SELECT * FROM admin_emails 
                    WHERE folder = ${folder}
                    ORDER BY created_at DESC
                `;
            }
        }

        // Get counts
        let inboxCount, starredCount, sentCount, draftsCount, trashCount;

        if (currentUser) {
            inboxCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE folder = 'inbox' AND is_read = false AND (LOWER(recipient_email) = LOWER(${currentUser}) OR LOWER(sender_email) = LOWER(${currentUser}))`;
            starredCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE is_starred = true AND (LOWER(recipient_email) = LOWER(${currentUser}) OR LOWER(sender_email) = LOWER(${currentUser}))`;
            sentCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE folder = 'sent' AND (LOWER(recipient_email) = LOWER(${currentUser}) OR LOWER(sender_email) = LOWER(${currentUser}))`;
            draftsCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE folder = 'drafts' AND (LOWER(recipient_email) = LOWER(${currentUser}) OR LOWER(sender_email) = LOWER(${currentUser}))`;
            trashCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE folder = 'trash' AND (LOWER(recipient_email) = LOWER(${currentUser}) OR LOWER(sender_email) = LOWER(${currentUser}))`;
        } else {
            inboxCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE folder = 'inbox' AND is_read = false`;
            starredCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE is_starred = true`;
            sentCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE folder = 'sent'`;
            draftsCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE folder = 'drafts'`;
            trashCount = await sql`SELECT COUNT(*) FROM admin_emails WHERE folder = 'trash'`;
        }

        return NextResponse.json({
            emails,
            syncResult,
            counts: {
                inbox: Number(inboxCount[0].count),
                starred: Number(starredCount[0].count),
                sent: Number(sentCount[0].count),
                drafts: Number(draftsCount[0].count),
                trash: Number(trashCount[0].count)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, subject, message, isDraft } = body;

        let status = 'sent';
        let folder = 'sent';

        if (isDraft) {
            folder = 'drafts';
            // Save draft
            const draft = await sql`
                INSERT INTO admin_emails (
                    sender_name, sender_email, recipient_email, subject, body, snippet, folder, is_read, labels, avatar, created_at
                ) VALUES (
                    'Me', 'admin@bizzcohub.com', ${to}, ${subject}, ${message}, ${message.substring(0, 50)}, 'drafts', true, ARRAY[]::text[], 'https://ui-avatars.com/api/?name=Me', NOW()
                ) RETURNING *
            `;
            return NextResponse.json({ success: true, email: draft[0] });
        }

        // Send via Gmail (Priority) or Resend
        const gmailConfig = getGmailConfig(request);

        if (gmailConfig.user && gmailConfig.password) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: gmailConfig.user,
                        pass: gmailConfig.password
                    }
                });

                await transporter.sendMail({
                    from: gmailConfig.user,
                    to: to,
                    subject: subject,
                    text: message, // Fallback
                    html: message
                });
            } catch (err: any) {
                console.error("Gmail Send Error:", err);
                return NextResponse.json({
                    error: `Gmail Error: ${err.message || 'Check credentials or App Password app settings.'}`
                }, { status: 401 });
            }
        }
        else if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY.trim());
                await resend.emails.send({
                    from: 'Bizz Co Hub Admin <onboarding@resend.dev>',
                    to: ['rishadpnpm@gmail.com'], // In prod, use 'to'
                    subject: subject,
                    html: message
                });
            } catch (err) {
                console.error("Resend error:", err);
                // Can decide to fail or just save as sent with error log
            }
        }

        // Save to Sent
        // Use sender_email as the logged-in user if available, else fallback
        const sender = gmailConfig.user || 'admin@bizzcohub.com';

        const sentEmail = await sql`
            INSERT INTO admin_emails (
                sender_name, sender_email, recipient_email, subject, body, snippet, folder, is_read, labels, avatar, created_at
            ) VALUES (
                'Me', ${sender}, ${to}, ${subject}, ${message}, ${message.substring(0, 50)}, 'sent', true, ARRAY[]::text[], 'https://ui-avatars.com/api/?name=Me', NOW()
            ) RETURNING *
        `;

        return NextResponse.json({ success: true, email: sentEmail[0] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, value } = body;

        if (action === 'toggleStar') {
            await sql`UPDATE admin_emails SET is_starred = ${value} WHERE id = ${id}`;
        } else if (action === 'markRead') {
            await sql`UPDATE admin_emails SET is_read = ${value} WHERE id = ${id}`;
        } else if (action === 'move') {
            await sql`UPDATE admin_emails SET folder = ${value} WHERE id = ${id}`;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
