import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS admin_emails (
                id SERIAL PRIMARY KEY,
                sender_name VARCHAR(255),
                sender_email VARCHAR(255),
                recipient_email VARCHAR(255),
                subject VARCHAR(255),
                body TEXT,
                snippet VARCHAR(255),
                folder VARCHAR(50) DEFAULT 'inbox',
                is_read BOOLEAN DEFAULT FALSE,
                is_starred BOOLEAN DEFAULT FALSE,
                labels TEXT[],
                avatar VARCHAR(512),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // Seed some data if empty
        const count = await sql`SELECT COUNT(*) FROM admin_emails`;
        if (Number(count[0].count) === 0) {
            await sql`
                INSERT INTO admin_emails (sender_name, sender_email, recipient_email, subject, body, snippet, folder, is_read, labels, avatar, created_at)
                VALUES 
                ('Justin Lapoint', 'justin@example.com', 'admin@bizzcohub.com', 'Client Dashboard', 'It seems that recipients are receiving...', 'It seems that recipients are receiving...', 'inbox', false, ARRAY['Projects', 'Work'], 'https://i.pravatar.cc/150?u=1', NOW() - INTERVAL '1 hour'),
                ('Rufana Joe', 'rufana@example.com', 'admin@bizzcohub.com', 'UI project', 'Regardless, you can usually expect an increase...', 'Regardless, you can usually expect an increase', 'inbox', true, ARRAY['Applications'], 'https://i.pravatar.cc/150?u=2', NOW() - INTERVAL '2 hours'),
                ('Cameron Drake', 'cameron@example.com', 'admin@bizzcohub.com', 'You''re missing', 'Here are a few catchy email subject line examples...', 'Here are a few catchy email subject line examples', 'inbox', false, ARRAY['External'], 'https://i.pravatar.cc/150?u=3', NOW() - INTERVAL '3 hours'),
                ('Sean Hill', 'sean@example.com', 'admin@bizzcohub.com', 'How Have You Progressed', 'You can write effective retargeting subject lines...', 'You can write effective retargeting subject', 'inbox', false, ARRAY['Team Events'], 'https://i.pravatar.cc/150?u=4', NOW() - INTERVAL '4 hours');
            `;
        }

        return NextResponse.json({ message: 'Email table initialized successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
