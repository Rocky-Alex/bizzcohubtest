const { Pool } = require('pg');

const sourceUrl = 'postgresql://neondb_owner:npg_Idm0shFwXtT5@ep-summer-dust-ae78ala9-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const destUrl = 'postgresql://neondb_owner:npg_nhxLbUTkc8K2@ep-rapid-lab-ahfqo17q-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sourcePool = new Pool({ connectionString: sourceUrl });
const destPool = new Pool({ connectionString: destUrl });

const TABLES = [
    'roles',
    'users',
    'products',
    'settings',
    'admin_emails',
    'featured_products_config',
    'inventory_qc',
    'customers',
    'purchase_lots',
    'orders',
    'invoices',
    'quotations',
    // Children
    'purchase_lot_items',
    'invoice_items',
    'invoice_payments',
    'quotation_items',
    'wishlist',
    'activity_logs'
];

// Helper to map postgres types roughly
const mapType = (udt, maxLength) => {
    switch (udt) {
        case 'int4': return 'INTEGER';
        case 'int8': return 'BIGINT';
        case 'varchar': return maxLength ? `VARCHAR(${maxLength})` : 'TEXT';
        case 'text': return 'TEXT';
        case 'bool': return 'BOOLEAN';
        case 'timestamp': return 'TIMESTAMP';
        case 'timestamptz': return 'TIMESTAMP WITH TIME ZONE';
        case 'date': return 'DATE';
        case 'numeric': return 'NUMERIC';
        case 'jsonb': return 'JSONB';
        case 'uuid': return 'UUID';
        default: return 'TEXT'; // Fallback
    }
};

async function transfer() {
    console.log('🔗 Connecting to databases...');
    let sourceClient, destClient;

    try {
        sourceClient = await sourcePool.connect();
        destClient = await destPool.connect();
        console.log('✅ Connected to both Source and Destination.');

        // Note: Cannot disable constraints on Neon without superuser.
        // We rely on correct insertion order and CASCADE truncate.

        for (const table of TABLES) {
            console.log(`\n📦 Processing table: ${table}`);

            // 1. Check if table exists in Source
            const checkSrc = await sourceClient.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [table]);

            if (!checkSrc.rows[0].exists) {
                console.log(`   🔸 Table '${table}' missing in Source. Skipping.`);
                continue;
            }

            // 2. Check if table exists in Dest
            const checkDest = await destClient.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [table]);

            if (!checkDest.rows[0].exists) {
                console.log(`   🔸 Table '${table}' missing in Destination. Creating...`);

                // Fetch Schema from Source
                const schemaRes = await sourceClient.query(`
                    SELECT column_name, udt_name, character_maximum_length, is_nullable, column_default 
                    FROM information_schema.columns 
                    WHERE table_name = $1
                `, [table]);

                if (schemaRes.rows.length === 0) {
                    console.log(`   ❌ Could not fetch schema for ${table}. Skipping.`);
                    continue;
                }

                const cols = schemaRes.rows.map(r => {
                    let type = mapType(r.udt_name, r.character_maximum_length);
                    // Special case for ID
                    if (r.column_name === 'id' && r.column_default && r.column_default.includes('nextval')) {
                        type = 'SERIAL PRIMARY KEY';
                    }
                    return `"${r.column_name}" ${type}`;
                }).join(', ');

                // Create Table
                // Note: Simple creation, might miss complex constraints/indexes but ok for data dump
                const createSQL = `CREATE TABLE IF NOT EXISTS "${table}" (${cols})`;
                // console.log(createSQL);
                await destClient.query(createSQL);
                console.log(`   ✨ Created table '${table}' in Destination.`);
            }

            // 3. Truncate Destination
            // Use CASCADE to handle internal dependencies (like self-referencing or circular if any)
            console.log(`   🗑️  Truncating destination table...`);
            try {
                await destClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
            } catch (e) {
                console.log(`   ⚠️  Truncate failed (maybe empty?): ${e.message}`);
                // continue? No, try insert anyway.
            }

            // 4. Fetch Source Data
            const { rows } = await sourceClient.query(`SELECT * FROM "${table}"`);
            console.log(`   📥 Fetched ${rows.length} rows from Source.`);

            if (rows.length === 0) continue;

            // 5. Insert Data
            console.log(`   🚀 Inserting into Destination...`);

            // Get columns from first row
            const columns = Object.keys(rows[0]);
            const columnList = columns.map(c => `"${c}"`).join(', ');

            let insertedCount = 0;
            let errorCount = 0;

            for (const row of rows) {
                const values = columns.map(c => row[c]);
                const params = values.map((_, i) => `$${i + 1}`).join(', ');

                try {
                    await destClient.query(
                        `INSERT INTO "${table}" (${columnList}) VALUES (${params})`,
                        values
                    );
                    insertedCount++;
                } catch (err) {
                    errorCount++;
                    console.error(`   ❌ Failed row: ${err.message}`);
                }
            }
            console.log(`   ✅ Inserted: ${insertedCount} | ❌ Failed: ${errorCount}`);
        }

        // Constraints re-enabled implicitly (never disabled)

        console.log('\n✨ Database Transfer Complete!');

    } catch (err) {
        console.error('\n❌ Fatal Error during transfer:', err);
    } finally {
        if (sourceClient) sourceClient.release();
        if (destClient) destClient.release();
        await sourcePool.end();
        await destPool.end();
    }
}

transfer();
