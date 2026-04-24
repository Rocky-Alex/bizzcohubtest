import { sql } from '../src/lib/db';
async function run() {
    const r = await sql`SELECT * FROM sale_out WHERE product_name ILIKE '%Lenovo Thinkpad T14%'`;
    console.log('Sales for Lenovo:');
    console.table(r);
}
run();
