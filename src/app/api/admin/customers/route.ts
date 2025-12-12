import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        // Create table if not exists
        // Note: For development, we might want to drop if schema changes, but normally migration tools handle this.
        // We will stick to IF NOT EXISTS but user might need to drop manually if table exists with old schema.
        await sql`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                image_url TEXT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                currency VARCHAR(10),
                
                -- Billing
                billing_name VARCHAR(255),
                billing_address_1 VARCHAR(255),
                billing_country VARCHAR(100),
                billing_state VARCHAR(100),
                billing_city VARCHAR(100),
                
                -- Shipping
                shipping_name VARCHAR(255),
                shipping_address_1 VARCHAR(255),
                shipping_country VARCHAR(100),
                shipping_state VARCHAR(100),
                shipping_city VARCHAR(100),
                
                status VARCHAR(20) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Migration: Ensure new columns exist if table already existed check
        // This is safe to run repeatedly (IF NOT EXISTS)
        await sql`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS billing_address_1 VARCHAR(255),
            ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100),
            ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100),
            ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_address_1 VARCHAR(255),
            ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
        `;

        const customers = await sql`SELECT * FROM customers ORDER BY created_at DESC`;

        return NextResponse.json({ customers });
    } catch (error: any) {
        console.error('Error fetching customers:', error);
        return NextResponse.json({ error: 'Failed to fetch customers', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Migration: Ensure new columns exist (idempotent)
        await sql`
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
                shipping_name VARCHAR(255),
                shipping_address_1 VARCHAR(255),
                shipping_country VARCHAR(100),
                shipping_state VARCHAR(100),
                shipping_city VARCHAR(100),
                status VARCHAR(20) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS billing_address_1 VARCHAR(255),
            ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100),
            ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100),
            ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_address_1 VARCHAR(255),
            ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
        `;

        // Insert into database
        const newCustomer = await sql`
            INSERT INTO customers (
                image_url, 
                name, 
                email, 
                phone, 
                currency, 
                
                billing_name, 
                billing_address_1, 
                billing_country, 
                billing_state, 
                billing_city, 
                
                shipping_name, 
                shipping_address_1, 
                shipping_country, 
                shipping_state, 
                shipping_city, 
                
                status
            ) VALUES (
                ${body.avatar || null}, 
                ${body.name}, 
                ${body.email}, 
                ${body.phone}, 
                ${body.currency}, 
                
                ${body.billingName}, 
                ${body.billingAddress1}, 
                ${body.billingCountry}, 
                ${body.billingState}, 
                ${body.billingCity}, 
                
                ${body.shippingName}, 
                ${body.shippingAddress1}, 
                ${body.shippingCountry}, 
                ${body.shippingState}, 
                ${body.shippingCity}, 
                
                'Active'
            )
            RETURNING *
        `;

        return NextResponse.json({ customer: newCustomer[0] });
    } catch (error: any) {
        console.error('Error creating customer:', error);
        return NextResponse.json({ error: 'Failed to create customer', details: error.message }, { status: 500 });
    }
}
