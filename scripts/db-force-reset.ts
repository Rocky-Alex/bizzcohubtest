import { config } from 'dotenv';
import path from 'path';
// Load .env explicitly if needed
config({ path: path.resolve(process.cwd(), '.env') });

import { query } from '../src/lib/db';

async function main() {
    console.log('Starting exact main database reset...');
    console.log('Will keep ONLY the "roles" table fully intact, and "superadmin" in "users" table.');

    try {
        const tablesResult = await query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        `);

        if (!tablesResult || !tablesResult.rows) {
            console.error('Could not fetch tables.');
            process.exit(1);
        }

        const tables = tablesResult.rows.map((t: any) => t.tablename);
        console.log(`Found ${tables.length} tables in public schema.`);

        for (const table of tables) {
            if (table === 'roles') {
                console.log('⏩ Skipping table: roles (preserving all roles)');
                continue;
            }

            if (table === 'users') {
                console.log('🧹 Clearing table: users (preserving superadmin)');
                // If the superadmin exists, this leaves them. If not, it just empties it.
                await query(`DELETE FROM users WHERE username != 'superadmin'`);
                continue;
            }

            console.log(`🧹 Truncating table: "${table}"...`);
            try {
                // Truncate cascade handles foreign key dependencies automatically
                await query(`TRUNCATE TABLE "${table}" CASCADE`);
            } catch (err: any) {
                console.log(`⚠️ Fallback to DELETE for "${table}" due to: ${err.message}`);
                try {
                    await query(`DELETE FROM "${table}"`);
                } catch (delErr: any) {
                    console.log(`❌ Failed to clear "${table}": ${delErr.message}`);
                }
            }
        }

        console.log('✅ Main database force reset complete!');
        process.exit(0);
    } catch (e: any) {
        console.error('❌ Error resetting database:', e);
        process.exit(1);
    }
}

main();
