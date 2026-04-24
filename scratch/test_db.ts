import 'dotenv/config';
import { sql } from '../src/lib/db';

async function check() {
    try {
        for (const table of ['master_inventory', 'purchase_lot_items', 'products', 'purchase_lots']) {
            const cols = await sql`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = ${table}
            `;
            console.log(`${table} Columns:`, cols.map((c:any) => c.column_name));
        }
    } catch (e) {
        console.error(e);
    }
}

check();
