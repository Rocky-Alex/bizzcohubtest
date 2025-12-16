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
            model,
            series,
            category,
            badge,
            conditionStatus,
            basePrice,
            offerPrice,
            stockQuantity,
            processorName,
            processorGen,
            processorSpeed,
            ram,
            ramType,
            storage,
            storageType,
            graphicsCard,
            graphicsType,
            graphicsStorage,
            screenSize,
            screenResolution,
            screenResolutionPixel,
            wirelessType,
            operatingSystem,
            opticalDrive,
            colors,
            features,
            primaryImageUrl,
            allImagesUrls,
            ramVariants,
            storageVariants,
            type,
            displayType // Added displayType
        } = body;

        // Ensure new columns exist for variants (Simple auto-migration)
        try {
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS type TEXT`; // Ensure type column exists
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS ram_variants JSONB`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_variants JSONB`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS model TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS series TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS processor_gen TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS processor_speed TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS ram_type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS graphics_card_type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS screen_resolution TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS screen_resolution_pixel TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS display_type TEXT`; // Added display_type
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS wireless_type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS operating_system TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS optical_drive TEXT`;
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
            if (type === 'accessory' || catLower.includes('accessor') || catLower.includes('component') || catLower.includes('monitor')) {
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
                product_code, product_name, type, brand, model, series, category, badge, condition_status,
                base_price, offer_price, discount_percent, stock_quantity,
                processor, processor_gen, processor_speed, ram, ram_type, storage, storage_type, graphics_card, graphics_card_type, graphics_storage, screen_size, screen_resolution, screen_resolution_pixel, display_type, wireless_type, operating_system, optical_drive, colors,
                features, primary_image_url, all_images_urls,
                ram_variants, storage_variants
            )
            VALUES (
                ${finalProductCode}, ${productName}, ${type}, ${brand}, ${model}, ${series}, ${category}, ${badge}, ${conditionStatus},
                ${basePrice}, ${offerPrice}, ${discountPercent}, ${stockQuantity},
                ${processorName}, ${processorGen}, ${processorSpeed}, ${ram}, ${ramType}, ${storage}, ${storageType}, ${graphicsCard}, ${graphicsType}, ${graphicsStorage || null}, ${screenSize}, ${screenResolution}, ${screenResolutionPixel}, ${displayType}, ${wirelessType}, ${operatingSystem}, ${opticalDrive}, ${colors},
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

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const sql = getSql();
        // Try deleting by ID first, if that fails (e.g. 0 rows), maybe try by product_code if your logic requires it, 
        // but typically 'id' from the frontend object refers to the PK.
        const result = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product deleted' });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const sql = getSql();
        const body = await req.json();

        // Destructure fields similar to POST
        const {
            id, // We need the ID to identify which product to update
            productName,
            // productCode, // Generally shouldn't update product code, or handle carefully
            brand,
            model,
            series,
            category,
            badge,
            conditionStatus,
            basePrice,
            offerPrice,
            stockQuantity,
            processorName,
            processorGen,
            processorSpeed,
            ram,
            ramType,
            storage,
            storageType,
            graphicsCard,
            graphicsType,
            graphicsStorage,
            screenSize,
            screenResolution,
            screenResolutionPixel,
            wirelessType,
            operatingSystem,
            opticalDrive,
            colors,
            features,
            primaryImageUrl,
            allImagesUrls,
            ramVariants,
            storageVariants,
            type,
            displayType // Added displayType
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
        }

        const discountPercent = basePrice > offerPrice ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0;
        const allImagesString = Array.isArray(allImagesUrls) ? allImagesUrls.join(',') : (primaryImageUrl || null);
        const ramVariantsJson = ramVariants ? JSON.stringify(ramVariants) : null;
        const storageVariantsJson = storageVariants ? JSON.stringify(storageVariants) : null;

        // Ensure new columns exist (Simple auto-migration) - Same as POST
        try {
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS ram_variants JSONB`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_variants JSONB`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS model TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS series TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS processor_gen TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS processor_speed TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS ram_type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS graphics_card_type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS screen_resolution TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS screen_resolution_pixel TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS display_type TEXT`; // Added display_type
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS wireless_type TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS operating_system TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS optical_drive TEXT`;
        } catch (e) {
            console.log('Migration note in PUT:', e);
        }

        // Perform Update
        const result = await sql`
            UPDATE products SET
                product_name = ${productName},
                type = ${type},
                brand = ${brand},
                model = ${model},
                series = ${series},
                category = ${category},
                badge = ${badge},
                condition_status = ${conditionStatus},
                base_price = ${basePrice},
                offer_price = ${offerPrice},
                discount_percent = ${discountPercent},
                stock_quantity = ${stockQuantity},
                processor = ${processorName},
                processor_gen = ${processorGen},
                processor_speed = ${processorSpeed},
                ram = ${ram},
                ram_type = ${ramType},
                storage = ${storage},
                storage_type = ${storageType},
                graphics_card = ${graphicsCard},
                graphics_card_type = ${graphicsType},
                graphics_storage = ${graphicsStorage || null},
                screen_size = ${screenSize},
                screen_resolution = ${screenResolution},
                screen_resolution_pixel = ${screenResolutionPixel},
                display_type = ${displayType},
                wireless_type = ${wirelessType},
                operating_system = ${operatingSystem},
                optical_drive = ${opticalDrive},
                colors = ${colors},
                features = ${features},
                primary_image_url = ${primaryImageUrl},
                all_images_urls = ${allImagesString},
                ram_variants = ${ramVariantsJson}::jsonb,
                storage_variants = ${storageVariantsJson}::jsonb
            WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product updated successfully', id: result[0].id });

    } catch (error: any) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
