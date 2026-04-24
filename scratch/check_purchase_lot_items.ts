import 'dotenv/config';
import { sql } from '../src/lib/db';

async function main() {
    try {
        const cols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'purchase_lot_items'
        `;
        console.log('Purchase Lot Items Columns:', JSON.stringify(cols, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
