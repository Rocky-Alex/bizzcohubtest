import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { DropListItem } from '@/types';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        // Schema Migration: Ensure 'parent' column exists
        try {
            await sql`ALTER TABLE drop_lists ADD COLUMN IF NOT EXISTS parent TEXT`;
        } catch (e) {
            console.warn('Could not update drop_lists schema:', e);
        }

        const { searchParams } = new URL(req.url);
        const categoryParam = searchParams.get('category');
        const parentParam = searchParams.get('parent');

        if (!categoryParam) {
            return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
        }

        const categories = categoryParam.split(',');
        const resultsMap: Record<string, any[]> = {};

        for (const category of categories) {
            let data: any[] = [];
            const isLaptopRelated = ['Laptop', 'Brand', 'Series', 'Model'].includes(category);

            if (isLaptopRelated) {
                try {
                    // Try to get from products table
                    data = await sql`SELECT DISTINCT brand, series, model FROM products WHERE category ILIKE '%Laptop%' OR type = 'laptop'` as unknown as any[];
                } catch (e: unknown) {
                    data = [];
                }

                try {
                    const masterData = await sql`
                        SELECT id, category, value, brand, series, model, parent 
                        FROM drop_lists 
                        WHERE category IN ('Laptop', 'Brand', 'Series', 'Model', 'Laptop Related') 
                        ORDER BY created_at DESC
                    ` as unknown as DropListItem[];

                    const normalizedMaster = masterData.map((item) => ({
                        id: item.id,
                        brand: item.category === 'Brand' ? (item.brand || item.value) : item.brand,
                        series: item.category === 'Series' ? (item.series || item.value) : item.series,
                        model: (item.category === 'Model' || item.category === 'Laptop') ? (item.model || item.value) : item.model,
                        parent: item.parent
                    }));

                    if (normalizedMaster.length > 0) {
                        const combined = [...normalizedMaster, ...data];
                        const seen = new Set();
                        data = combined.filter((item) => {
                            const b = (item.brand || '').toString().trim();
                            const s = (item.series || '').toString().trim();
                            const m = (item.model || '').toString().trim();
                            const key = `${b}|${s}|${m}`;
                            if (!b && !s && !m) return false;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });
                    }
                } catch (e: unknown) {
                    data = data || [];
                }
            } else {
                try {
                    if (parentParam) {
                        data = await sql`SELECT id, value, parent FROM drop_lists WHERE category = ${category} AND parent ILIKE ${'%' + parentParam + '%'} ORDER BY created_at DESC` as unknown as any[];
                    } else {
                        data = await sql`SELECT id, value, parent FROM drop_lists WHERE category = ${category} ORDER BY created_at DESC` as unknown as any[];
                    }
                } catch (e: unknown) {
                    data = [];
                }

                let derivedData: any[] = [];
                try {
                    if (category === 'RAM') derivedData = await sql`SELECT DISTINCT ram as value FROM products WHERE ram IS NOT NULL AND ram != ''` as unknown as any[];
                    else if (category === 'Storage') derivedData = await sql`SELECT DISTINCT storage as value FROM products WHERE storage IS NOT NULL AND storage != ''` as unknown as any[];
                    else if (category === 'Graphics') derivedData = await sql`SELECT DISTINCT graphics_card as value FROM products WHERE graphics_card IS NOT NULL AND graphics_card != ''` as unknown as any[];
                    else if (category === 'Processor') derivedData = await sql`SELECT DISTINCT processor as value FROM products WHERE processor IS NOT NULL AND processor != ''` as unknown as any[];
                    else if (category === 'Condition') derivedData = await sql`SELECT DISTINCT condition_status as value FROM products WHERE condition_status IS NOT NULL AND condition_status != ''` as unknown as any[];
                    else if (category === 'Brand') derivedData = await sql`SELECT DISTINCT brand as value FROM products WHERE brand IS NOT NULL AND brand != ''` as unknown as any[];
                } catch (e: unknown) { }

                if (derivedData.length > 0) {
                    const combined = [...data, ...derivedData];
                    const seen = new Set();
                    data = combined.filter((item) => {
                        const val = (item.value || '').toString().toLowerCase().trim();
                        // For dependent lists (like Gen), ensure we respect the parent filter if it exists
                        // But derived data comes from products table which might not have parent info structured the same way
                        // So we mainly rely on drop_lists for structured parent-child relationships
                        if (!val || seen.has(val)) return false;
                        seen.add(val);
                        return true;
                    });
                }
            }
            resultsMap[category] = data;
        }

        // If only one category requested, return it flat for backward compatibility if needed, 
        // or return the map. Let's return the data if one category, else the map.
        if (categories.length === 1) {
            return NextResponse.json({ success: true, data: resultsMap[categories[0]] });
        }

        return NextResponse.json({ success: true, categoryData: resultsMap });
    } catch (error: unknown) {
        console.error('Error fetching droplists:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}


export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { category, brand, series, model, value, parent } = body;

        await sql`
            INSERT INTO drop_lists (category, brand, series, model, value, parent)
            VALUES (${category}, ${brand || null}, ${series || null}, ${model || null}, ${value || model || ''}, ${parent || null})
        `;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error adding droplist item:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function PATCH(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { id, brand, series, model, value, parent } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        await sql`
            UPDATE drop_lists 
            SET brand = ${brand || null}, 
                series = ${series || null}, 
                model = ${model || null}, 
                value = ${value || model || ''},
                parent = ${parent || null}
            WHERE id = ${id}
        `;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error updating droplist item:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const category = searchParams.get('category');
        const name = searchParams.get('name');

        const body = await req.json().catch(() => ({}));
        const { ids, names } = body;

        if (id) {
            await sql`DELETE FROM drop_lists WHERE id = ${id}`;
        } else if (name && category) {
            await sql`DELETE FROM drop_lists WHERE category = ${category} AND (value = ${name} OR brand = ${name})`;
        } else if (ids && Array.isArray(ids)) {
            await sql`DELETE FROM drop_lists WHERE id = ANY(${ids})`;
        } else if (names && Array.isArray(names) && category) {
            await sql`DELETE FROM drop_lists WHERE category = ${category} AND value = ANY(${names})`;
        } else {
            return NextResponse.json({ success: false, error: 'Target not specified' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error deleting droplist item:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
