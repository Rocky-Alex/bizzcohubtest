import 'dotenv/config';
import { sql } from '../src/lib/db';

async function main() {
    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('Tables:', JSON.stringify(tables, null, 2));

        const invoicesCols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'invoices'
        `;
        console.log('Invoices Columns:', JSON.stringify(invoicesCols, null, 2));

        const salesOutCols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sale_out'
        `;
        console.log('Sale Out Columns:', JSON.stringify(salesOutCols, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
