import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { data, category } = body;

        // Log start of import
        const logFile = path.join(process.cwd(), 'import_debug.log');
        fs.appendFileSync(logFile, `${new Date().toISOString()} - Starting import for ${category} with ${data?.length} items\n`);

        if (!data || !Array.isArray(data) || !category) {
            return NextResponse.json({ success: false, error: 'Data and category are required' }, { status: 400 });
        }

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS drop_lists (
                id SERIAL PRIMARY KEY,
                category TEXT NOT NULL,
                value TEXT NOT NULL,
                brand TEXT,
                series TEXT,
                model TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Ensure model column exists
        await sql`ALTER TABLE drop_lists ADD COLUMN IF NOT EXISTS model TEXT`;

        let modelsCreated = 0;
        let skipped = 0;
        const summary = { created: [] as any[], skipped: [] as any[] };

        if (category === 'Laptop') {
            for (const item of data) {
                try {
                    const brand = (item.brand || '').toString().trim();
                    const series = item.series ? item.series.toString().trim() : null;
                    const model = (item.model || '').toString().trim();

                    if (!brand || !model) {
                        skipped++;
                        continue;
                    }

                    // Check if already exists (null-safe comparison)
                    const existing = await sql`
                        SELECT id FROM drop_lists 
                        WHERE category = 'Laptop' 
                        AND brand = ${brand} 
                        AND model = ${model}
                        AND (series IS NOT DISTINCT FROM ${series})
                    ` as unknown as any[];

                    if (existing.length === 0) {
                        const result = await sql`
                            INSERT INTO drop_lists (category, value, brand, series, model)
                            VALUES ('Laptop', ${model}, ${brand}, ${series}, ${model})
                            RETURNING *
                        ` as unknown as any[];
                        summary.created.push(result[0]);
                        modelsCreated++;
                    } else {
                        summary.skipped.push(item);
                        skipped++;
                    }
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                    fs.appendFileSync(logFile, `${new Date().toISOString()} - Error processing item: ${JSON.stringify(item)} - ${errorMessage}\n`);
                    skipped++;
                }
            }
        } else {
            // Single value categories
            for (const item of data) {
                try {
                    const value = (item.value || '').toString().trim();
                    if (!value) {
                        skipped++;
                        continue;
                    }

                    const existing = await sql`
                        SELECT id FROM drop_lists 
                        WHERE category = ${category} 
                        AND value = ${value}
                    ` as unknown as any[];

                    if (existing.length === 0) {
                        const result = await sql`
                            INSERT INTO drop_lists (category, value)
                            VALUES (${category}, ${value})
                            RETURNING *
                        ` as unknown as any[];
                        summary.created.push(result[0]);
                        modelsCreated++;
                    } else {
                        summary.skipped.push(item);
                        skipped++;
                    }
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                    fs.appendFileSync(logFile, `${new Date().toISOString()} - Error processing single-value item: ${JSON.stringify(item)} - ${errorMessage}\n`);
                    skipped++;
                }
            }
        }

        if (modelsCreated > 0) {
            try {
                await logActivity(
                    'Admin',
                    'Import Drop Lists',
                    `Imported ${modelsCreated} items into ${category} list`,
                    'success',
                    'Admin'
                );
            } catch (logErr: unknown) {
                const errorMessage = logErr instanceof Error ? logErr.message : 'An unknown error occurred';
                fs.appendFileSync(logFile, `${new Date().toISOString()} - Activity Log Error: ${errorMessage}\n`);
            }
        }

        return NextResponse.json({
            success: true,
            stats: { modelsCreated, skipped },
            summary
        });
    } catch (error: unknown) {
        const logFile = path.join(process.cwd(), 'import_error.log');
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : 'No stack trace';
        fs.appendFileSync(logFile, `${new Date().toISOString()} - Global error: ${errorStack}\n`);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
