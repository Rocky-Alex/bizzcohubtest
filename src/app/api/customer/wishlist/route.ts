
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { customer_id, product_id } = await req.json();

        if (!customer_id || !product_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS wishlist (
                id SERIAL PRIMARY KEY,
                customer_id VARCHAR(255) NOT NULL,
                product_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(customer_id, product_id)
            );
        `;

        // Check if exists
        const exists = await sql`
            SELECT id FROM wishlist 
            WHERE customer_id = ${customer_id} AND product_id = ${product_id}
        `;

        if (exists.length > 0) {
            return NextResponse.json({ message: 'Product already in wishlist' }, { status: 200 });
        }

        // Add to wishlist
        await sql`
            INSERT INTO wishlist (customer_id, product_id)
            VALUES (${customer_id}, ${product_id})
        `;

        return NextResponse.json({ message: 'Added to wishlist successfully' }, { status: 201 });

    } catch (error) {
        console.error('Wishlist POST error:', error);
        return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const customer_id = searchParams.get('customer_id');

        if (!customer_id) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS wishlist (
                id SERIAL PRIMARY KEY,
                customer_id VARCHAR(255) NOT NULL,
                product_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(customer_id, product_id)
            );
        `;

        // Fetch wishlist items with product details
        const wishlistItems = await sql`
            SELECT 
                w.id as wishlist_id,
                w.created_at as wishlist_date,
                p.*
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.customer_id = ${customer_id}
            ORDER BY w.created_at DESC
        `;

        // Transform to match frontend interface
        const transformedItems = wishlistItems.map((item: any) => {
            // Image logic matches main product API
            let images: string[] = [];
            const allImages = item.all_images_urls || '';
            const rawImage = item.primary_image_url || item.image_url || item.image || '';

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

            return {
                wishlist_id: item.wishlist_id,
                created_at: item.wishlist_date,
                id: item.id,
                name: item.product_name || item.name,
                price: parseFloat(item.offer_price || item.base_price || item.price || 0),
                originalPrice: parseFloat(item.base_price || item.price || 0),
                type: (item.type === 'system' ? 'laptop' : item.type) || 'laptop',
                images: images,
                productCode: item.product_code || item.code
            };
        });

        return NextResponse.json({ wishlist: transformedItems }, { status: 200 });

    } catch (error) {
        console.error('Wishlist GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id'); // wishlist_id
        const customer_id = searchParams.get('customer_id');
        const product_id = searchParams.get('product_id');

        if (id) {
            await sql`DELETE FROM wishlist WHERE id = ${id}`;
        } else if (customer_id && product_id) {
            await sql`DELETE FROM wishlist WHERE customer_id = ${customer_id} AND product_id = ${product_id}`;
        } else {
            return NextResponse.json({ error: 'ID or (customer_id and product_id) required' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Removed from wishlist' }, { status: 200 });

    } catch (error) {
        console.error('Wishlist DELETE error:', error);
        return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
    }
}
