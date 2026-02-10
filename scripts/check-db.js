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
        const lots = await sql`SELECT * FROM purchase_lots`;
        console.log('Total Lots:', lots.length);
        console.log('Recent 5 Lots:', JSON.stringify(lots.slice(0, 5), null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
