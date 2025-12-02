import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE() {
    try {
        console.log('🗑️  Starting to clear all data from the database...');

        // Delete all products
        const result = await sql`DELETE FROM products RETURNING *`;

        console.log(`✅ Cleared ${result.length} products from the database`);

        return NextResponse.json({
            success: true,
            message: `Successfully cleared ${result.length} products from the database`,
            count: result.length
        });
    } catch (error: any) {
        console.error('❌ Error clearing data:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to clear database',
                details: error.message
            },
            { status: 500 }
        );
    }
}
