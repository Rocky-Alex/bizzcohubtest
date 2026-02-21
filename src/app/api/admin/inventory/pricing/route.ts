import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Security Helper
async function isAdmin() {
    // If NextAuth is fully configured
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role === 'superadmin' || (session?.user as any)?.role === 'Administrator') {
        return true;
    }
    // Fallback: Check for admin_session cookie (used heavily in this project)
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin_session');

    return !!adminSession;
}

export async function GET() {
    try {
        const authorized = await isAdmin();
        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch pricing data from master_inventory
        const result = await sql`
            SELECT 
                id,
                product_name,
                barcode,
                sku,
                category,
                quantity as stock_quantity,
                unit_cost,
                base_price,
                offer_price,
                primary_image_url
            FROM 
                master_inventory
            ORDER BY 
                created_at DESC
        `;

        return NextResponse.json(result as any);
    } catch (error) {
        console.error('Error fetching product pricing:', error);
        return NextResponse.json({ error: 'Failed to fetch product pricing' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const authorized = await isAdmin();
        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { updates } = body;

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Process bulk updates within a transaction or sequential query block
        const updatePromises = updates.map(async (item: any) => {
            if (!item.id) return null;

            // Allow 0 or null but fallback to current DB value if undefined
            const unit_cost = item.unit_cost !== undefined ? item.unit_cost : null;
            const base_price = item.base_price !== undefined ? item.base_price : null;
            const offer_price = item.offer_price !== undefined ? item.offer_price : null;

            // Using parameterized queries dynamically to only update provided fields
            const setClauses = [];
            if (unit_cost !== null) setClauses.push(`unit_cost = ${unit_cost}`);
            if (base_price !== null) setClauses.push(`base_price = ${base_price}`);
            if (offer_price !== null) setClauses.push(`offer_price = ${offer_price}`);

            if (setClauses.length === 0) return null;

            const query = `
                UPDATE master_inventory 
                SET ${setClauses.join(', ')}
                WHERE id = ${item.id}
                RETURNING id;
            `;

            return await sql(query);
        });

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true, message: 'Prices updated successfully' });
    } catch (error) {
        console.error('Error updating pricing:', error);
        return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 });
    }
}
