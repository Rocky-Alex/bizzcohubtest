
import * as dotenv from 'dotenv';
dotenv.config();
import { createHash } from 'crypto';

async function main() {
    console.log("🛠️ Creating Admin Customer Record...");

    try {
        const { db } = await import("@/db");
        const { customers } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const email = "admin@example.com";
        const password = "password123";
        const passwordHash = createHash('sha256').update(password).digest('hex');

        // Check if exists
        const existing = await db.select().from(customers).where(eq(customers.email, email));

        if (existing.length > 0) {
            console.log("⚠️ Admin customer already exists. Updating password...");
            await db.update(customers).set({
                passwordHash: passwordHash,
                username: 'admin',
                status: 'Active'
            }).where(eq(customers.email, email));
        } else {
            await db.insert(customers).values({
                name: "System Admin",
                username: "admin",
                email: email,
                passwordHash: passwordHash,
                status: "Active"
            });
            console.log(`✅ Admin Customer created: ${email}`);
        }
    } catch (e) {
        console.error("❌ Error:", e);
    }
}

main();
