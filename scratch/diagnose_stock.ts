
import { sql } from '../src/lib/db';

async function diagnose() {
    console.log("--- Purchase Lot Items ---");
    const items = await sql`
        SELECT id, product_name, quantity, qc_count 
        FROM purchase_lot_items 
        WHERE product_name ILIKE '%Thinkpad%' OR product_name ILIKE '%zBook%'
    `;
    console.table(items);

    console.log("\n--- Sale Out Records ---");
    const sales = await sql`
        SELECT id, inventory_id, source, product_name, quantity, invoice_no 
        FROM sale_out 
        ORDER BY sold_at DESC 
        LIMIT 10
    `;
    console.table(sales);

    console.log("\n--- Calculated Stock (Manual SQL check) ---");
    const calc = await sql`
        SELECT 
            pli.id, 
            pli.product_name, 
            pli.quantity as original_qty,
            COALESCE(pli.qc_count, 0) as qc_qty,
            (SELECT COALESCE(SUM(so.quantity), 0) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase') as sold_qty,
            (pli.quantity - COALESCE(pli.qc_count, 0) - (SELECT COALESCE(SUM(so.quantity), 0) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase')) as balance
        FROM purchase_lot_items pli
        WHERE pli.product_name ILIKE '%Thinkpad%' OR pli.product_name ILIKE '%zBook%'
    `;
    console.table(calc);
}

diagnose().catch(console.error);
