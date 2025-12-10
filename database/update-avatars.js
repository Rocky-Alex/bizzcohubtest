require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);

async function updateAvatars() {
    try {
        console.log('🔄 Updating user avatars...\n');

        // Get all users
        const users = await sql`SELECT id, username FROM users`;

        for (const user of users) {
            const avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${user.username}&backgroundColor=b6e3f4`;

            await sql`UPDATE users SET avatar = ${avatarUrl} WHERE id = ${user.id}`;
            console.log(`✅ Updated ${user.username} with avatar`);
        }

        // Verify
        const updated = await sql`SELECT username, LEFT(avatar, 50) as avatar_preview FROM users`;
        console.log('\n📊 Updated users:\n');
        updated.forEach(u => {
            console.log(`   ✅ ${u.username}: ${u.avatar_preview}...`);
        });

        console.log('\n✅ All avatars updated! Refresh your browser.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

updateAvatars();
