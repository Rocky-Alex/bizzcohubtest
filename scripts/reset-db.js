const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config();

const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL);

async function resetDb() {
    try {
        console.log('✅ Connected to Database');

        console.log('Dropping tables...');
        await sql`DROP TABLE IF EXISTS inventory_qc CASCADE`;
        await sql`DROP TABLE IF EXISTS purchase_lot_items CASCADE`;
        await sql`DROP TABLE IF EXISTS purchase_lots CASCADE`;

        console.log('Recreating purchase_lots...');
        await sql`
            CREATE TABLE purchase_lots (
                id SERIAL PRIMARY KEY,
                lot_id TEXT UNIQUE,
                lot_number TEXT,
                supplier_name TEXT NOT NULL,
                supplier_id INTEGER,
                invoice_date DATE,
                invoice_number TEXT,
                notes TEXT,
                total_cost DECIMAL(12, 2) DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('Recreating purchase_lot_items...');
        await sql`
            CREATE TABLE purchase_lot_items (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(id) ON DELETE CASCADE,
                product_type TEXT,
                product_name TEXT NOT NULL,
                brand TEXT,
                series TEXT,
                model TEXT,
                processor TEXT,
                processor_gen TEXT,
                sku TEXT,
                quantity INTEGER DEFAULT 1,
                unit_cost DECIMAL(12, 2) DEFAULT 0,
                qc_count INTEGER DEFAULT 0,
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('Recreating inventory_qc...');
        await sql`
            CREATE TABLE inventory_qc (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(id) ON DELETE CASCADE,
                purchase_lot_item_id INTEGER REFERENCES purchase_lot_items(id) ON DELETE SET NULL,
                barcode TEXT,
                sku TEXT,
                product_name TEXT,
                brand TEXT,
                series TEXT,
                model TEXT,
                processor TEXT,
                processor_gen TEXT,
                ram TEXT,
                storage TEXT,
                graphics TEXT,
                screen_size TEXT,
                screen_resolution TEXT,
                keyboard_type TEXT,
                keyboard_backlit TEXT,
                condition_status TEXT,
                status TEXT,
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_by TEXT,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        `;

        console.log('✅ Database reset successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

resetDb();
