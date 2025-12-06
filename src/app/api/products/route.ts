import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Helper function to transform database product to frontend format
function transformProduct(dbProduct: any) {
    // Parse images - comma-separated URLs from ImageKit or single image
    let images: string[] = [];
    if (dbProduct.image) {
        // Check if it's a comma-separated list of URLs
        if (dbProduct.image.includes(',')) {
            images = dbProduct.image.split(',').map((img: string) => img.trim()).filter((img: string) => img);
        } else {
            images = [dbProduct.image];
        }
    }

    return {
        id: dbProduct.code, // Use code as the unique identifier
        productCode: dbProduct.code,
        name: dbProduct.name,
        brand: dbProduct.brand || dbProduct.category, // Use category as brand if brand is not set
        price: parseFloat(dbProduct.offer_price || dbProduct.price),
        originalPrice: dbProduct.price !== dbProduct.offer_price ? parseFloat(dbProduct.price) : undefined,
        type: dbProduct.type,
        images: images,
        createdAt: dbProduct.date_added || dbProduct.created_at,
        stock: parseInt(dbProduct.stock) || 0,
        description: dbProduct.about || dbProduct.feature,
        specifications: {
            ...(dbProduct.processor && { Processor: dbProduct.processor }),
            ...(dbProduct.ram && { RAM: dbProduct.ram }),
            ...(dbProduct.storage && { Storage: dbProduct.storage }),
            ...(dbProduct.screen && { Screen: dbProduct.screen }),
            ...(dbProduct.graphics && { Graphics: dbProduct.graphics }),
            ...(dbProduct.graphics_storage && { 'Graphics Storage': dbProduct.graphics_storage }),
            ...(dbProduct.condition && { Condition: dbProduct.condition }),
        },
        colors: dbProduct.colors ? dbProduct.colors.split(',').map((c: string) => c.trim()) : [],
    };
}

