import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Product } from '@/lib/schema';

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
            return NextResponse.json({ product: query[0] }, { status: 200 });
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

        return NextResponse.json({ products: query }, { status: 200 });
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
        const product: Product = await request.json();

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
        ${product.badge || null}, ${product.image || null}, ${product.date_added}
      )
      RETURNING *
    `;

        return NextResponse.json({ product: result[0] }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product', details: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/products - Update existing product
export async function PUT(request: NextRequest) {
    try {
        const product: Product = await request.json();

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
        image = ${product.image || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE code = ${product.code}
      RETURNING *
    `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ product: result[0] }, { status: 200 });
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
