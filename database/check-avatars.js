require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);

sql`SELECT id, username, avatar FROM users`
    .then(users => {
        console.log('\n📊 Users in database:\n');
        users.forEach(u => {
            console.log(`   ${u.username}:`);
            console.log(`      Avatar: ${u.avatar || 'NULL (no avatar set)'}\n`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
