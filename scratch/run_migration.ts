import 'dotenv/config';
import { sql } from '../src/lib/db';

async function main() {
    const columns = [
        'inventory_id INTEGER',
        'source TEXT',
        'quantity INTEGER DEFAULT 1',
        'customer_name TEXT',
        'brand TEXT',
        'model TEXT',
        'series TEXT',
        'processor TEXT',
        'processor_gen TEXT',
        'ram TEXT',
        'storage TEXT',
        'graphics TEXT',
        'unit_price NUMERIC',
        'master_inventory_id INTEGER',
        'purchase_lot_item_id INTEGER'
    ];

    console.log('Starting migration...');
    for (const col of columns) {
        try {
            await sql(`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS ${col}`);
            console.log(`Successfully handled: ${col}`);
        } catch (colError) {
            console.error(`Error adding column ${col}:`, colError);
        }
    }
    console.log('Migration complete.');
}

main();
