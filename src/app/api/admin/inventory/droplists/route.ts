import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
    laptopModels, ramOptions, storageOptions, graphicsOptions,
    processorOptions, processorGenOptions, screenSizeOptions, screenResolutionOptions,
    keyboardTypeOptions, keyboardBacklitOptions, conditionStatusOptions
} from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const singleValueCategories = [
    'RAM', 'Storage', 'Graphics', 'Processor', 'Gen',
    'Screen Size', 'Resolution', 'Keyboard Type', 'Keyboard Backlit', 'Condition'
];

// Helper to get table based on category
const getTable = (category: string) => {
    switch (category) {
        case 'RAM': return ramOptions;
        case 'Storage': return storageOptions;
        case 'Graphics': return graphicsOptions;
        case 'Processor': return processorOptions;
        case 'Gen': return processorGenOptions;
        case 'Screen Size': return screenSizeOptions;
        case 'Resolution': return screenResolutionOptions;
        case 'Keyboard Type': return keyboardTypeOptions;
        case 'Keyboard Backlit': return keyboardBacklitOptions;
        case 'Condition': return conditionStatusOptions;
        default: return laptopModels;
    }
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') || 'Laptop';

        let data;
        if (singleValueCategories.includes(category)) {
            data = await db.select().from(getTable(category));
        } else {
            data = await db.select().from(laptopModels);
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching drop lists:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { category, brand, series, model, value } = body;

        if (singleValueCategories.includes(category)) {
            if (!value) return NextResponse.json({ error: 'Value is required' }, { status: 400 });
            const table = getTable(category) as any;
            await db.insert(table).values({ value: value.trim() });
        } else {
            if (!brand || !model) {
                return NextResponse.json({ error: 'Brand and Model are required' }, { status: 400 });
            }
            await db.insert(laptopModels).values({
                brand: brand.trim(),
                series: series?.trim() || null,
                model: model.trim()
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error creating drop list item:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, category, brand, series, model, value, oldName } = body;

        if (singleValueCategories.includes(category)) {
            if (!id || !value) return NextResponse.json({ error: 'ID and Value are required' }, { status: 400 });
            const table = getTable(category) as any;
            await db.update(table).set({ value: value.trim() }).where(eq(table.id, id));
        } else if (id) {
            // Individual Laptop Model update
            await db.update(laptopModels)
                .set({ brand, series, model })
                .where(eq(laptopModels.id, id));
        } else if (category && oldName && (brand || series)) {
            // Bulk rename for Laptop (Brand or Series)
            if (category === 'Brand') {
                await db.update(laptopModels).set({ brand }).where(eq(laptopModels.brand, oldName));
            } else if (category === 'Series') {
                await db.update(laptopModels).set({ series }).where(eq(laptopModels.series, oldName));
            }
        } else {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating drop list:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        let body: any = {};
        const { searchParams } = new URL(req.url);

        try {
            const rawBody = await req.text();
            if (rawBody) body = JSON.parse(rawBody);
        } catch (e) { }

        const category = body.category || searchParams.get('category');
        const id = body.id || searchParams.get('id');
        const ids = body.ids;
        const name = body.name || searchParams.get('name');
        const names = body.names;

        const table = getTable(category) as any;

        // Bulk Delete by IDs
        if (ids && Array.isArray(ids) && ids.length > 0) {
            await db.delete(table).where(inArray(table.id, ids));
            return NextResponse.json({ success: true });
        }

        // Individual Delete by ID
        if (id) {
            await db.delete(table).where(eq(table.id, parseInt(id)));
            return NextResponse.json({ success: true });
        }

        // Bulk/Individual Delete by Name (Brand/Series) or Value (RAM/Storage)
        if (singleValueCategories.includes(category)) {
            if (names && Array.isArray(names)) {
                await db.delete(table).where(inArray(table.value, names));
            } else if (name) {
                await db.delete(table).where(eq(table.value, name));
            }
        } else if (category === 'Brand') {
            if (names && Array.isArray(names)) {
                await db.delete(laptopModels).where(inArray(laptopModels.brand, names));
            } else if (name) {
                await db.delete(laptopModels).where(eq(laptopModels.brand, name));
            }
        } else if (category === 'Series') {
            if (names && Array.isArray(names)) {
                await db.delete(laptopModels).where(inArray(laptopModels.series, names));
            } else if (name) {
                await db.delete(laptopModels).where(eq(laptopModels.series, name));
            }
        } else {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting drop list item:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
