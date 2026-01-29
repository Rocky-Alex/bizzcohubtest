import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
    laptopModels, ramOptions, storageOptions, graphicsOptions,
    processorOptions, processorGenOptions, screenSizeOptions, screenResolutionOptions,
    keyboardTypeOptions, keyboardBacklitOptions, conditionStatusOptions
} from '@/db/schema';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60;

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

export async function POST(req: NextRequest) {
    const errorLogPath = path.join(process.cwd(), 'import-error.log');

    try {
        const body = await req.json();
        const { data, category = 'Laptop' } = body;

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const isSingleValue = singleValueCategories.includes(category);
        const table = getTable(category);

        // 1. Fetch all existing records for de-duplication
        const allExisting = await db.select().from(table as any);
        const existingSet = new Set(
            allExisting.map((m: any) => {
                if (isSingleValue) return (m.value || '').toLowerCase().trim();
                const b = (m.brand || '').toLowerCase().trim();
                const s = (m.series || '').toLowerCase().trim();
                const mo = (m.model || '').toLowerCase().trim();
                return `${b}|${s}|${mo}`;
            })
        );

        const toInsert: any[] = [];
        const createdItems: any[] = [];
        const skippedItems: any[] = [];

        // 2. Filter and normalize data
        for (const item of data) {
            if (isSingleValue) {
                const valueRaw = (item.value !== undefined && item.value !== null) ? String(item.value).trim() : '';
                const value = valueRaw.substring(0, 100);

                if (!value) {
                    skippedItems.push({ value: '?', reason: 'Missing Value' });
                    continue;
                }

                if (!existingSet.has(value.toLowerCase())) {
                    toInsert.push({ value });
                    createdItems.push({ value });
                    existingSet.add(value.toLowerCase());
                } else {
                    skippedItems.push({ value, reason: 'Duplicate' });
                }
            } else {
                const brandRaw = (item.brand !== undefined && item.brand !== null) ? String(item.brand).trim() : '';
                const seriesRaw = (item.series !== undefined && item.series !== null) ? String(item.series).trim() : '';
                const modelRaw = (item.model !== undefined && item.model !== null) ? String(item.model).trim() : '';

                const brand = brandRaw.substring(0, 100);
                const series = seriesRaw ? seriesRaw.substring(0, 100) : null;
                const model = modelRaw.substring(0, 100);

                const displayItem = { brand: brand || '?', series: series || '-', model: model || '?' };

                if (!brand || !model) {
                    skippedItems.push({ ...displayItem, reason: 'Missing Brand or Model' });
                    continue;
                }

                const key = `${brand.toLowerCase()}|${(series || '').toLowerCase()}|${model.toLowerCase()}`;

                if (!existingSet.has(key)) {
                    const newItem = { brand, series, model };
                    toInsert.push(newItem);
                    createdItems.push(newItem);
                    existingSet.add(key);
                } else {
                    skippedItems.push({ ...displayItem, reason: 'Duplicate' });
                }
            }
        }

        // 3. Batch insert
        if (toInsert.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < toInsert.length; i += batchSize) {
                const batch = toInsert.slice(i, i + batchSize);
                await db.insert(table as any).values(batch);
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                modelsCreated: createdItems.length,
                skipped: skippedItems.length
            },
            summary: {
                created: createdItems,
                skipped: skippedItems
            }
        });

    } catch (error: any) {
        const errorMsg = `[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n\n`;
        fs.appendFileSync(errorLogPath, errorMsg);
        console.error('Bulk import failed:', error);
        return NextResponse.json({
            error: 'Failed to import data',
            details: error?.message || 'Unknown server error'
        }, { status: 500 });
    }
}
