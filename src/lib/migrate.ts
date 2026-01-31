
import { sql } from '@/lib/db';

async function main() {
    console.log('Running database migrations...');

    try {
        console.log('migrating customers...');
        // Customers Table
        await sql`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                username VARCHAR(255) UNIQUE,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(50),
                password_hash VARCHAR(255),
                avatar VARCHAR(1024),
                image_url VARCHAR(1024),
                status VARCHAR(50) DEFAULT 'Active',
                deactivated_at TIMESTAMP,
                currency VARCHAR(10),
                billing_name VARCHAR(255),
                billing_address_1 TEXT,
                billing_country VARCHAR(100),
                billing_state VARCHAR(100),
                billing_city VARCHAR(100),
                billing_zip VARCHAR(20),
                shipping_name VARCHAR(255),
                shipping_address_1 TEXT,
                shipping_country VARCHAR(100),
                shipping_state VARCHAR(100),
                shipping_city VARCHAR(100),
                shipping_zip VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('migrating orders...');
        // Orders Table
        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id VARCHAR(255), -- Using Email as ID
                customer_name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                city VARCHAR(100),
                zip VARCHAR(20),
                country VARCHAR(100),
                items JSONB,
                subtotal DECIMAL(10, 2),
                tax DECIMAL(10, 2),
                shipping_cost DECIMAL(10, 2),
                total DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'Pending',
                payment_method VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        // Optimization: Index for faster order lookups by customer
        await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`;

        console.log('migrating wishlist...');
        // Wishlist Table
        await sql`
            CREATE TABLE IF NOT EXISTS wishlist (
                id SERIAL PRIMARY KEY,
                customer_id VARCHAR(255) NOT NULL,
                product_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(customer_id, product_id)
            )
        `;
        // Optimization: Index for faster wishlist lookups
        await sql`CREATE INDEX IF NOT EXISTS idx_wishlist_customer_id ON wishlist(customer_id)`;

        console.log('migrating invoices...');
        // Invoices Tables
        await sql`
            CREATE TABLE IF NOT EXISTS invoices (
                id SERIAL PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL,
                customer_id VARCHAR(255), -- Updated to VARCHAR
                customer_name VARCHAR(255),
                customer_address TEXT,
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                created_date DATE,
                due_date DATE,
                sub_total NUMERIC(15, 2),
                discount_total NUMERIC(15, 2),
                tax_rate NUMERIC(5, 2),
                tax_amount NUMERIC(15, 2),
                total_amount NUMERIC(15, 2),
                payment_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Pending',
                is_taxable BOOLEAN DEFAULT TRUE,
                is_discountable BOOLEAN DEFAULT TRUE,
                advance_received NUMERIC(15, 2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)`;

        await sql`
            CREATE TABLE IF NOT EXISTS invoice_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
                description TEXT,
                quantity INTEGER,
                unit_price NUMERIC(15, 2),
                discount NUMERIC(15, 2),
                total NUMERIC(15, 2)
            )
        `;

        console.log('migrating quotations...');
        // Quotations Tables
        await sql`
            CREATE TABLE IF NOT EXISTS quotations (
                id SERIAL PRIMARY KEY,
                quotation_no VARCHAR(50) UNIQUE NOT NULL,
                customer_id VARCHAR(255), -- Updated to VARCHAR
                customer_name VARCHAR(255),
                customer_address TEXT,
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                created_date DATE,
                due_date DATE,
                sub_total NUMERIC(15, 2),
                discount_total NUMERIC(15, 2),
                tax_rate NUMERIC(5, 2),
                tax_amount NUMERIC(15, 2),
                total_amount NUMERIC(15, 2),
                payment_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Pending',
                is_taxable BOOLEAN DEFAULT TRUE,
                is_discountable BOOLEAN DEFAULT TRUE,
                advance_received NUMERIC(15, 2) DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id)`;
        await sql`
            CREATE TABLE IF NOT EXISTS quotation_items (
                id SERIAL PRIMARY KEY,
                quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
                description TEXT,
                quantity INTEGER,
                unit_price NUMERIC(15, 2),
                discount NUMERIC(15, 2),
                total NUMERIC(15, 2)
            )
        `;


        console.log('migrating purchase_lots...');
        await sql`
            CREATE TABLE IF NOT EXISTS purchase_lots (
                id SERIAL PRIMARY KEY,
                lot_number VARCHAR(100),
                supplier_name VARCHAR(255),
                invoice_number VARCHAR(100),
                invoice_date DATE,
                total_cost NUMERIC(15, 2),
                status VARCHAR(50) DEFAULT 'Active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('migrating purchase_lot_items...');
        await sql`
            CREATE TABLE IF NOT EXISTS purchase_lot_items (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(id) ON DELETE CASCADE,
                product_name VARCHAR(255),
                sku VARCHAR(100),
                quantity INTEGER DEFAULT 0,
                unit_cost NUMERIC(15, 2) DEFAULT 0,
                brand VARCHAR(100),
                model VARCHAR(100),
                series VARCHAR(100),
                processor VARCHAR(100),
                processor_gen VARCHAR(100),
                ram VARCHAR(50),
                storage VARCHAR(50),
                product_type VARCHAR(100),
                description TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('migrating inventory_qc...');
        await sql`
            CREATE TABLE IF NOT EXISTS inventory_qc (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(id),
                purchase_lot_item_id INTEGER REFERENCES purchase_lot_items(id),
                product_id INTEGER, -- Link to main products table if synced
                sku VARCHAR(100),
                product_name VARCHAR(255),
                brand VARCHAR(100),
                model VARCHAR(100),
                series VARCHAR(100),
                processor VARCHAR(100),
                processor_gen VARCHAR(100),
                ram VARCHAR(50),
                storage VARCHAR(50),
                graphics_card VARCHAR(255),
                screen_size VARCHAR(50),
                screen_resolution VARCHAR(100),
                keyboard_type VARCHAR(100),
                keyboard_backlit VARCHAR(50),
                condition_status VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Passed',
                notes TEXT,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Support running directly if possible, or via API route
export default main; 
