import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { sql } from '@/lib/db';

// Helper function to transform database product to frontend format
function transformProduct(dbProduct: any) {
    // Parse images - comma-separated URLs from ImageKit or single image
    // New schema uses 'primary_image_url' and 'all_images_urls' (implicit), 
    // but we might reuse 'image' or map accordingly.

    // Use all_images_urls if available (comma separated), otherwise fall back to primary/legacy
    let images: string[] = [];
    const allImages = dbProduct.all_images_urls || '';
    const rawImage = dbProduct.primary_image_url || dbProduct.image_url || dbProduct.image || '';

    if (allImages) {
        if (allImages.includes(',')) {
            images = allImages.split(',').map((img: string) => img.trim()).filter((img: string) => img);
        } else {
            images = [allImages];
        }
    } else if (rawImage) {
        if (rawImage.includes(',')) {
            images = rawImage.split(',').map((img: string) => img.trim()).filter((img: string) => img);
        } else {
            images = [rawImage];
        }
    }

    // Map new schema fields to frontend expected fields
    return {
        id: dbProduct.id || dbProduct.product_code || dbProduct.code, // Fallback
        productCode: dbProduct.product_code || dbProduct.code,
        name: dbProduct.product_name || dbProduct.name,
        brand: dbProduct.brand || dbProduct.category,
        price: parseFloat(dbProduct.offer_price || dbProduct.base_price || dbProduct.price || 0),
        originalPrice: parseFloat(dbProduct.base_price || dbProduct.price || 0),
        type: (dbProduct.type === 'system' ? 'laptop' : dbProduct.type) || 'laptop',
        images: images,
        createdAt: dbProduct.date_added || dbProduct.created_at,
        stock: parseInt(dbProduct.stock_quantity || dbProduct.stock || dbProduct.quantity || 0),
        description: dbProduct.features || dbProduct.description || dbProduct.about || '',
        features: dbProduct.features || '',
        specifications: {
            Model: dbProduct.model || '',
            Series: dbProduct.series || '',
            Processor: dbProduct.processor || '',
            'Processor Generation': dbProduct.processor_gen || '',
            'Processor Speed': dbProduct.processor_speed || '',
            RAM: dbProduct.ram || '',
            'RAM Type': dbProduct.ram_type || dbProduct.memory_technology || '',
            Storage: dbProduct.storage || '',
            'Storage Type': dbProduct.storage_type || '',
            colors: dbProduct.colors || '',
            Screen: dbProduct.screen_size || dbProduct.screen || '',
            'Screen Resolution': dbProduct.screen_resolution || '',
            'Resolution Pixel': dbProduct.screen_resolution_pixel || '',
            Graphics: dbProduct.graphics_card || dbProduct.graphics || '',
            'Graphics Type': dbProduct.graphics_card_type || '',
            'Graphics Storage': dbProduct.graphics_storage || '',
            Condition: dbProduct.condition_status || dbProduct.condition || 'New',
            'Wireless Type': dbProduct.wireless_type || '',
            'Operating System': dbProduct.operating_system || '',
            'Optical Drive': dbProduct.optical_drive || '',
        },
        badge: dbProduct.badge || '',
        category: dbProduct.category || '',
        ramVariants: dbProduct.ram_variants || [],
        storageVariants: dbProduct.storage_variants || []
    };
}

// GET /api/products
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');
        const categoryFilter = searchParams.get('categoryFilter');
        const code = searchParams.get('code');

        let query;
        if (code) {
            // Try matching product_code or code
            // Note: DB schema upgrade adds 'product_code' but legacy might use 'code'
            query = await sql`SELECT * FROM products WHERE product_code = ${code} OR code = ${code}`;
            if (query.length === 0) {
                // Try id if code is numeric
                if (!isNaN(Number(code))) {
                    query = await sql`SELECT * FROM products WHERE id = ${code}`;
                }
            }

            if (!query || query.length === 0) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            return NextResponse.json({ product: transformProduct(query[0]) }, { status: 200 });
        }

        // List query
        // We use date_added for sorting
        if (type && categoryFilter) {
            // e.g. type=laptop, category=Dell
            query = await sql`SELECT * FROM products WHERE category = ${categoryFilter} ORDER BY date_added DESC`;
        } else if (categoryFilter) {
            query = await sql`SELECT * FROM products WHERE category = ${categoryFilter} ORDER BY date_added DESC`;
        } else if (type === 'laptop') {
            // Include 'system', 'laptop', and associated categories
            query = await sql`SELECT * FROM products WHERE type = 'system' OR type = 'laptop' OR category = 'Laptops' OR category = 'Computers' OR category = 'Renewed Laptops' OR category = 'Gaming Laptop' OR category = 'MacBook' ORDER BY date_added DESC`;
        } else if (type === 'accessory') {
            query = await sql`SELECT * FROM products WHERE type = 'accessory' OR category = 'Accessories' OR category = 'Monitor' OR category = 'Component' ORDER BY date_added DESC`;
        } else {
            query = await sql`SELECT * FROM products ORDER BY date_added DESC`;
        }

        const transformedProducts = query.map(transformProduct);
        return NextResponse.json({ products: transformedProducts }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching products:', error);
        // Return clear error if table is missing or query fails
        return NextResponse.json(
            { error: 'Failed to fetch products', details: error.message },
            { status: 500 }
        );
    }
}

// POST is superseded by /api/admin/inventory/products, but keeping this for public API compatibility if needed.
// For now, removing POST/PUT/DELETE from here to avoid confusion and use the Admin API.
// If valid usage exists, it should be updated to matches schema as well.
