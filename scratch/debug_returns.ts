import { sql } from '../src/lib/db';

async function debugReturns() {
    try {
        console.log("--- SALE_OUT RECORDS ---");
        const sales = await sql`SELECT id, barcode, status, invoice_no FROM sale_out LIMIT 10`;
        console.table(sales);

        console.log("\n--- SALES_RETURNS RECORDS ---");
        const returns = await sql`SELECT * FROM sales_returns LIMIT 10`;
        console.table(returns);

        console.log("\n--- JOIN TEST ---");
        const joinTest = await sql`
            SELECT sr.id as return_id, sr.qc_status, so.barcode, so.status as sale_status
            FROM sales_returns sr
            JOIN sale_out so ON sr.sales_out_id = so.id
        `;
        console.table(joinTest);

    } catch (e) {
        console.error("Debug Error:", e);
    }
}

debugReturns();
