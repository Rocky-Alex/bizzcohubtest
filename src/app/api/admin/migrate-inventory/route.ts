import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        console.log("Running migration to add missing columns to master_inventory...");

        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS keyboard_type VARCHAR`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS keyboard_backlit VARCHAR`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS backlit VARCHAR`;
        // Backlit might be duplicate of keyboard_backlit, but let's be safe or just use keyboard_backlit.
        // User's Excel says "Backlit". API QC route calls it "keyboard_backlit".
        // I'll stick to keyboard_backlit as consistent naming.

        // Also check if other columns are missing based on Excel
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS graphics_card VARCHAR`; // Check naming
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS screen_size VARCHAR`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS condition_status VARCHAR`;

        console.log("Migration complete.");
        return NextResponse.json({ success: true, message: "Columns added successfully." });
    } catch (error: any) {
        console.error("Migration failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
