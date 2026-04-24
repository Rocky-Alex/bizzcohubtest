import { invoiceSql as sql } from '../src/lib/db';

async function checkData() {
    try {
        const res = await sql`SELECT * FROM sale_out LIMIT 10`;
        console.log("Sale Out Records:", res);
    } catch (e) {
        console.error(e);
    }
}

checkData();
