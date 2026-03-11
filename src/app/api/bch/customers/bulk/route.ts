import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { customers, overwrite } = body;

        if (!customers || !Array.isArray(customers) || customers.length === 0) {
            return NextResponse.json({ error: 'No customers provided' }, { status: 400 });
        }

        // Basic validation for required fields
        const invalidCustomers = customers.filter((c: any) => !c.name);
        if (invalidCustomers.length > 0) {
            return NextResponse.json({ error: 'Some customers are missing the required "name" field.' }, { status: 400 });
        }

        // 1. Identify potential duplicates
        const emails = customers.map((c: any) => c.email).filter(Boolean);
        const names = customers.map((c: any) => c.name).filter(Boolean);

        let existingRecords: any[] = [];
        if (emails.length > 0 || names.length > 0) {
            // Fetch potential matches
            const existing = await sql`
                SELECT id, name, email FROM customers 
                WHERE (email IS NOT NULL AND email = ANY(${emails}::text[]))
                   OR (name = ANY(${names}::text[]))
            ` as unknown as any[];
            existingRecords = existing;
        }

        const duplicates = existingRecords.map((r: any) => ({
            id: r.id,
            name: r.name,
            email: r.email
        }));

        // 2. Handle Conflict
        if (duplicates.length > 0 && !overwrite) {
            return NextResponse.json({
                error: 'Duplicate customers found',
                code: 'DUPLICATES_FOUND',
                duplicates: duplicates,
                message: `Found ${duplicates.length} duplicate customers. Do you want to update them?`
            }, { status: 409 });
        }

        // 3. Process Import (Insert or Update)
        const toInsert: any[] = [];
        const toUpdate: any[] = [];

        customers.forEach((customer: any) => {
            const match = existingRecords.find((r: any) =>
                (customer.email && r.email === customer.email) ||
                (r.name === customer.name)
            );

            if (match && overwrite) {
                // If overwrite is enabled and we found a match, prepare for update
                toUpdate.push({ ...customer, id: match.id });
            } else if (!match) {
                // If no match found, prepare for insert
                toInsert.push(customer);
            }
        });

        // 4. Batch Insert - Simplified for compatibility
        if (toInsert.length > 0) {
            for (const customer of toInsert) {
                await sql`
                    INSERT INTO customers (
                        name, email, phone, currency,
                        billing_name, billing_address_1, billing_country, billing_state, billing_city, billing_zip,
                        shipping_name, shipping_address_1, shipping_country, shipping_state, shipping_city, shipping_zip,
                        status, image_url,
                        username, password_hash, created_at, deactivated_at, avatar
                    ) VALUES (
                        ${customer.name},
                        ${customer.email || null},
                        ${customer.phone || null},
                        ${customer.currency || 'USD'},
                        ${customer.billingName || customer.name},
                        ${customer.billingAddress1 || null},
                        ${customer.billingCountry || null},
                        ${customer.billingState || null},
                        ${customer.billingCity || null},
                        ${customer.billingZip || null},
                        ${customer.shippingName || customer.name},
                        ${customer.shippingAddress1 || null},
                        ${customer.shippingCountry || null},
                        ${customer.shippingState || null},
                        ${customer.shippingCity || null},
                        ${customer.shippingZip || null},
                        ${customer.status || 'Active'},
                        ${customer.image_url || null},
                        ${customer.username || null},
                        ${customer.password_hash || null},
                        ${customer.created_at || new Date().toISOString()},
                        ${customer.deactivated_at || null},
                        ${customer.avatar || null}
                    )
                `;
            }
        }

        // 5. Update Loop
        if (toUpdate.length > 0) {
            for (const customer of toUpdate) {
                await sql`
                    UPDATE customers SET
                        name = ${customer.name},
                        email = ${customer.email || null},
                        phone = ${customer.phone || null},
                        currency = ${customer.currency || 'USD'},
                        billing_name = ${customer.billingName || customer.name},
                        billing_address_1 = ${customer.billingAddress1 || null},
                        billing_country = ${customer.billingCountry || null},
                        billing_state = ${customer.billingState || null},
                        billing_city = ${customer.billingCity || null},
                        billing_zip = ${customer.billingZip || null},
                        shipping_name = ${customer.shippingName || customer.name},
                        shipping_address_1 = ${customer.shippingAddress1 || null},
                        shipping_country = ${customer.shippingCountry || null},
                        shipping_state = ${customer.shippingState || null},
                        shipping_city = ${customer.shippingCity || null},
                        shipping_zip = ${customer.shippingZip || null},
                        image_url = ${customer.image_url || null},
                        status = ${customer.status || 'Active'},
                        username = ${customer.username || null},
                        password_hash = ${customer.password_hash || null},
                        avatar = ${customer.avatar || null}
                        ${customer.created_at ? sql`, created_at = ${customer.created_at.toString()}` : sql``}
                        ${customer.deactivated_at ? sql`, deactivated_at = ${customer.deactivated_at.toString()}` : sql``}
                    WHERE id = ${customer.id}
                `;
            }
        }

        await logActivity(
            'Admin',
            'Bulk Import Customers',
            `Imported ${toInsert.length} customers, Updated ${toUpdate.length} customers`,
            'success',
            'Admin'
        );

        return NextResponse.json({
            message: `Successfully processed import`,
            inserted: toInsert.length,
            updated: toUpdate.length
        });

    } catch (error: unknown) {
        console.error('Error importing customers:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to import customers', details: errorMessage }, { status: 500 });
    }
}
