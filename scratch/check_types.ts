import 'dotenv/config';
import { sql } from '../src/lib/db';

async function check() {
    try {
        const tables = ['invoices', 'quotations', 'sale_out', 'customers'];
        for (const table of tables) {
            const cols = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = ${table}
            `;
            console.log(`${table} Types:`, cols.map((c:any) => `${c.column_name}: ${c.data_type}`));
        }
    } catch (e) {
        console.error(e);
    }
}

check();
