import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { createHash } from 'crypto';
import { logActivity } from '@/lib/activity-logger';

export async function GET(): Promise<NextResponse> {
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
            ADD COLUMN IF NOT EXISTS billing_zip VARCHAR(20),
            ADD COLUMN IF NOT EXISTS shipping_address_1 VARCHAR(255),
            ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipping_zip VARCHAR(20),
            ADD COLUMN IF NOT EXISTS avatar TEXT,
            ADD COLUMN IF NOT EXISTS username VARCHAR(255),
            ADD COLUMN IF NOT EXISTS password_hash TEXT,
            ADD COLUMN IF NOT EXISTS visible_password TEXT,
            ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;
        `;

        const customers = await sql`SELECT * FROM customers ORDER BY created_at DESC` as unknown as any[];

        return NextResponse.json({ customers });
    } catch (error: unknown) {
        console.error('Error fetching customers:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to fetch customers', details: errorMessage }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
            ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS username VARCHAR(255),
            ADD COLUMN IF NOT EXISTS visible_password TEXT,
            ADD COLUMN IF NOT EXISTS password_hash TEXT;
        `;

        let passwordHash = null;
        if (body.password) {
            passwordHash = createHash('sha256').update(body.password).digest('hex');
        }

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
                
                status,
                username,
                password_hash,
                visible_password
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
                
                'Active',
                ${body.username || null},
                ${passwordHash},
                ${body.password || null}
            )
            RETURNING *
        ` as unknown as any[];

        await logActivity(
            'Admin',
            'Create Customer',
            `Created customer: ${body.name} (${body.email})`,
            'success',
            'Admin'
        );

        return NextResponse.json({ customer: newCustomer[0] });
    } catch (error: unknown) {
        console.error('Error creating customer:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to create customer', details: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        // If 'status' is provided alone, just update status
        if (body.status && Object.keys(body).length === 2 && body.id) {
            const updatedCustomer = await sql`
                UPDATE customers
                SET status = ${body.status}
                WHERE id = ${body.id}
                RETURNING *
            ` as unknown as any[];
            return NextResponse.json({ customer: updatedCustomer[0] });
        }

        // Full update
        // Note: Using COALESCE doesn't make sense if we want to allow clearing fields, 
        // but here we probably want to update with provided values.
        // We will assume the body contains the full form state or at least the fields that changed.

        // We map frontend field names to DB columns
        // Frontend: billingName -> DB: billing_name
        // Frontend: image_url or avatar -> DB: image_url

        let updatedCustomer: any[];

        if (body.password) {
            const passwordHash = createHash('sha256').update(body.password).digest('hex');
            updatedCustomer = await sql`
                UPDATE customers
                SET
                    image_url = ${body.image_url || body.avatar}, 
                    name = ${body.name}, 
                    email = ${body.email}, 
                    phone = ${body.phone}, 
                    currency = ${body.currency}, 
                    
                    billing_name = ${body.billingName || body.billing_name}, 
                    billing_address_1 = ${body.billingAddress1 || body.billing_address_1}, 
                    billing_country = ${body.billingCountry || body.billing_country}, 
                    billing_state = ${body.billingState || body.billing_state}, 
                    billing_city = ${body.billingCity || body.billing_city}, 
                    
                    shipping_name = ${body.shippingName || body.shipping_name}, 
                    shipping_address_1 = ${body.shippingAddress1 || body.shipping_address_1}, 
                    shipping_country = ${body.shippingCountry || body.shipping_country}, 
                    shipping_state = ${body.shippingState || body.shipping_state}, 
                    shipping_city = ${body.shippingCity || body.shipping_city},
                    
                    username = ${body.username},
                    status = ${body.status || 'Active'},
                    password_hash = ${passwordHash},
                    visible_password = ${body.password}
                WHERE id = ${body.id}
                RETURNING *
            ` as unknown as any[];
        } else {
            updatedCustomer = await sql`
                UPDATE customers
                SET
                    image_url = ${body.image_url || body.avatar}, 
                    name = ${body.name}, 
                    email = ${body.email}, 
                    phone = ${body.phone}, 
                    currency = ${body.currency}, 
                    
                    billing_name = ${body.billingName || body.billing_name}, 
                    billing_address_1 = ${body.billingAddress1 || body.billing_address_1}, 
                    billing_country = ${body.billingCountry || body.billing_country}, 
                    billing_state = ${body.billingState || body.billing_state}, 
                    billing_city = ${body.billingCity || body.billing_city}, 
                    
                    shipping_name = ${body.shippingName || body.shipping_name}, 
                    shipping_address_1 = ${body.shippingAddress1 || body.shipping_address_1}, 
                    shipping_country = ${body.shippingCountry || body.shipping_country}, 
                    shipping_state = ${body.shippingState || body.shipping_state}, 
                    shipping_city = ${body.shippingCity || body.shipping_city},
                    
                    username = ${body.username},
                    status = ${body.status || 'Active'}
                WHERE id = ${body.id}
                RETURNING *
            ` as unknown as any[];
        }

        if (updatedCustomer.length === 0) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Calculate diffs for detailed logging would require fetching old customer first.
        // For now, let's just log the action.
        await logActivity(
            'Admin',
            'Update Customer',
            body.password ? `Updated details and password for customer ${body.name}` : `Updated details for customer ${body.name}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ customer: updatedCustomer[0] });

    } catch (error: unknown) {
        console.error('Error updating customer:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to update customer', details: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        await sql`DELETE FROM customers WHERE id = ${id}`;

        await logActivity(
            'Admin',
            'Delete Customer',
            `Deleted customer ID: ${id}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting customer:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to delete customer', details: errorMessage }, { status: 500 });
    }
}
