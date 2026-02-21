
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        console.log('--- purchase_lot_items ---');
        const res1 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'purchase_lot_items';
        `);
        console.table(res1.rows);

        console.log('--- purchase_lots ---');
        const res2 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'purchase_lots';
        `);
        console.table(res2.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkSchema();
