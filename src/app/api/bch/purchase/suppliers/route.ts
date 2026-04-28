import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT,
                email TEXT,
                address TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const suppliers = await sql`SELECT id as "supplierId", name, contact_person as "contactPerson", phone, email, address FROM suppliers ORDER BY name ASC` as unknown as any[];
        return NextResponse.json(suppliers);
    } catch (error: unknown) {
        console.error('Error fetching suppliers:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { name, contactPerson, phone, email, address } = body;

        const result = await sql`
            INSERT INTO suppliers (name, contact_person, phone, email, address)
            VALUES (${name}, ${contactPerson || null}, ${phone || null}, ${email || null}, ${address || null})
            RETURNING id as "supplierId", name
        ` as unknown as any[];

        return NextResponse.json(result[0], { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating supplier:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
