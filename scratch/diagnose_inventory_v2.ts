import { sql } from '../src/lib/db';

async function diagnose() {
    try {
        console.log('--- MASTER INVENTORY ---');
        const master = await sql`SELECT id, product_name, quantity FROM master_inventory LIMIT 5`;
        console.table(master);

        console.log('--- PURCHASE LOTS ---');
        const lots = await sql`SELECT id, lot_number FROM purchase_lots LIMIT 5`;
        console.table(lots);

        console.log('--- PURCHASE LOT ITEMS ---');
        const purchase = await sql`SELECT id, product_name, quantity, qc_count FROM purchase_lot_items LIMIT 5`;
        console.table(purchase);

        console.log('--- SALE OUT ---');
        const sales = await sql`SELECT id, inventory_id, source, status, returned_at FROM sale_out LIMIT 10`;
        console.table(sales);

        console.log('--- QUANTITY CHECK ---');
        const check = await sql`
            SELECT 
                mi.id, mi.product_name, mi.quantity as original,
                (SELECT COUNT(*) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master') as sold
            FROM master_inventory mi
            LIMIT 5
        `;
        console.table(check);

    } catch (err) {
        console.error(err);
    }
}

diagnose();
