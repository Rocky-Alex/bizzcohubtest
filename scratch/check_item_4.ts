import { sql } from '../src/lib/db';
async function run() {
    const r = await sql`SELECT id, product_name, quantity, qc_count FROM purchase_lot_items WHERE id = 4`;
    console.table(r);
}
run();
