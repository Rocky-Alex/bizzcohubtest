import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        console.log("Starting Accounting Database Setup (v2)...");

        // 0. Sync Users Sequence for Auto-Increment (Crucial for manual insertions)
        try {
            await sql`CREATE SEQUENCE IF NOT EXISTS users_id_seq`;
            await sql`ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq')`;
            await sql`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false)`;
        } catch (e) {
            console.log("Users sequence update skipped (might already be serial).");
        }

        // 1. Create Chart of Accounts
        await sql`
            CREATE TABLE IF NOT EXISTS chart_of_accounts (
                account_id SERIAL PRIMARY KEY,
                account_name VARCHAR(100) NOT NULL UNIQUE,
                account_type VARCHAR(50) NOT NULL,
                category VARCHAR(50) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table chart_of_accounts created/verified.");

        // Insert Mandatory UAE Ledgers
        const defaultAccounts = [
            { name: 'Cash in Hand (AED)', type: 'asset', category: 'Asset' },
            { name: 'Bank Account (AED)', type: 'asset', category: 'Asset' },
            { name: 'Accounts Receivable', type: 'asset', category: 'Asset' },
            { name: 'Accounts Payable', type: 'liability', category: 'Liability' },
            { name: 'Tax Input 5%', type: 'asset', category: 'Asset' },
            { name: 'Tax Output 5%', type: 'liability', category: 'Liability' },
            { name: 'Capital Account', type: 'equity', category: 'Equity' },
            { name: 'Owner Drawings', type: 'equity', category: 'Equity' },
            { name: 'Office Expense', type: 'expense', category: 'Indirect Expense' },
            { name: 'Transportation Expense', type: 'expense', category: 'Indirect Expense' },
            { name: 'Lot Expense', type: 'expense', category: 'Direct Expense' },
            { name: 'Sales Income', type: 'income', category: 'Income' },
            { name: 'Other Income', type: 'income', category: 'Income' }
        ];

        for (const acc of defaultAccounts) {
            await sql`
                INSERT INTO chart_of_accounts (account_name, account_type, category)
                VALUES (${acc.name}, ${acc.type}, ${acc.category})
                ON CONFLICT (account_name) DO NOTHING;
            `;
        }
        console.log("Mandatory UAE Ledgers seeded.");

        // 2. Create Lots Table
        await sql`
            CREATE TABLE IF NOT EXISTS lots (
                lot_id SERIAL PRIMARY KEY,
                lot_name VARCHAR(100) NOT NULL UNIQUE,
                total_units INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table lots created/verified.");

        // 3. Create Cash Book (Main Entry)
        await sql`
            CREATE TABLE IF NOT EXISTS cash_book (
                transaction_id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                voucher_no VARCHAR(50),
                account_id INTEGER REFERENCES chart_of_accounts(account_id),
                transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('receipt', 'payment')),
                debit DECIMAL(15,2) DEFAULT 0.00,
                credit DECIMAL(15,2) DEFAULT 0.00,
                lot_id INTEGER REFERENCES lots(lot_id),
                description TEXT,
                created_by VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table cash_book created/verified.");

        // Indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_cb_date ON cash_book(date)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_cb_acc ON cash_book(account_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_cb_lot ON cash_book(lot_id)`;

        return NextResponse.json({ 
            success: true, 
            message: "UAE Accounting Database Setup Complete",
            tables: ["chart_of_accounts", "lots", "cash_book"]
        });
    } catch (e: any) {
        console.error("Accounting setup failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
