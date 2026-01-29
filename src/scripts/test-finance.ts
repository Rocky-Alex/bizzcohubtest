
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("🧪 Starting Finance Verification...");

    // Dynamic imports
    const { db } = await import("@/db");
    const { accountingLedger } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    // 1. Add Income (Simulating a Sale)
    console.log("1️⃣ Adding Income...");
    await db.insert(accountingLedger).values({
        type: 'Income',
        amount: '1500.00',
        description: 'Sale of Laptop X1',
        date: new Date()
    });

    // 2. Add Expense (Rent)
    console.log("2️⃣ Adding Expense...");
    await db.insert(accountingLedger).values({
        type: 'Expense',
        amount: '500.00',
        description: 'Office Rent - Jan',
        date: new Date()
    });

    // 3. Verify Totals Logic (Mocking the API logic)
    // In a real integration test we'd hit the API, here we verify the DB state
    const entries = await db.select().from(accountingLedger);
    console.log(`✅ Found ${entries.length} ledger entries.`);

    let income = 0;
    let expense = 0;

    entries.forEach(e => {
        if (e.type === 'Income') income += parseFloat(e.amount);
        if (e.type === 'Expense') expense += parseFloat(e.amount);
    });

    console.log(`📊 Income: $${income}, Expense: $${expense}, Net: $${income - expense}`);

    if (income >= 1500 && expense >= 500) {
        console.log("✅ Financial data verified.");
    } else {
        console.error("❌ Mismatch in expected values.");
    }
}

main();
