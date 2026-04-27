const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;

async function test() {
    console.log('Testing connection to:', url ? url.replace(/:[^:@/]+@/, ':***@') : 'UNDEFINED');
    if (!url) return;
    
    const sql = neon(url);
    try {
        const result = await sql`SELECT NOW()`;
        console.log('Success:', result);
    } catch (e) {
        console.error('Failure:', e);
    }
}

test();
