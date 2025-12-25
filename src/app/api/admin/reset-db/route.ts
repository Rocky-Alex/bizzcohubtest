import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { invoiceSql } from '@/lib/invoice-db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        console.log('Wiping database...');

        // 1. Drop all tables
        // Dropping from both clients to ensure cleanup if databases are same or different
        try {
            await invoiceSql`DROP TABLE IF EXISTS invoice_items, quotation_items, invoices, quotations CASCADE`;
            await sql`DROP TABLE IF EXISTS invoice_items, quotation_items, invoices, quotations CASCADE`;
        } catch (e) { console.log('Note: Drop Invoice tables error', e); }

        try {
            await sql`DROP TABLE IF EXISTS orders, products, customers, activity_logs, users, roles CASCADE`;
            // Try invoiceSql too for products if mixed
            await invoiceSql`DROP TABLE IF EXISTS products CASCADE`;
        } catch (e) { console.log('Note: Drop Main tables error', e); }

        console.log('Tables dropped.');

        // 2. Recreate Tables
        const p1 = sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                email VARCHAR(100),
                phone VARCHAR(20),
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                approval_status VARCHAR(20) DEFAULT 'approved',
                avatar TEXT,
                created_by VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const p2 = sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                product_code TEXT UNIQUE,
                product_name TEXT NOT NULL,
                type TEXT,
                brand TEXT,
                model TEXT,
                series TEXT,
                category TEXT,
                badge TEXT,
                condition_status TEXT,
                base_price NUMERIC,
                offer_price NUMERIC,
                discount_percent NUMERIC,
                stock_quantity INTEGER,
                processor TEXT,
                processor_gen TEXT,
                processor_speed TEXT,
                ram TEXT,
                ram_type TEXT,
                storage TEXT,
                storage_type TEXT,
                graphics_card TEXT,
                graphics_card_type TEXT,
                graphics_storage TEXT,
                screen_size TEXT,
                screen_resolution TEXT,
                screen_resolution_pixel TEXT,
                display_type TEXT,
                wireless_type TEXT,
                operating_system TEXT,
                optical_drive TEXT,
                colors TEXT,
                features TEXT,
                primary_image_url TEXT,
                all_images_urls TEXT,
                ram_variants JSONB,
                storage_variants JSONB,
                date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const p3 = sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_number TEXT UNIQUE,
                customer_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                city TEXT,
                zip TEXT,
                country TEXT,
                items JSONB,
                subtotal NUMERIC,
                tax NUMERIC,
                shipping_cost NUMERIC,
                total NUMERIC,
                payment_method TEXT,
                status TEXT DEFAULT 'Pending',
                customer_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const p4 = sql`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                image_url TEXT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                currency VARCHAR(10),
                billing_name VARCHAR(255),
                billing_address_1 VARCHAR(255),
                billing_country VARCHAR(100),
                billing_state VARCHAR(100),
                billing_city VARCHAR(100),
                billing_zip VARCHAR(20),
                shipping_name VARCHAR(255),
                shipping_address_1 VARCHAR(255),
                shipping_country VARCHAR(100),
                shipping_state VARCHAR(100),
                shipping_city VARCHAR(100),
                shipping_zip VARCHAR(20),
                status VARCHAR(20) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                username VARCHAR(255),
                password_hash TEXT,
                avatar TEXT,
                deactivated_at TIMESTAMP
            )
        `;

        const p5 = sql`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_name TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                status TEXT,
                role TEXT,
                ip TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const p6 = invoiceSql`
            CREATE TABLE IF NOT EXISTS invoices (
                id SERIAL PRIMARY KEY,
                invoice_no TEXT UNIQUE,
                customer_id INTEGER,
                customer_name TEXT,
                customer_address TEXT,
                customer_email TEXT,
                customer_phone TEXT,
                created_date TIMESTAMP,
                due_date TIMESTAMP,
                sub_total NUMERIC,
                discount_total NUMERIC,
                tax_rate NUMERIC,
                tax_amount NUMERIC,
                total_amount NUMERIC,
                payment_type TEXT,
                status TEXT DEFAULT 'Pending',
                is_taxable BOOLEAN,
                is_discountable BOOLEAN,
                advance_received NUMERIC DEFAULT 0,
                notes TEXT
            )
        `;

        const p7 = invoiceSql`
            CREATE TABLE IF NOT EXISTS invoice_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
                description TEXT,
                quantity NUMERIC,
                unit_price NUMERIC,
                discount NUMERIC,
                total NUMERIC,
                product_code TEXT
            )
        `;

        const p8 = invoiceSql`
            CREATE TABLE IF NOT EXISTS quotations (
                id SERIAL PRIMARY KEY,
                quotation_no TEXT UNIQUE,
                customer_id INTEGER,
                customer_name TEXT,
                customer_address TEXT,
                customer_email TEXT,
                customer_phone TEXT,
                created_date TIMESTAMP,
                due_date TIMESTAMP,
                sub_total NUMERIC,
                discount_total NUMERIC,
                tax_rate NUMERIC,
                tax_amount NUMERIC,
                total_amount NUMERIC,
                payment_type TEXT,
                status TEXT DEFAULT 'Pending',
                is_taxable BOOLEAN,
                is_discountable BOOLEAN,
                advance_received NUMERIC DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const p9 = invoiceSql`
            CREATE TABLE IF NOT EXISTS quotation_items (
                id SERIAL PRIMARY KEY,
                quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
                description TEXT,
                quantity NUMERIC,
                unit_price NUMERIC,
                discount NUMERIC,
                total NUMERIC
            )
        `;

        await Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9]);

        console.log('Tables recreated.');

        // 3. Create Default Admin
        const password = 'admin'; // Default password
        const passwordHash = createHash('sha256').update(password).digest('hex');

        await sql`
            INSERT INTO users (
                username, 
                first_name, 
                last_name, 
                email, 
                password_hash, 
                role, 
                status, 
                approval_status, 
                created_by
            )
            VALUES (
                'admin', 
                'Admin', 
                'User', 
                'admin@bizzcohub.com', 
                ${passwordHash}, 
                'admin', 
                'active', 
                'approved', 
                'system'
            )
        `;

        console.log('Default admin created.');

        return NextResponse.json({
            message: 'Database fully wiped and reset to factory settings.',
            details: 'All tables recreated empty. Default admin created: username: admin, password: admin'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error wiping database:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
