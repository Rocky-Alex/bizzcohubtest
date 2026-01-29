
import * as dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';

async function main() {
    console.log("🛠️ Creating Admin User...");

    try {
        const { db } = await import("@/db");
        const { users } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const email = "admin@example.com";
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const existing = await db.select().from(users).where(eq(users.email, email));
        if (existing.length > 0) {
            console.log("⚠️ Admin user already exists. Updating password...");
            await db.update(users).set({
                passwordHash: hashedPassword,
                role: 'Super Admin',
                status: 'Active'
            }).where(eq(users.email, email));
            console.log(`✅ Admin updated: ${email} / ${password}`);
        } else {
            await db.insert(users).values({
                fullName: "System Admin",
                email: email,
                passwordHash: hashedPassword,
                role: "Super Admin",
                status: "Active"
            });
            console.log(`✅ Admin created: ${email} / ${password}`);
        }
    } catch (e) {
        console.error("❌ Error creating admin:", e);
    }
}

main();
