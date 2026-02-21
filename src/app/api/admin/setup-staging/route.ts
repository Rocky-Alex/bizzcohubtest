import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS purchase_lots (
                id SERIAL PRIMARY KEY,
                lot_number VARCHAR(50) UNIQUE,
                supplier_name VARCHAR(255),
                invoice_number VARCHAR(100),
                invoice_date DATE,
                total_cost DECIMAL(15, 2),
                notes TEXT,
                status VARCHAR(50) DEFAULT 'Pending',
                created_by VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS purchase_lot_items (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(id) ON DELETE CASCADE,
                
                product_name VARCHAR(255),
                product_type VARCHAR(100),
                
                brand VARCHAR(100),
                model VARCHAR(100),
                series VARCHAR(100),
                
                processor VARCHAR(100),
                processor_gen VARCHAR(100),
                ram VARCHAR(50),
                storage VARCHAR(50),
                graphics VARCHAR(100),
                
                screen_size VARCHAR(50),
                screen_resolution VARCHAR(100),
                
                condition_status VARCHAR(50),
                
                quantity INTEGER DEFAULT 1,
                unit_cost DECIMAL(10, 2),
                total_cost DECIMAL(15, 2),
                
                sku VARCHAR(100), -- Supplier SKU if any
                
                qc_count INTEGER DEFAULT 0, -- Track how many moved to master
                
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        return NextResponse.json({ success: true, message: 'Staging tables created' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
