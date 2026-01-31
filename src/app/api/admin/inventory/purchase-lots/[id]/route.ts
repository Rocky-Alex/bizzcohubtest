import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;

        await sql`DELETE FROM purchase_lots WHERE id = ${id}`;

        await logActivity(
            'Admin',
            'Delete Purchase Lot',
            `Deleted Lot #${id}`,
            'success'
        );

        return NextResponse.json({ success: true, message: 'Lot deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting lot:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
