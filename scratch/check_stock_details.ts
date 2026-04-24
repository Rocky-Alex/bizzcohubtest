import { sql } from '../src/lib/db';
async function run() {
    const r = await sql`SELECT product_name, quantity, qc_count FROM purchase_lot_items WHERE product_name ILIKE '%Lenovo Thinkpad T14%'`;
    console.table(r);
    
    const r2 = await sql`SELECT product_name, quantity, qc_count FROM purchase_lot_items WHERE product_name ILIKE '%HP zBook 14%'`;
    console.table(r2);
}
run();
