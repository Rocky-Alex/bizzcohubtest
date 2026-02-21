import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env') });

import { query } from '../src/lib/db';

async function main() {
    console.log('Verifying table row counts...');

    try {
        const tablesResult = await query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        `);

        const tables = tablesResult.rows.map(t => t.tablename);

        for (const table of tables) {
            const countResult = await query(`SELECT COUNT(*) as cnt FROM "${table}"`);
            const count = countResult.rows[0].cnt;
            if (count > 0) {
                console.log(`Table "${table}" has ${count} rows`);
            } else {
                console.log(`Table "${table}" is empty`);
            }
        }
        process.exit(0);
    } catch (e: any) {
        console.error('Error verifying database:', e);
        process.exit(1);
    }
}

main();