// GET /api/products?type=laptop|accessory&category=Dell|HP|etc
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || searchParams.get('category'); // Support both for backward compatibility
        const categoryFilter = searchParams.get('categoryFilter'); // For brand filtering
        const code = searchParams.get('code');

        let query;
        if (code) {
            query = await sql`SELECT * FROM products WHERE code = ${code}`;
            if (query.length === 0) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            return NextResponse.json({ product: transformProduct(query[0]) }, { status: 200 });
        } else if (type && categoryFilter) {
            // Filter by both type and category (brand)
            query = await sql`SELECT * FROM products WHERE type = ${type} AND category = ${categoryFilter} ORDER BY created_at DESC`;
        } else if (type) {
            // Filter by type only (laptop or accessory)
            query = await sql`SELECT * FROM products WHERE type = ${type} ORDER BY created_at DESC`;
        } else if (categoryFilter) {
            // Filter by category (brand) only
            query = await sql`SELECT * FROM products WHERE category = ${categoryFilter} ORDER BY created_at DESC`;
        } else {
            query = await sql`SELECT * FROM products ORDER BY created_at DESC`;
        }

        // Transform all products to frontend format
        const transformedProducts = query.map(transformProduct);
        return NextResponse.json({ products: transformedProducts }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
    try {
        const product: any = await request.json();

        // Store images as comma-separated URLs for ImageKit
        const imageData = product.images && Array.isArray(product.images) && product.images.length > 0
            ? product.images.join(',')
            : (product.image || null);

        try {
            // Try with colors column first
            const result = await sql`
              INSERT INTO products (
                code, name, brand, price, offer_price, stock, condition, discount, type, category,
                processor, ram, storage, screen, graphics, graphics_storage,
                feature, about, features, badge, image, colors, date_added
              ) VALUES (
                ${product.code}, ${product.name}, ${product.brand},
                ${product.price}, ${product.offer_price || product.price}, ${product.stock || 0},
                ${product.condition}, ${product.discount || 0}, ${product.type}, ${product.category},
                ${product.processor || null}, ${product.ram || null}, ${product.storage || null},
                ${product.screen || null}, ${product.graphics || null}, ${product.graphics_storage || null},
                ${product.feature || null}, ${product.about || null}, ${product.features || null},
                ${product.badge || null}, ${imageData}, ${product.colors || null}, ${product.date_added}
              )
              RETURNING *
            `;
            return NextResponse.json({ product: result[0] }, { status: 201 });
        } catch (error: any) {
            console.error('First attempt failed:', error.message);

            // If colors column doesn't exist, try without it
            if (error.message && (error.message.includes('colors') || error.message.includes('column') || error.code === '42703')) {
                console.warn('⚠️ Colors column not found, inserting without it. Run: POST /api/migrate');
                try {
                    const result = await sql`
                      INSERT INTO products (
                        code, name, brand, price, offer_price, stock, condition, discount, type, category,
                        processor, ram, storage, screen, graphics, graphics_storage,
                        feature, about, features, badge, image, date_added
                      ) VALUES (
                        ${product.code}, ${product.name}, ${product.brand},
                        ${product.price}, ${product.offer_price || product.price}, ${product.stock || 0},
                        ${product.condition}, ${product.discount || 0}, ${product.type}, ${product.category},
                        ${product.processor || null}, ${product.ram || null}, ${product.storage || null},
                        ${product.screen || null}, ${product.graphics || null}, ${product.graphics_storage || null},
                        ${product.feature || null}, ${product.about || null}, ${product.features || null},
                        ${product.badge || null}, ${imageData}, ${product.date_added}
                      )
                      RETURNING *
                    `;
                    return NextResponse.json({ product: result[0] }, { status: 201 });
                } catch (fallbackError: any) {
                    console.error('Fallback insert also failed:', fallbackError);
                    throw fallbackError;
                }
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Error creating product:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        return NextResponse.json(
            { error: 'Failed to create product', details: error.message, code: error.code },
            { status: 500 }
        );
    }
}

// PUT /api/products - Update existing product
export async function PUT(request: NextRequest) {
    try {
        const product: any = await request.json();

        // Store images as comma-separated URLs for ImageKit
        const imageData = product.images && Array.isArray(product.images) && product.images.length > 0
            ? product.images.join(',')
            : (product.image || null);

        try {
            // Try with colors column first
            const result = await sql`
              UPDATE products SET
                name = ${product.name},
                brand = ${product.brand},
                price = ${product.price},
                offer_price = ${product.offer_price || product.price},
                stock = ${product.stock || 0},
                condition = ${product.condition},
                discount = ${product.discount || 0},
                type = ${product.type},
                category = ${product.category},
                processor = ${product.processor || null},
                ram = ${product.ram || null},
                storage = ${product.storage || null},
                screen = ${product.screen || null},
                graphics = ${product.graphics || null},
                graphics_storage = ${product.graphics_storage || null},
                feature = ${product.feature || null},
                about = ${product.about || null},
                features = ${product.features || null},
                badge = ${product.badge || null},
                image = ${imageData},
                colors = ${product.colors || null},
                updated_at = CURRENT_TIMESTAMP
              WHERE code = ${product.code}
              RETURNING *
            `;

            if (result.length === 0) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            return NextResponse.json({ product: result[0] }, { status: 200 });
        } catch (error: any) {
            // If colors column doesn't exist, try without it
            if (error.message && error.message.includes('colors')) {
                console.warn('Colors column not found, updating without it. Run migration: POST /api/migrate');
                const result = await sql`
                  UPDATE products SET
                    name = ${product.name},
                    brand = ${product.brand},
                    price = ${product.price},
                    offer_price = ${product.offer_price || product.price},
                    stock = ${product.stock || 0},
                    condition = ${product.condition},
                    discount = ${product.discount || 0},
                    type = ${product.type},
                    category = ${product.category},
                    processor = ${product.processor || null},
                    ram = ${product.ram || null},
                    storage = ${product.storage || null},
                    screen = ${product.screen || null},
                    graphics = ${product.graphics || null},
                    graphics_storage = ${product.graphics_storage || null},
                    feature = ${product.feature || null},
                    about = ${product.about || null},
                    features = ${product.features || null},
                    badge = ${product.badge || null},
                    image = ${imageData},
                    updated_at = CURRENT_TIMESTAMP
                  WHERE code = ${product.code}
                  RETURNING *
                `;

                if (result.length === 0) {
                    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
                }

                return NextResponse.json({ product: result[0] }, { status: 200 });
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { error: 'Failed to update product', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/products?code=XXX
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Product code is required' }, { status: 400 });
        }

        const result = await sql`DELETE FROM products WHERE code = ${code} RETURNING *`;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { error: 'Failed to delete product', details: error.message },
            { status: 500 }
        );
    }
}
