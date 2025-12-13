import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Helper to get DB connection
const getSql = () => {
    const dbUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('Database configuration missing');
    }
    return neon(dbUrl);
};

export async function GET() {
    try {
        const sql = getSql();
        const products = await sql`SELECT * FROM products ORDER BY date_added DESC LIMIT 50`;
        return NextResponse.json(products);
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const sql = getSql();
        const body = await req.json();

        // Destructure all possible fields from the new complex form
        const {
            productName,
            productCode,
            brand,
            category,
            badge,
            conditionStatus,
            basePrice,
            offerPrice,
            stockQuantity,
            processor,
            ram,
            storage,
            graphicsCard,
            graphicsStorage,
            screenSize,
            colors,
            features,
            primaryImageUrl,
            allImagesUrls,
            ramVariants,
            storageVariants
        } = body;

        // Ensure new columns exist for variants (Simple auto-migration)
        try {
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS ram_variants JSONB`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_variants JSONB`;
        } catch (e) {
            // Ignore error if column exists or race condition
            console.log('Migration note:', e);
        }

        if (!productName) {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }

        // Generate a SKU/Code if not provided
        let finalProductCode = productCode;
        if (!finalProductCode) {
            let prefix = 'LP'; // Default to Laptop/Product
            const catLower = (category || '').toLowerCase();
            if (catLower.includes('accessor') || catLower.includes('component') || catLower.includes('monitor')) {
                prefix = 'AC';
            }

            // Find valid existing codes to increment
            const pattern = `BCH-${prefix}-%`;
            // Extract the number part using regex substring 
            const rows = await sql`
                SELECT product_code 
                FROM products 
                WHERE product_code LIKE ${pattern}
                ORDER BY CAST(NULLIF(regexp_replace(product_code, ${'^BCH-' + prefix + '-'}, ''), '') AS INTEGER) DESC
                LIMIT 1
            `;

            let nextNum = 1000;
            if (rows.length > 0) {
                const lastCode = rows[0].product_code;
                const parts = lastCode.split('-');
                const lastNum = parseInt(parts[parts.length - 1]);
                if (!isNaN(lastNum)) {
                    nextNum = lastNum + 1;
                }
            }
            finalProductCode = `BCH-${prefix}-${nextNum}`;
        }

        const discountPercent = basePrice > offerPrice ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0;

        // Handle all images as a comma-separated string for simpler compatibility with both TEXT and array-like usage
        const allImagesString = Array.isArray(allImagesUrls) ? allImagesUrls.join(',') : (primaryImageUrl || null);
        const ramVariantsJson = ramVariants ? JSON.stringify(ramVariants) : null;
        const storageVariantsJson = storageVariants ? JSON.stringify(storageVariants) : null;

        // Insert into the NEW schema columns
        const result = await sql`
            INSERT INTO products (
                product_code, product_name, brand, category, badge, condition_status,
                base_price, offer_price, discount_percent, stock_quantity,
                processor, ram, storage, graphics_card, graphics_storage, screen_size, colors,
                features, primary_image_url, all_images_urls,
                ram_variants, storage_variants
            )
            VALUES (
                ${finalProductCode}, ${productName}, ${brand}, ${category}, ${badge}, ${conditionStatus},
                ${basePrice}, ${offerPrice}, ${discountPercent}, ${stockQuantity},
                ${processor}, ${ram}, ${storage}, ${graphicsCard}, ${graphicsStorage || null}, ${screenSize}, ${colors},
                ${features}, ${primaryImageUrl}, ${allImagesString},
                ${ramVariantsJson}::jsonb, ${storageVariantsJson}::jsonb
            )
            RETURNING product_code
        `;

        return NextResponse.json({ message: 'Product created', id: result[0].product_code }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
