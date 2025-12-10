/**
 * Database Setup Script (CommonJS version)
 * Recreates the users table with all necessary fields
 */

const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    try {
        console.log('🔄 Starting database setup...\n');

        // Load environment variables from .env.local first, then .env
        require('dotenv').config({ path: '.env.local' });
        require('dotenv').config(); // Fallback to .env

        // Import neon directly
        const { neon } = require('@neondatabase/serverless');

        const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

        if (!databaseUrl) {
            console.error('❌ Database URL not found in environment variables!');
            console.error('Please set POSTGRES_URL or DATABASE_URL in your .env file\n');
            process.exit(1);
        }

        console.log('✅ Database URL found');
        console.log('📡 Connecting to database...\n');

        const sql = neon(databaseUrl);

        // Read the SQL script
        const sqlFilePath = path.join(__dirname, 'recreate_users_table.sql');
        console.log(`📄 Reading SQL script from: ${sqlFilePath}\n`);

        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

        // Split into individual statements and clean them
        const statements = sqlScript
            .split(';')
            .map(s => s.trim())
            .filter(s => {
                // Remove comments and empty statements
                const cleaned = s.replace(/--.*$/gm, '').trim();
                return cleaned.length > 0 &&
                    !cleaned.startsWith('SELECT') && // Skip SELECT statements for display
                    !cleaned.match(/^\/\*/); // Skip block comments
            });

        console.log(`📝 Executing SQL statements...\n`);

        let successCount = 0;
        let skipCount = 0;

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();

            if (!statement) continue;

            try {
                console.log(`⚙️  Executing statement ${i + 1}...`);
                await sql(statement);
                successCount++;
                console.log(`✅ Success`);
            } catch (error) {
                // Some statements might fail (like DROP TABLE if table doesn't exist)
                if (error.message.includes('does not exist')) {
                    skipCount++;
                    console.log(`⚠️  Skipped (object doesn't exist)`);
                } else if (error.message.includes('already exists')) {
                    skipCount++;
                    console.log(`⚠️  Skipped (already exists)`);
                } else {
                    console.error(`❌ Error:`, error.message);
                }
            }
        }

        console.log(`\n📊 Execution Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ⚠️  Skipped: ${skipCount}`);

        console.log('\n✅ Database setup completed!');
        console.log('\n📊 Default Admin User:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('   ⚠️  Please change this password after first login!\n');

        // Verify the table was created
        console.log('🔍 Verifying table structure...');

        try {
            const result = await sql`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            `;

            if (result.length > 0) {
                console.log('\n📋 Users Table Columns:');
                result.forEach(col => {
                    const required = col.is_nullable === 'NO' ? '(Required)' : '';
                    console.log(`   - ${col.column_name} (${col.data_type}) ${required}`);
                });
            }

            // Check if admin user exists
            const adminCheck = await sql`SELECT username, email, role FROM users WHERE username = 'admin'`;
            if (adminCheck.length > 0) {
                console.log('\n👤 Admin user verified:');
                console.log(`   Username: ${adminCheck[0].username}`);
                console.log(`   Email: ${adminCheck[0].email}`);
                console.log(`   Role: ${adminCheck[0].role}`);
            }
        } catch (verifyError) {
            console.log('\n⚠️  Could not verify table structure:', verifyError.message);
        }

        console.log('\n🎉 Setup complete! You can now start using the application.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Database setup failed:', error.message);
        console.error('\nPlease check:');
        console.error('1. Database connection settings in .env file');
        console.error('2. Database server is running');
        console.error('3. Database user has necessary permissions');
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

// Run the setup
setupDatabase();
