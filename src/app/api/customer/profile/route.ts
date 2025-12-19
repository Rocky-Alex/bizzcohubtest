import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Ensure columns exist (Migration for GET to prevent crash on new fields)
        await sql`
            DO $$ 
            BEGIN 
                -- Image
                BEGIN ALTER TABLE customers ADD COLUMN image_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                
                -- Billing
                BEGIN ALTER TABLE customers ADD COLUMN billing_name VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_address_1 TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_country VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_state VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_city VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_zip VARCHAR(20); EXCEPTION WHEN duplicate_column THEN NULL; END;

                -- Shipping
                BEGIN ALTER TABLE customers ADD COLUMN shipping_name VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_address_1 TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_country VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_state VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_city VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_zip VARCHAR(20); EXCEPTION WHEN duplicate_column THEN NULL; END;
                
                -- Preferences
                BEGIN ALTER TABLE customers ADD COLUMN currency VARCHAR(10); EXCEPTION WHEN duplicate_column THEN NULL; END;
            END $$;
        `;

        const customers = await sql`
            SELECT 
                id, 
                name, 
                username, 
                email, 
                phone, 
                image_url,
                currency,
                billing_name,
                billing_address_1,
                billing_country,
                billing_state,
                billing_city,
                billing_zip,
                shipping_name,
                shipping_address_1,
                shipping_country,
                shipping_state,
                shipping_city,
                shipping_zip
            FROM customers 
            WHERE id = ${id}
        `;

        if (customers.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: customers[0] });
    } catch (error: any) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            id,
            name,
            email,
            phone,
            image_url,
            currency,
            billing_name,
            billing_address_1,
            billing_city,
            billing_state,
            billing_country,
            billing_zip,
            shipping_name,
            shipping_address_1,
            shipping_city,
            shipping_state,
            shipping_country,
            shipping_zip
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Ensure columns exist
        await sql`
            DO $$ 
            BEGIN 
                -- Image
                BEGIN ALTER TABLE customers ADD COLUMN image_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                
                -- Billing
                BEGIN ALTER TABLE customers ADD COLUMN billing_name VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_address_1 TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_country VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_state VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_city VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN billing_zip VARCHAR(20); EXCEPTION WHEN duplicate_column THEN NULL; END;

                -- Shipping
                BEGIN ALTER TABLE customers ADD COLUMN shipping_name VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_address_1 TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_country VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_state VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_city VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                BEGIN ALTER TABLE customers ADD COLUMN shipping_zip VARCHAR(20); EXCEPTION WHEN duplicate_column THEN NULL; END;

                -- Preferences
                BEGIN ALTER TABLE customers ADD COLUMN currency VARCHAR(10); EXCEPTION WHEN duplicate_column THEN NULL; END;
            END $$;
        `;

        // Check for duplicate email
        if (email) {
            const existing = await sql`
                SELECT id FROM customers WHERE email = ${email} AND id != ${id}
            `;
            if (existing.length > 0) {
                return NextResponse.json({ error: 'Email already in use by another account' }, { status: 409 });
            }
        }

        // Update customer
        const updated = await sql`
            UPDATE customers 
            SET 
                name = ${name},
                email = ${email},
                phone = ${phone},
                image_url = ${image_url},
                currency = ${currency},
                billing_name = ${billing_name},
                billing_address_1 = ${billing_address_1},
                billing_country = ${billing_country},
                billing_state = ${billing_state},
                billing_city = ${billing_city},
                billing_zip = ${billing_zip},
                shipping_name = ${shipping_name},
                shipping_address_1 = ${shipping_address_1},
                shipping_country = ${shipping_country},
                shipping_state = ${shipping_state},
                shipping_city = ${shipping_city},
                shipping_zip = ${shipping_zip}
            WHERE id = ${id}
            RETURNING *
        `;

        if (updated.length === 0) {
            return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: updated[0]
        });

    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
