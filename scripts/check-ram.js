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
        const rows = await sql`SELECT * FROM drop_lists WHERE category = 'RAM'`;
        console.log('RAM Items:', rows);
    } catch (e) {
        console.error('Error:', e.message);
    }
}
check();
