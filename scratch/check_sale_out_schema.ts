import 'dotenv/config';
import { sql } from '../src/lib/db';

async function main() {
    try {
        const cols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sale_out'
        `;
        console.log('Sale Out Columns:', JSON.stringify(cols, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
