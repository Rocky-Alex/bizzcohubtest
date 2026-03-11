import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { sql } from '@/lib/db';
import { Product, DatabaseProduct } from '@/types';

// Helper function to transform database product to frontend format
function transformProduct(dbProduct: DatabaseProduct): Product {
    // Parse images - comma-separated URLs from ImageKit or single image
    // New schema uses 'primary_image_url' and 'all_images_urls' (implicit), 
    // but we might reuse 'image' or map accordingly.

    // Use all_images_urls if available (comma separated), otherwise fall back to primary/legacy
    let images: string[] = [];
    const allImages = dbProduct.all_images_urls || '';
    const rawImage = dbProduct.primary_image_url || dbProduct.image_url || dbProduct.image || '';

    if (allImages) {
        if (typeof allImages === 'string' && allImages.includes(',')) {
            images = allImages.split(',').map((img: string) => img.trim()).filter((img: string) => img);
        } else {
            images = [String(allImages)];
        }
    } else if (rawImage) {
        if (typeof rawImage === 'string' && rawImage.includes(',')) {
            images = rawImage.split(',').map((img: string) => img.trim()).filter((img: string) => img);
        } else {
            images = [String(rawImage)];
        }
    }

    // Map new schema fields to frontend expected fields
    return {
        id: dbProduct.id || dbProduct.product_code || dbProduct.code || '', // Fallback
        productCode: dbProduct.product_code || dbProduct.code || '',
        name: dbProduct.product_name || dbProduct.name || '',
        brand: dbProduct.brand || dbProduct.category || '',
        price: parseFloat(String(dbProduct.offer_price || dbProduct.base_price || dbProduct.price || 0)),
        originalPrice: parseFloat(String(dbProduct.base_price || dbProduct.price || 0)),
        type: (dbProduct.type === 'system' ? 'laptop' : dbProduct.type) || 'laptop',
        images: images,
        image: images[0] || '',
        createdAt: dbProduct.date_added || dbProduct.created_at || '',
        stock: parseInt(String(dbProduct.stock_quantity || dbProduct.stock || dbProduct.quantity || 0)),
        description: dbProduct.features || dbProduct.description || dbProduct.about || '',
        features: dbProduct.features || '',
        specifications: {
            Model: dbProduct.model || '',
            Series: dbProduct.series || '',
            Processor: dbProduct.processor || '',
            'Processor Generation': dbProduct.processor_gen || '',
            'Processor Speed': dbProduct.processor_speed || '',
            RAM: dbProduct.ram || '',
            'RAM Type': dbProduct.ram_type || '', // Removed memory_technology for simplicity in schema
            Storage: dbProduct.storage || '',
            'Storage Type': dbProduct.storage_type || '',
            colors: dbProduct.colors || '',
            Screen: dbProduct.screen_size || '',
            'Screen Resolution': dbProduct.screen_resolution || '',
            'Resolution Pixel': dbProduct.screen_resolution_pixel || '',
            'Display Type': dbProduct.display_type || '', // Added Display Type mapping
            Graphics: dbProduct.graphics_card || '',
            'Graphics Type': dbProduct.graphics_card_type || '',
            'Graphics Storage': dbProduct.graphics_storage || '',
            Condition: dbProduct.condition_status || 'New',
            'Wireless Type': dbProduct.wireless_type || '',
            'Operating System': dbProduct.operating_system || '',
            'Optical Drive': dbProduct.optical_drive || '',
        },
        badge: dbProduct.badge || '',
        category: dbProduct.category || '',
        rating: dbProduct.rating || 5,
        reviews: dbProduct.reviews || 0,
        ramVariants: dbProduct.ram_variants || '',
        storageVariants: dbProduct.storage_variants || ''
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
            query = await sql`SELECT * FROM products WHERE product_code ILIKE ${code} OR code ILIKE ${code}` as unknown as DatabaseProduct[];
            if (query.length === 0) {
                // Try id if code is numeric
                if (!isNaN(Number(code))) {
                    query = await sql`SELECT * FROM products WHERE id = ${code}` as unknown as DatabaseProduct[];
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
            query = await sql`SELECT * FROM products WHERE category = ${categoryFilter} ORDER BY date_added DESC` as unknown as DatabaseProduct[];
        } else if (categoryFilter) {
            query = await sql`SELECT * FROM products WHERE category = ${categoryFilter} ORDER BY date_added DESC` as unknown as DatabaseProduct[];
        } else if (type === 'laptop') {
            // Include 'system', 'laptop', and associated categories
            query = await sql`SELECT * FROM products WHERE type = 'system' OR type = 'laptop' OR category = 'Laptops' OR category = 'Computers' OR category = 'Renewed Laptops' OR category = 'Gaming Laptop' OR category = 'MacBook' ORDER BY date_added DESC` as unknown as DatabaseProduct[];
        } else if (type === 'accessory') {
            query = await sql`SELECT * FROM products WHERE type = 'accessory' OR category = 'Accessories' OR category = 'Monitor' OR category = 'Component' ORDER BY date_added DESC` as unknown as DatabaseProduct[];
        } else {
            query = await sql`SELECT * FROM products ORDER BY date_added DESC` as unknown as DatabaseProduct[];
        }

        const transformedProducts = query.map(transformProduct);
        return NextResponse.json({ products: transformedProducts }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching products:', error);
        // Return clear error if table is missing or query fails
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to fetch products', details: errorMessage },
            { status: 500 }
        );
    }
}

// POST is superseded by /api/bch/inventory/products, but keeping this for public API compatibility if needed.
// For now, removing POST/PUT/DELETE from here to avoid confusion and use the Admin API.
// If valid usage exists, it should be updated to matches schema as well.
