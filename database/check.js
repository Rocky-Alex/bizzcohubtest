/**
 * Database Table Checker
 * Checks if the users table exists and has all required columns
 */

async function checkDatabase() {
    try {
        console.log('🔍 Checking database structure...\n');

        // Load environment variables
        require('dotenv').config({ path: '.env.local' });
        require('dotenv').config();

        const { neon } = require('@neondatabase/serverless');
        const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL);

        // Check if users table exists
        console.log('1️⃣ Checking if users table exists...');
        const tableExists = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `;

        if (!tableExists[0].exists) {
            console.log('❌ Users table does NOT exist!');
            console.log('\n📋 To create the table, run:');
            console.log('   node database/setup.js');
            console.log('   OR');
            console.log('   psql -U your_username -d your_database -f database/recreate_users_table.sql\n');
            process.exit(1);
        }

        console.log('✅ Users table exists\n');

        // Check table columns
        console.log('2️⃣ Checking table columns...');
        const columns = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `;

        console.log('\n📋 Current table structure:');
        console.log('┌─────────────────────┬──────────────────┬──────────┐');
        console.log('│ Column              │ Type             │ Nullable │');
        console.log('├─────────────────────┼──────────────────┼──────────┤');
        columns.forEach(col => {
            const name = col.column_name.padEnd(19);
            const type = col.data_type.padEnd(16);
            const nullable = col.is_nullable.padEnd(8);
            console.log(`│ ${name} │ ${type} │ ${nullable} │`);
        });
        console.log('└─────────────────────┴──────────────────┴──────────┘\n');

        // Check for required columns
        const requiredColumns = [
            'id', 'username', 'password_hash', 'email', 'phone',
            'role', 'status', 'approval_status', 'avatar',
            'created_by', 'created_at', 'updated_at'
        ];

        const existingColumns = columns.map(c => c.column_name);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
            console.log('⚠️  Missing columns:', missingColumns.join(', '));
            console.log('\n📋 To fix this, run:');
            console.log('   node database/setup.js\n');
        } else {
            console.log('✅ All required columns exist\n');
        }

        // Check for users
        console.log('3️⃣ Checking for existing users...');
        const users = await sql`SELECT id, username, role, status FROM users LIMIT 5`;

        if (users.length === 0) {
            console.log('⚠️  No users found in database');
            console.log('\n📋 To create a default admin user, run:');
            console.log('   node database/setup.js\n');
        } else {
            console.log(`✅ Found ${users.length} user(s):\n`);
            users.forEach(user => {
                console.log(`   - ${user.username} (${user.role}) - ${user.status}`);
            });
            console.log('');
        }

        // Check avatar column specifically
        const avatarColumn = columns.find(c => c.column_name === 'avatar');
        if (avatarColumn) {
            console.log('4️⃣ Avatar column check:');
            console.log(`   ✅ Type: ${avatarColumn.data_type}`);
            console.log(`   ✅ Nullable: ${avatarColumn.is_nullable}\n`);
        } else {
            console.log('4️⃣ Avatar column check:');
            console.log('   ❌ Avatar column is missing!\n');
        }

        console.log('🎉 Database check complete!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Database check failed:', error);
        console.error('\nPossible issues:');
        console.error('1. Database is not running');
        console.error('2. Connection settings in .env are incorrect');
        console.error('3. Database user lacks permissions\n');
        process.exit(1);
    }
}

checkDatabase();
