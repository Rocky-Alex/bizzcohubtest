import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Helper function to generate next sequential code
async function generateNextCode(type: string): Promise<string> {
    const prefix = type === 'laptop' ? 'BCH-LP' : 'BCH-AC';

    try {
        // Query database for the highest code across ALL products (both BCH-LP and BCH-AC)
        const result = await sql`
            SELECT code FROM products 
            WHERE code LIKE 'BCH-%'
            ORDER BY code DESC
            LIMIT 1
        `;

        let nextNumber = 1000;
        if (result.length > 0) {
            const lastCode = result[0].code;
            const match = lastCode.match(/-(\d+)$/);
            if (match) {
                const lastNumber = parseInt(match[1], 10);
                nextNumber = lastNumber + 1;
            }
        }

        return `${prefix}-${nextNumber}`;
    } catch (error) {
        console.error('Error generating sequential code:', error);
        // Fallback to timestamp-based code
        return `${prefix}-${Date.now()}`;
    }
}

// POST /api/products/import - Bulk import products
export async function POST(request: NextRequest) {
    try {
        const { products } = await request.json();

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
                // Generate code if not provided
                if (!product.code) {
                    product.code = await generateNextCode(product.type);
                }

                // Handle images - convert array to comma-separated string
                const imageData = product.images && Array.isArray(product.images) && product.images.length > 0
                    ? product.images.join(',')
                    : (product.image || null);

                // Try with colors column first
                try {
                    const result = await sql`
                        INSERT INTO products (
                            code, name, brand, price, offer_price, stock, condition, discount, type, category,
                            processor, ram, storage, screen, graphics, graphics_storage,
                            feature, about, features, badge, image, colors, date_added
                        ) VALUES (
                            ${product.code}, ${product.name}, ${product.brand || product.category},
                            ${product.price}, ${product.offer_price || product.price}, ${product.stock || 0},
                            ${product.condition || 'New'}, ${product.discount || 0}, ${product.type}, ${product.category},
                            ${product.processor || null}, ${product.ram || null}, ${product.storage || null},
                            ${product.screen || null}, ${product.graphics || null}, ${product.graphics_storage || product.graphicsStorage || null},
                            ${product.feature || null}, ${product.about || null}, ${product.features || null},
                            ${product.badge || null}, ${imageData}, ${product.colors || null}, 
                            ${product.date_added || new Date().toISOString().split('T')[0]}
                        )
                        ON CONFLICT (code) DO UPDATE SET
                            name = EXCLUDED.name,
                            brand = EXCLUDED.brand,
                            price = EXCLUDED.price,
                            offer_price = EXCLUDED.offer_price,
                            stock = EXCLUDED.stock,
                            condition = EXCLUDED.condition,
                            discount = EXCLUDED.discount,
                            processor = EXCLUDED.processor,
                            ram = EXCLUDED.ram,
                            storage = EXCLUDED.storage,
                            screen = EXCLUDED.screen,
                            graphics = EXCLUDED.graphics,
                            graphics_storage = EXCLUDED.graphics_storage,
                            feature = EXCLUDED.feature,
                            about = EXCLUDED.about,
                            features = EXCLUDED.features,
                            badge = EXCLUDED.badge,
                            image = EXCLUDED.image,
                            colors = EXCLUDED.colors,
                            updated_at = CURRENT_TIMESTAMP
                        RETURNING *
                    `;
                    imported.push(result[0]);
                } catch (colorsError: any) {
                    // If colors column doesn't exist, try without it
                    if (colorsError.message && colorsError.message.includes('colors')) {
                        const result = await sql`
                            INSERT INTO products (
                                code, name, brand, price, offer_price, stock, condition, discount, type, category,
                                processor, ram, storage, screen, graphics, graphics_storage,
                                feature, about, features, badge, image, date_added
                            ) VALUES (
                                ${product.code}, ${product.name}, ${product.brand || product.category},
                                ${product.price}, ${product.offer_price || product.price}, ${product.stock || 0},
                                ${product.condition || 'New'}, ${product.discount || 0}, ${product.type}, ${product.category},
                                ${product.processor || null}, ${product.ram || null}, ${product.storage || null},
                                ${product.screen || null}, ${product.graphics || null}, ${product.graphics_storage || product.graphicsStorage || null},
                                ${product.feature || null}, ${product.about || null}, ${product.features || null},
                                ${product.badge || null}, ${imageData}, 
                                ${product.date_added || new Date().toISOString().split('T')[0]}
                            )
                            ON CONFLICT (code) DO UPDATE SET
                                name = EXCLUDED.name,
                                brand = EXCLUDED.brand,
                                price = EXCLUDED.price,
                                offer_price = EXCLUDED.offer_price,
                                stock = EXCLUDED.stock,
                                condition = EXCLUDED.condition,
                                discount = EXCLUDED.discount,
                                processor = EXCLUDED.processor,
                                ram = EXCLUDED.ram,
                                storage = EXCLUDED.storage,
                                screen = EXCLUDED.screen,
                                graphics = EXCLUDED.graphics,
                                graphics_storage = EXCLUDED.graphics_storage,
                                feature = EXCLUDED.feature,
                                about = EXCLUDED.about,
                                features = EXCLUDED.features,
                                badge = EXCLUDED.badge,
                                image = EXCLUDED.image,
                                updated_at = CURRENT_TIMESTAMP
                            RETURNING *
                        `;
                        imported.push(result[0]);
                    } else {
                        throw colorsError;
                    }
                }
            } catch (error: any) {
                console.error(`Error importing product ${product.code}:`, error);
                errors.push({ product: product.code || product.name, error: error.message });
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
