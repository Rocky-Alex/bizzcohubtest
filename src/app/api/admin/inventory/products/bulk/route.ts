import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
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

            /* 
             * Use UPSERT (INSERT ... ON CONFLICT DO UPDATE) to handle re-imports.
             * We assume 'product_code' is the unique key. 
             */
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
                    ${basePrice}, -- Default offer price same as base
                    0, -- Default discount
                    'New' -- Default condition
                )
                ON CONFLICT (product_code) DO UPDATE SET
                    product_name = EXCLUDED.product_name,
                    category = EXCLUDED.category,
                    stock_quantity = EXCLUDED.stock_quantity,
                    base_price = EXCLUDED.base_price,
                    features = EXCLUDED.features,
                    primary_image_url = EXCLUDED.primary_image_url
                    -- We generally don't reset offer_price/discount to default on update strictly, 
                    -- but for this bulk import tool, resetting to base might be the expected behavior 
                    -- if the CSV contains the 'master' data. 
                    -- For now, let's update base_price but maybe leave specific offer logic alone 
                    -- unless explicitly needed. 
                    -- actually, let's keep it simple: overwrite everything from CSV implies source of truth.
             `;
        });

        console.log(`Attempting to bulk insert ${products.length} products into new schema...`);

        const results = await Promise.allSettled(insertPromises);

        const rejected = results.filter(r => r.status === 'rejected');
        const fulfilled = results.filter(r => r.status === 'fulfilled');

        if (rejected.length > 0) {
            console.error('Some products failed to import:', rejected);
            // Return 200/207 but with warning info
            return NextResponse.json({
                message: `Import completed with warnings. Success: ${fulfilled.length}, Failed: ${rejected.length}`,
                details: rejected.map((r: any) => r.reason.message || JSON.stringify(r.reason))
            }, { status: 200 }); // Return 200 so fontend shows the message in alert, instead of crashing import logic
        }

        console.log('Insert successful');

        return NextResponse.json({ message: `Successfully imported ${products.length} products` }, { status: 201 });

    } catch (error: any) {
        console.error('Error importing products detailed:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }, { status: 500 });
    }
}
