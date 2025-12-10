/**
 * Quick Database Verification
 */

async function verify() {
    try {
        require('dotenv').config({ path: '.env.local' });
        const { neon } = require('@neondatabase/serverless');
        const sql = neon(process.env.POSTGRES_URL);

        console.log('✅ Database connected\n');

        // Check users table
        const users = await sql`SELECT id, username, role, avatar FROM users LIMIT 5`;
        console.log(`✅ Users table exists with ${users.length} user(s)\n`);

        users.forEach(u => {
            console.log(`   - ${u.username} (${u.role}) ${u.avatar ? '🖼️ Has avatar' : '⚪ No avatar'}`);
        });

        // Check avatar column
        const cols = await sql`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'avatar'
        `;

        console.log(`\n✅ Avatar column: ${cols.length > 0 ? 'EXISTS' : 'MISSING'}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verify();
