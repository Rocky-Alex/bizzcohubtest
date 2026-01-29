
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers } from '@/db/schema';
import { desc, ilike, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        const search = req.nextUrl.searchParams.get('q') || '';

        let whereClause = undefined;
        if (search) {
            whereClause = or(
                ilike(suppliers.name, `%${search}%`),
                ilike(suppliers.contactPerson, `%${search}%`)
            );
        }

        const data = await db.select().from(suppliers)
            .where(whereClause)
            .orderBy(desc(suppliers.createdAt))
            .limit(20);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching suppliers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, contactPerson, phone, email, address } = body;

        if (!name) {
            return NextResponse.json({ error: 'Supplier Name is required' }, { status: 400 });
        }

        const newSupplier = await db.insert(suppliers).values({
            name,
            contactPerson,
            phone,
            email,
            address
        }).returning();

        return NextResponse.json(newSupplier[0]);
    } catch (error: any) {
        console.error('Error creating supplier:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
