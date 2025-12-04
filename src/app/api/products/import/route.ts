import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// POST /api/products/import - Bulk import products
export async function POST(request: NextRequest) {
    try {
        const { products, category } = await request.json();

        if (!products || !Array.isArray(products)) {
            return NextResponse.json(
                { error: 'Invalid request: products array is required' },
                { status: 400 }
            );
        }

        const imported = [];
        const errors = [];

        for (const product of products) {
            try {
                const result = await sql`
          INSERT INTO products (
            id, code, name, brand, price, offer_price, stock, condition, category,
            processor, ram, storage, screen, graphics, graphics_storage,
            feature, about, features, badge, image, date_added
          ) VALUES (
             ${product.code}, ${product.name}, ${product.brand},
        ${product.price}, ${product.offer_price || product.price}, ${product.stock || 0},
        ${product.condition}, ${product.discount || 0}, ${product.type}, ${product.category},
        ${product.processor || null}, ${product.ram || null}, ${product.storage || null},
        ${product.screen || null}, ${product.graphics || null}, ${product.graphics_storage || null},
        ${product.feature || null}, ${product.about || null}, ${product.features || null},
        ${product.badge || null}, ${product.image || null}, ${product.date_added || new Date().toISOString()}
          )
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            offer_price = EXCLUDED.offer_price,
            stock = EXCLUDED.stock,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
                imported.push(result[0]);
            } catch (error: any) {
                errors.push({ product: product.code, error: error.message });
            }
        }

        return NextResponse.json(
            {
                message: `Imported ${imported.length} products`,
                imported: imported.length,
                errors: errors.length,
                errorDetails: errors,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error importing products:', error);
        return NextResponse.json(
            { error: 'Failed to import products', details: error.message },
            { status: 500 }
        );
    }
}
