import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { rows, importedBy } = body;

        if (!rows || !Array.isArray(rows)) {
            return NextResponse.json({ success: false, error: 'Rows array is required' }, { status: 400 });
        }

        let importedCount = 0;
        const errors: any[] = [];
        const processedItems = new Set<string>(); // To avoid duplicate processing in the same batch

        // Helper to insert option safely
        async function insertOption(category: string, value: string, parent: string | null) {
            const key = `${category.toLowerCase()}:${value.trim().toLowerCase()}:${(parent || '').trim().toLowerCase()}`;
            if (processedItems.has(key)) return;
            processedItems.add(key);

            // Check db
            let existing;
            if (parent) {
                existing = await sql`
                    SELECT id FROM drop_lists
                    WHERE category = ${category} AND value = ${value.trim()} AND parent = ${parent.trim()}
                ` as any[];
            } else {
                existing = await sql`
                    SELECT id FROM drop_lists
                    WHERE category = ${category} AND value = ${value.trim()} AND (parent IS NULL OR parent = '')
                ` as any[];
            }

            if (existing.length === 0) {
                await sql`
                    INSERT INTO drop_lists (category, value, parent, created_at)
                    VALUES (${category}, ${value.trim()}, ${parent ? parent.trim() : null}, NOW())
                `;
                importedCount++;
            }
        }

        for (const row of rows) {
            try {
                // 1. Process Brand (e.g. "Dell")
                const brandVal = row.Brand || row.brand || row.BRAND;
                if (brandVal && typeof brandVal === 'string' && brandVal.trim()) {
                    await insertOption('Brand', brandVal, null);
                }

                // 2. Process Series (e.g. "Latitude", parent: Brand)
                const seriesVal = row.series || row.Series || row.SERIES;
                if (seriesVal && typeof seriesVal === 'string' && seriesVal.trim()) {
                    await insertOption('Series', seriesVal, brandVal || null);
                }

                // 3. Process Model (e.g. "E3379", parent: Series)
                const modelVal = row.model || row.Model || row.MODEL;
                if (modelVal && typeof modelVal === 'string' && modelVal.trim()) {
                    await insertOption('Model', modelVal, seriesVal || null);
                }

                // 4. Process other standard specifications columns if present
                const procVal = row.core || row.Core || row.CORE || row.processor || row.Processor || row.PROCESSOR;
                if (procVal && typeof procVal === 'string' && procVal.trim()) {
                    await insertOption('Core', procVal, null);
                }

                const genVal = row.gen || row.Gen || row.GEN || row.generation || row.Generation || row.GENERATION;
                if (genVal && typeof genVal === 'string' && genVal.trim()) {
                    await insertOption('Gen', genVal, procVal || null);
                }

                const ramVal = row.ram || row.RAM || row.Ram;
                if (ramVal && typeof ramVal === 'string' && ramVal.trim()) {
                    await insertOption('RAM', ramVal, null);
                }

                const storageVal = row.ssd || row.SSD || row.Ssd || row.storage || row.Storage || row.STORAGE;
                if (storageVal && typeof storageVal === 'string' && storageVal.trim()) {
                    await insertOption('SSD', storageVal, null);
                }

                // Graphics Model & Graphics Size columns
                const graphicsModelVal = row["Graphics Model"] || row["graphics model"] || row.graphicsmodel || row.GraphicsModel || row.graphicsModel;
                const graphicsSizeVal = row["Graphics Size"] || row["graphics size"] || row.graphicssize || row.GraphicsSize || row.graphicsSize;

                if (graphicsModelVal && typeof graphicsModelVal === 'string' && graphicsModelVal.trim()) {
                    await insertOption('GraphicsModel', graphicsModelVal.trim(), null);
                }
                if (graphicsSizeVal && typeof graphicsSizeVal === 'string' && graphicsSizeVal.trim()) {
                    await insertOption('GraphicsSize', graphicsSizeVal.trim(), null);
                }

                // If only legacy single graphics column is present
                if (!graphicsModelVal && !graphicsSizeVal) {
                    const legacyGraphicsVal = row.graphics || row.Graphics || row.GRAPHICS || row.ghraphics || row.Ghraphics || row.GHRAPHICS;
                    if (legacyGraphicsVal && typeof legacyGraphicsVal === 'string' && legacyGraphicsVal.trim()) {
                        // Parse it into model and size
                        const parts = legacyGraphicsVal.trim().split(/\s+/);
                        if (parts.length > 1) {
                            const lastPart = parts[parts.length - 1];
                            const sizePattern = /^\d+(GB|MB|KB|G|M)$/i;
                            const isSize = sizePattern.test(lastPart) || lastPart.toLowerCase() === 'shared' || lastPart.toLowerCase() === 'dedicated';
                            if (isSize) {
                                await insertOption('GraphicsModel', parts.slice(0, -1).join(' '), null);
                                await insertOption('GraphicsSize', lastPart, null);
                            } else {
                                await insertOption('GraphicsModel', legacyGraphicsVal.trim(), null);
                            }
                        } else {
                            await insertOption('GraphicsModel', legacyGraphicsVal.trim(), null);
                        }
                    }
                }

                const condVal = row.condition || row.Condition || row.CONDITION;
                if (condVal && typeof condVal === 'string' && condVal.trim()) {
                    await insertOption('Condition', condVal, null);
                }

                const screenSizeVal = row["Screen Size"] || row["screen size"] || row.screensize || row.ScreenSize || row.screenSize || row.screen_size;
                if (screenSizeVal && (typeof screenSizeVal === 'string' || typeof screenSizeVal === 'number') && String(screenSizeVal).trim()) {
                    await insertOption('ScreenSize', String(screenSizeVal).trim(), null);
                }

                const screenResVal = row["Screen Resolution"] || row["screen resolution"] || row.screenresolution || row.ScreenResolution || row.screenResolution || row.screen_resolution;
                if (screenResVal && (typeof screenResVal === 'string' || typeof screenResVal === 'number') && String(screenResVal).trim()) {
                    await insertOption('ScreenResolution', String(screenResVal).trim(), null);
                }

            } catch (err: any) {
                console.error('Error importing dropdown row:', err);
                errors.push({ row, error: err.message || 'Database error' });
            }
        }

        if (importedCount > 0) {
            await logActivity(
                importedBy || 'Admin',
                'Import Dropdown Options',
                `Bulk imported ${importedCount} dropdown options`,
                'success',
                'Admin'
            );
        }

        return NextResponse.json({
            success: true,
            importedCount,
            errors
        });

    } catch (error: unknown) {
        console.error('Error during bulk dropdown import:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}
