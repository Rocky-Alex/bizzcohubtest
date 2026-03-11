import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const dbUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

        if (!dbUrl) {
            return NextResponse.json({
                error: 'Database configuration missing',
                details: 'Tried INVOICE_DATABASE_URL, POSTGRES_URL, DATABASE_URL. All undefined.'
            }, { status: 500 });
        }

        const sql = neon(dbUrl);
        const body = await req.json();
        const { products } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'No products data provided' }, { status: 400 });
        }

        // Map incoming simple product data to new complex schema
        const insertPromises = products.map(p => {
            const productName = p.name || 'Untitled Product';
            // Generate a simple product code if sku is missing, or use timestamp
            const productCode = p.sku || `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const category = p.category || null;
            const stockQuantity = p.quantity || 0;
            const basePrice = p.price || 0.00;
            const features = p.description || null;
            const primaryImageUrl = p.imageUrl || null;

            return sql`
                INSERT INTO products (
                    product_code, 
                    product_name, 
                    category, 
                    stock_quantity, 
                    base_price, 
                    features, 
                    primary_image_url,
                    offer_price,
                    discount_percent,
                    condition_status
                )
                VALUES (
                    ${productCode}, 
                    ${productName}, 
                    ${category}, 
                    ${stockQuantity}, 
                    ${basePrice}, 
                    ${features}, 
                    ${primaryImageUrl},
                    ${basePrice},
                    0,
                    'New'
                )
                ON CONFLICT (product_code) DO UPDATE SET
                    product_name = EXCLUDED.product_name,
                    category = EXCLUDED.category,
                    stock_quantity = EXCLUDED.stock_quantity,
                    base_price = EXCLUDED.base_price,
                    features = EXCLUDED.features,
                    primary_image_url = EXCLUDED.primary_image_url
             `;
        });

        console.log(`Attempting to bulk insert ${products.length} products into new schema...`);

        const results = await Promise.allSettled(insertPromises);

        const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
        const fulfilled = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled');

        if (rejected.length > 0) {
            console.error('Some products failed to import:', rejected);
            return NextResponse.json({
                message: `Import completed with warnings. Success: ${fulfilled.length}, Failed: ${rejected.length}`,
                details: rejected.map((r) => {
                    const error = r.reason as any;
                    return error?.message || 'An unknown error occurred during product import';
                })
            }, { status: 200 });
        }

        console.log('Insert successful');

        await logActivity(
            'Admin',
            'Bulk Import Products',
            `Imported ${fulfilled.length} products with ${rejected.length} failures`,
            rejected.length > 0 ? 'failure' : 'success',
            'Admin'
        );

        return NextResponse.json({ message: `Successfully imported ${products.length} products` }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error importing products detailed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({
            error: errorMessage || 'Internal Server Error'
        }, { status: 500 });
    }
}
