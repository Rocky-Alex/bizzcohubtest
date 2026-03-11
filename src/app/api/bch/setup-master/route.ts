import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        console.log("Starting Master Inventory Setup (v2)...");

        // 1. Drop Table to ensure Schema Updates
        await sql`DROP TABLE IF EXISTS master_inventory CASCADE`;

        // 2. Create Table
        await sql`
            CREATE TABLE IF NOT EXISTS master_inventory (
                id SERIAL PRIMARY KEY,
                qc_id INTEGER UNIQUE, -- Link to source inventory_qc.id
                barcode VARCHAR,
                sku VARCHAR,
                lot_id INTEGER,
                lot_number VARCHAR,
                lot_notes TEXT, -- Added based on audio
                
                -- Product Details
                product_name VARCHAR,
                brand VARCHAR,
                model VARCHAR,
                series VARCHAR,
                category VARCHAR,
                type VARCHAR,
                
                -- Specs
                processor VARCHAR,
                processor_gen VARCHAR,
                processor_speed VARCHAR,
                ram VARCHAR,
                ram_type VARCHAR,
                storage VARCHAR,
                storage_type VARCHAR,
                graphics_card VARCHAR,
                screen_size VARCHAR,
                screen_resolution VARCHAR,
                condition_status VARCHAR,
                qc_status VARCHAR, -- Added based on mapping logic
                
                -- Financials
                unit_cost DECIMAL(12,2),
                total_cost DECIMAL(12,2), -- Batch Total Cost
                base_price DECIMAL(12,2),
                offer_price DECIMAL(12,2),
                quantity INTEGER DEFAULT 1,
                supplier_name VARCHAR,
                invoice_number VARCHAR,
                invoice_date DATE,
                
                -- Metadata
                primary_image_url TEXT,
                all_images_urls TEXT,
                qc_created_by VARCHAR,
                qc_created_at TIMESTAMP WITH TIME ZONE,
                
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        `;
        console.log("Table master_inventory created.");



        return NextResponse.json({ success: true, message: "Master Inventory Setup Complete (v2)" });
    } catch (e: any) {
        console.error("Setup failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
