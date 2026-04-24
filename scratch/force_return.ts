import { sql } from '../src/lib/db';

async function forceReturn() {
    try {
        console.log("Forcing a return record for ID 2...");
        
        // 1. Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS sales_returns (
                id SERIAL PRIMARY KEY,
                sales_out_id INTEGER,
                inventory_id INTEGER,
                return_reason TEXT,
                qc_status TEXT DEFAULT 'Pending QC',
                initiated_by TEXT,
                initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                qc_confirmed_by TEXT,
                qc_confirmed_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 2. Insert
        await sql`
            INSERT INTO sales_returns (sales_out_id, return_reason, qc_status, initiated_by)
            VALUES (2, 'System Fix Test', 'Pending QC', 'Admin')
            ON CONFLICT DO NOTHING
        `;

        // 3. Update sale_out
        await sql`UPDATE sale_out SET status = 'Return Initiated' WHERE id = 2`;

        console.log("Done. Checking results...");
        const res = await sql`
            SELECT sr.*, so.barcode, so.product_name 
            FROM sales_returns sr
            JOIN sale_out so ON sr.sales_out_id = so.id
        `;
        console.table(res);

    } catch (e) {
        console.error(e);
    }
}

forceReturn();
