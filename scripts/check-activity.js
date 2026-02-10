const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function check() {
    const databaseUrl = process.env.POSTGRES_URL || process.env.MAIN_POSTGRES_URL;
    if (!databaseUrl) {
        console.error('Error: POSTGRES_URL or MAIN_POSTGRES_URL not found in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 10");
        console.log('Recent Activity:', res.rows.map(r => ({ log: r.details, time: r.timestamp })));
    } catch (e) {
        if (e.code === '42P01') {
            console.log('Table activity_logs does not exist yet.');
        } else {
            console.error(e);
        }
    } finally {
        await client.end();
    }
}
check();
