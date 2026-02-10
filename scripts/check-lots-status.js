const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '../.env' });

const databaseUrl = process.env.POSTGRES_URL || process.env.MAIN_POSTGRES_URL;

async function check() {
    if (!databaseUrl) {
        console.error('Error: POSTGRES_URL or MAIN_POSTGRES_URL not found in .env');
        process.exit(1);
    }
    const sql = neon(databaseUrl);
    try {
        const res = await sql`SELECT id, status, supplier_name FROM purchase_lots`;
        console.log('Purchase Lots Status:', res);
    } catch (e) {
        console.error('Error:', e.message);
    }
}
check();
