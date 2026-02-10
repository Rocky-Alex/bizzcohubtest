import { sql } from '@/lib/db';
import { Product, DatabaseProduct } from '@/types';

export function transformProduct(dbProduct: DatabaseProduct): Product {
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

    return {
        id: dbProduct.id || dbProduct.product_code || dbProduct.code || '',
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
        badge: dbProduct.badge || '',
        category: dbProduct.category || '',
        rating: dbProduct.rating || 5, // Default rating
        reviews: dbProduct.reviews || 0,
        specifications: {
            'Processor': dbProduct.processor,
            'Processor Generation': dbProduct.processor_gen,
            'Processor Speed': dbProduct.processor_speed,
            'RAM': dbProduct.ram,
            'RAM Type': dbProduct.ram_type,
            'Storage': dbProduct.storage,
            'Storage Type': dbProduct.storage_type,
            'Graphics': dbProduct.graphics_card,
            'Graphics Type': dbProduct.graphics_card_type,
            'Graphics Storage': dbProduct.graphics_storage,
            'Screen': dbProduct.screen_size,
            'Screen Resolution': dbProduct.screen_resolution,
            'Resolution Pixel': dbProduct.screen_resolution_pixel,
            'Display Type': dbProduct.display_type,
            'Operating System': dbProduct.operating_system,
            'Wireless Type': dbProduct.wireless_type,
            'Optical Drive': dbProduct.optical_drive,
            'Condition': dbProduct.condition_status,
            'Model': dbProduct.model,
            'Series': dbProduct.series,
            'colors': dbProduct.colors
        },
        ramVariants: dbProduct.ram_variants,
        storageVariants: dbProduct.storage_variants
    };
}

export async function getFeaturedProducts(limit = 10): Promise<Product[]> {
    try {
        // 1. Try to fetch manual configuration
        try {
            // JOIN Query to strictly match Admin Panel logic
            const products = await sql`
                        SELECT p.* 
                        FROM featured_products_config c
                        INNER JOIN products p ON (
                            TRIM(UPPER(p.product_code)) = TRIM(UPPER(c.product_code)) 
                            OR p.id::text = c.product_code
                        )
                        ORDER BY c.slot_number ASC
                     ` as unknown as DatabaseProduct[];

            // Strict Mode: If table exists, return what we found (even if empty).
            return products.map(transformProduct);

        } catch (tableError) {
            console.log('Featured config table may not exist yet or error:', tableError);
            // Only fallback if the system is not set up (table missing)
            const query = await sql`
                SELECT * FROM products 
                WHERE (product_name NOT ILIKE '%test%' AND product_name NOT ILIKE '%sample%' AND product_name NOT ILIKE '%dummy%' AND product_name NOT ILIKE '%demo%')
                AND (price > 0 OR offer_price > 0)
                ORDER BY date_added DESC 
                LIMIT ${limit}
            ` as unknown as DatabaseProduct[];
            return query.map(transformProduct);
        }
    } catch (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }
}

export async function getProducts(options: {
    type?: string,
    category?: string,
    brand?: string,
    priceRange?: string,
    sortBy?: string,
    limit?: number
} = {}): Promise<Product[]> {
    try {
        const { type, category, brand, priceRange, sortBy, limit } = options;

        let query: DatabaseProduct[];
        if (type === 'laptop') {
            query = await sql`SELECT * FROM products WHERE (type = 'system' OR type = 'laptop' OR category = 'Laptops' OR category = 'Computers' OR category = 'Renewed Laptops' OR category = 'Gaming Laptop' OR category = 'MacBook') ORDER BY date_added DESC` as unknown as DatabaseProduct[];
        } else if (type === 'accessory') {
            query = await sql`SELECT * FROM products WHERE (type = 'accessory' OR category = 'Accessories' OR category = 'Monitor' OR category = 'Component') ORDER BY date_added DESC` as unknown as DatabaseProduct[];
        } else {
            query = await sql`SELECT * FROM products ORDER BY date_added DESC` as unknown as DatabaseProduct[];
        }

        let products = query.map(transformProduct);

        if (category && category !== 'all') {
            products = products.filter((p: Product) => p.category === category);
        }
        if (brand && brand !== 'all') {
            products = products.filter((p: Product) => p.brand === brand);
        }

        // Filter by price range
        if (priceRange && priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            if (max) {
                products = products.filter((p: Product) => p.price >= min && p.price <= max);
            } else {
                products = products.filter((p: Product) => p.price >= min);
            }
        }

        // Sort products
        switch (sortBy) {
            case 'newest':
                products.sort((a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'oldest':
                products.sort((a: Product, b: Product) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case 'price-low':
                products.sort((a: Product, b: Product) => a.price - b.price);
                break;
            case 'price-high':
                products.sort((a: Product, b: Product) => b.price - a.price);
                break;
            case 'name':
                products.sort((a: Product, b: Product) => a.name.localeCompare(b.name));
                break;
        }

        if (limit) {
            products = products.slice(0, limit);
        }

        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

export async function getProductById(id: string): Promise<Product | null> {
    try {
        // Try matching product_code or id
        const query = await sql`SELECT * FROM products WHERE id = ${id} OR product_code = ${id} LIMIT 1` as unknown as DatabaseProduct[];

        if (query.length === 0) {
            // Try numeric id if possible
            if (!isNaN(Number(id))) {
                const numericQuery = await sql`SELECT * FROM products WHERE id = ${Number(id)} LIMIT 1` as unknown as DatabaseProduct[];
                if (numericQuery.length > 0) return transformProduct(numericQuery[0]);
            }
            return null;
        }

        return transformProduct(query[0]);
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        return null;
    }
}
