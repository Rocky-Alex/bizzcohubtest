import { invoiceSql as sql } from '../src/lib/db';

async function migrate() {
    try {
        console.log('Adding inventory_id and source to invoice_items...');
        await sql`ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS inventory_id INTEGER`;
        await sql`ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS source VARCHAR(50)`;

        console.log('Adding inventory_id and source to quotation_items...');
        await sql`ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS inventory_id INTEGER`;
        await sql`ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS source VARCHAR(50)`;

        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
