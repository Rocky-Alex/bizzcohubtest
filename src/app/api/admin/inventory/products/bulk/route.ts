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
             `;
        });

        console.log(`Attempting to bulk insert ${products.length} products into new schema...`);
        await Promise.all(insertPromises);
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
