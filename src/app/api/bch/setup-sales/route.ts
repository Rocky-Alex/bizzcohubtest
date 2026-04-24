import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        console.log("Starting Sales Module Setup...");

        // 1. Create Sales Out Table
        await sql`
            CREATE TABLE IF NOT EXISTS sales_out (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER NOT NULL, -- Logical link to invoice_items or invoices table
                invoice_no VARCHAR(100) NOT NULL,
                inventory_id INTEGER REFERENCES master_inventory(id),
                barcode VARCHAR(100) NOT NULL,
                product_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Sold Out', -- 'Sold Out', 'Return Initiated', 'QC Pending', 'Restocked'
                sold_by VARCHAR(100),
                sold_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table sales_out created/verified.");

        // 2. Create Sales Returns Table
        await sql`
            CREATE TABLE IF NOT EXISTS sales_returns (
                id SERIAL PRIMARY KEY,
                sales_out_id INTEGER REFERENCES sales_out(id),
                inventory_id INTEGER REFERENCES master_inventory(id),
                return_reason TEXT,
                qc_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending QC', 'Confirmed QC', 'Cancelled'
                qc_notes TEXT,
                initiated_by VARCHAR(100),
                initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                qc_confirmed_by VARCHAR(100),
                qc_confirmed_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table sales_returns created/verified.");

        // Indexes for performance
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_out_invoice ON sales_out(invoice_no)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_out_barcode ON sales_out(barcode)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_returns_so_id ON sales_returns(sales_out_id)`;

        return NextResponse.json({ 
            success: true, 
            message: "Sales DB Setup Complete",
            tables: ["sales_out", "sales_returns"]
        });
    } catch (e: any) {
        console.error("Sales DB setup failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
