import { sql } from '../src/lib/db';

async function test() {
    try {
        console.log('--- DATABASE DIAGNOSTIC ---');

        // 0. Fix Tables
        console.log('Ensuring sales_returns table exists...');
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

        // 1. Check Tables
        const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables:', tables.map((t: any) => t.table_name).join(', '));

        // 2. Check and Backfill sale_out
        const sales = await sql`SELECT * FROM sale_out`;
        console.log('Total sales records:', sales.length);
        if (sales.length > 0) console.table(sales);

        console.log('Backfilling status column...');
        try {
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Sold Out'`;
            await sql`UPDATE sale_out SET status = 'Sold Out' WHERE status IS NULL`;
        } catch (e: any) {
            console.log('Migration failed:', e.message);
        }

        // 3. Check sales_returns
        const returns = await sql`SELECT * FROM sales_returns`;
        console.log('Total return records:', returns.length);

        async function main() {
            console.log("Upgrading master_inventory schema...");
            try {
                // 1. Add stock_balance column if missing
                try {
                    await sql`ALTER TABLE master_inventory ADD COLUMN stock_balance INTEGER`;
                    console.log("Column 'stock_balance' added.");
                    // Initialize it with current quantity
                    await sql`UPDATE master_inventory SET stock_balance = quantity WHERE stock_balance IS NULL`;
                    console.log("Initialized stock_balance with current quantity.");
                } catch (e) {
                    console.log("Column 'stock_balance' already exists or could not be added.");
                }

                // 2. Double check column existence
                const schema = await sql`
              SELECT column_name, data_type 
              FROM information_schema.columns 
              WHERE table_name = 'master_inventory' AND column_name = 'stock_balance'
            ` as any[];

                if (schema.length > 0) {
                    console.log("CONFIRMED: stock_balance exists.");
                } else {
                    console.error("ERROR: stock_balance STILL MISSING.");
                }

            } catch (error) {
                console.error("Migration failed:", error);
            }
        }
        await main();

        if (returns.length > 0) console.table(returns);

        // 4. Test the API Query with orphaned check
        console.log('\nChecking for orphaned returns (missing sale_out record)...');
        const orphans = await sql`
            SELECT sr.id, sr.sales_out_id 
            FROM sales_returns sr 
            LEFT JOIN sale_out so ON sr.sales_out_id = so.id 
            WHERE so.id IS NULL
        `;
        if (orphans.length > 0) {
            console.log('Found orphaned returns:', orphans.length);
            console.table(orphans);
        } else {
            console.log('No orphaned returns found.');
        }

        console.log('\nTesting the exact API Query...');
        const apiQuery = await sql`
            SELECT sr.*, so.barcode, so.product_name, so.invoice_no
            FROM sales_returns sr
            JOIN sale_out so ON sr.sales_out_id = so.id
        `;
        console.log('Final API Query results:', apiQuery.length);
        if (apiQuery.length > 0) console.table(apiQuery);

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

test();
