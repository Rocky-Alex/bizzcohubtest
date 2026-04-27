const { Client } = require('pg');
require('dotenv').config();

async function clearDatabase() {
    const url = process.env.LOCAL_POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) {
        console.error('No database URL found in .env');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        // Get all tables in public schema
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        `);

        const tables = res.rows.map(row => row.table_name);
        if (tables.length === 0) {
            console.log('No tables found in public schema.');
            return;
        }

        console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
        
        // Truncate all tables
        const truncateQuery = `TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
        console.log('Clearing data...');
        await client.query(truncateQuery);
        console.log('Successfully cleared all tables.');

    } catch (err) {
        console.error('Error clearing database:', err);
    } finally {
        await client.end();
    }
}

clearDatabase();
