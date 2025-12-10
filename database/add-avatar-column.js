/**
 * Add Avatar Column to Users Table
 */

async function addAvatarColumn() {
    try {
        console.log('🔄 Adding avatar column to users table...\n');

        // Load environment variables
        require('dotenv').config({ path: '.env.local' });
        require('dotenv').config();

        const { neon } = require('@neondatabase/serverless');
        const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL);

        // Add avatar column
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`;

        console.log('✅ Avatar column added successfully!\n');

        // Verify
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'avatar'
        `;

        if (result.length > 0) {
            console.log('✅ Verified: Avatar column exists');
            console.log(`   Type: ${result[0].data_type}\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addAvatarColumn();
