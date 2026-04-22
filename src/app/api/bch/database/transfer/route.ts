import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activity-logger';

// Helper to check if current user is admin
async function isAdmin(): Promise<boolean> {
    const role = (await cookies()).get('admin_user_role')?.value;
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
}

// Helper to run a raw SQL string using neon's tagged template
// neon v1.x only supports tagged-template calls, not regular function calls
function rawQuery(sqlFn: any, query: string, params: unknown[] = []): Promise<any[]> {
    // Build a TemplateStringsArray-compatible object with the query split at $1, $2, etc.
    if (params.length === 0) {
        const strings = Object.assign([query], { raw: [query] });
        return sqlFn(strings as unknown as TemplateStringsArray);
    }
    // Split the query at $1, $2, ... $N placeholders and call as tagged template
    const parts: string[] = [];
    let remaining = query;
    for (let i = 1; i <= params.length; i++) {
        const placeholder = `$${i}`;
        const idx = remaining.indexOf(placeholder);
        if (idx === -1) break;
        parts.push(remaining.substring(0, idx));
        remaining = remaining.substring(idx + placeholder.length);
    }
    parts.push(remaining);
    const strings = Object.assign(parts, { raw: parts });
    return sqlFn(strings as unknown as TemplateStringsArray, ...params);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { direction } = body; // 'main-to-local' or 'local-to-main'

        const mainUrl = process.env.MAIN_POSTGRES_URL;
        const localUrl = process.env.LOCAL_POSTGRES_URL;

        if (!mainUrl || !localUrl) {
            return NextResponse.json({ error: 'Database URLs not configured in .env' }, { status: 500 });
        }

        const sourceUrl = direction === 'main-to-local' ? mainUrl : localUrl;
        const destUrl = direction === 'main-to-local' ? localUrl : mainUrl;

        const sourceSql = neon(sourceUrl);
        const destSql = neon(destUrl);

        console.log(`[Database Transfer] Starting dynamic transfer: ${direction}`);
        const results: Record<string, number> = {};

        // 1. Discover all tables in source database
        const sourceTablesResult = await rawQuery(sourceSql,
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        ) as { table_name: string }[];
        const discoveredTables = sourceTablesResult.map(r => r.table_name);

        // Define a base order for known dependencies, merge with discovered tables
        const PREFERRED_ORDER = [
            'roles', 'users', 'settings', 'admin_emails', 'suppliers', 'customers',
            'products', 'featured_products_config', 'purchase_lots', 'purchase_lot_items',
            'quotations', 'quotation_items', 'orders', 'invoices',
            'invoice_items', 'invoice_payments', 'wishlist', 'activity_logs',
            'drop_lists', 'password_resets'
        ];

        // All tables to be processed, starting with preferred order ones that exist in source
        const allTables = [
            ...PREFERRED_ORDER.filter((t: string) => discoveredTables.includes(t)),
            ...discoveredTables.filter((t: string) => !PREFERRED_ORDER.includes(t))
        ];

        console.log(`[Database Transfer] Processing ${allTables.length} tables: ${allTables.join(', ')}`);

        // 2. Prepare destination (Truncate existing or Create new)
        for (const table of [...allTables].reverse()) {
            try {
                const tableExists = await rawQuery(destSql,
                    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
                    [table]
                );

                if (tableExists.length === 0) {
                    console.log(`[Database Transfer] Table "${table}" missing in destination. Cloning schema...`);

                    const columns = await rawQuery(sourceSql, `
                        SELECT
                            column_name, data_type, udt_name, is_nullable,
                            column_default, character_maximum_length
                        FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = $1
                        ORDER BY ordinal_position
                    `, [table]) as any[];

                    if (columns.length > 0) {
                        const pks = await rawQuery(sourceSql, `
                            SELECT kcu.column_name
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                            WHERE tc.constraint_schema = 'public'
                              AND tc.table_name = $1
                              AND tc.constraint_type = 'PRIMARY KEY'
                        `, [table]) as { column_name: string }[];
                        const pkCols = pks.map(p => p.column_name);

                        let createSql = `CREATE TABLE "${table}" (\n`;
                        const colDefs = columns.map(col => {
                            let def = `  "${col.column_name}" `;
                            if (col.column_default && col.column_default.includes('nextval') && col.udt_name.includes('int')) {
                                def += 'SERIAL';
                            } else {
                                let type = col.data_type.toUpperCase();
                                if (type === 'CHARACTER VARYING') {
                                    type = `VARCHAR(${col.character_maximum_length})`;
                                } else if (type === 'USER-DEFINED' || type === 'JSONB') {
                                    type = col.udt_name.toUpperCase();
                                } else if (type === 'ARRAY' && col.udt_name.startsWith('_')) {
                                    type = col.udt_name.substring(1).toUpperCase() + '[]';
                                }
                                def += type;
                                if (col.is_nullable === 'NO') def += ' NOT NULL';
                                if (col.column_default && !col.column_default.includes('nextval')) {
                                    def += ` DEFAULT ${col.column_default}`;
                                }
                            }
                            return def;
                        });

                        createSql += colDefs.join(',\n');
                        if (pkCols.length > 0) {
                            createSql += `,\n  PRIMARY KEY (${pkCols.map((c: string) => `"${c}"`).join(', ')})`;
                        }
                        createSql += '\n)';

                        await rawQuery(destSql, createSql);
                    }
                } else {
                    await rawQuery(destSql, `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
                }
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Unknown error';
                console.warn(`[Database Transfer] Preparation error for "${table}":`, message);
            }
        }

        // 3. Transfer data in order
        const BATCH_SIZE = 100;
        for (const table of allTables) {
            try {
                const data = await rawQuery(sourceSql, `SELECT * FROM "${table}"`) as Record<string, unknown>[];
                if (data.length > 0) {
                    const columns = Object.keys(data[0]);
                    const colNames = columns.map(c => `"${c}"`).join(', ');

                    for (let i = 0; i < data.length; i += BATCH_SIZE) {
                        const batch = data.slice(i, i + BATCH_SIZE);
                        const allValues: unknown[] = [];
                        const valuePlaceholders: string[] = [];

                        batch.forEach((row, rowIndex) => {
                            const placeholders = columns.map((_, colIndex) => {
                                allValues.push(row[columns[colIndex]]);
                                return `$${rowIndex * columns.length + colIndex + 1}`;
                            }).join(', ');
                            valuePlaceholders.push(`(${placeholders})`);
                        });

                        const query = `INSERT INTO "${table}" (${colNames}) VALUES ${valuePlaceholders.join(', ')}`;
                        await rawQuery(destSql, query, allValues);
                    }
                }
                results[table] = data.length;
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Unknown error';
                console.error(`[Database Transfer] Transfer error for "${table}":`, message);
                results[table] = -1;
            }
        }

        await logActivity('Admin', 'Database Transfer', `Dynamic transfer from ${direction.replace('-', ' ')} completed`, 'success', 'Admin');

        return NextResponse.json({
            success: true,
            message: `Discovery & Transfer ${direction} completed`,
            details: results
        });

    } catch (error: unknown) {
        console.error('[Database Transfer] Critical Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Transfer failed', details: errorMessage }, { status: 500 });
    }
}
