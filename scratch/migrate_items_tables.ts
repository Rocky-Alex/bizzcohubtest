import 'dotenv/config';
import { sql, invoiceSql, quotationSql } from '../src/lib/db';

async function main() {
    const columns = [
        'ram TEXT',
        'storage TEXT',
        'graphics TEXT'
    ];

    console.log('Starting migration for invoice_items and quotation_items...');
    
    // 1. invoice_items (Invoice DB)
    for (const col of columns) {
        try {
            await invoiceSql(`ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS ${col}`);
            console.log(`invoice_items: Successfully handled ${col}`);
        } catch (e) {
            console.error(`invoice_items: Error adding ${col}:`, e);
        }
    }

    // 2. quotation_items (Quotation DB)
    for (const col of columns) {
        try {
            await quotationSql(`ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS ${col}`);
            console.log(`quotation_items: Successfully handled ${col}`);
        } catch (e) {
            console.error(`quotation_items: Error adding ${col}:`, e);
        }
    }

    console.log('Migration complete.');
}

main();
