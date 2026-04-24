import 'dotenv/config';
import { sql } from '../src/lib/db';

async function main() {
    try {
        const rows = await sql`
            SELECT * FROM sale_out LIMIT 5
        `;
        console.log('Sale Out Sample Rows:', JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
