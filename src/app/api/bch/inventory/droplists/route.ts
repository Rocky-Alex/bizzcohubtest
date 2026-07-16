import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

// Helper to run auto-migrations to ensure drop_lists table exists
async function ensureSchema() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS drop_lists (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100) NOT NULL,
                value VARCHAR(255) NOT NULL,
                parent VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
    } catch (e) {
        console.error('Schema update warning for drop_lists:', e);
    }
}

function mapCategory(cat: string | null): string | null {
    if (!cat) return null;
    const clean = cat.trim();
    if (clean === 'Processor') return 'Core';
    if (clean === 'Generation') return 'Gen';
    if (clean === 'Storage') return 'SSD';
    if (clean === 'Screen Size' || clean === 'screen size') return 'ScreenSize';
    if (clean === 'Screen Resolution' || clean === 'screen resolution') return 'ScreenResolution';
    if (clean === 'Graphics Model' || clean === 'graphics model') return 'GraphicsModel';
    if (clean === 'Graphics Size' || clean === 'graphics size') return 'GraphicsSize';
    if (clean === 'Graphics' || clean === 'graphics') return 'GraphicsModel';
    return clean;
}

function unmapCategory(cat: string | null): string | null {
    if (!cat) return null;
    if (cat === 'Core') return 'Processor';
    if (cat === 'Gen') return 'Generation';
    if (cat === 'SSD') return 'Storage';
    if (cat === 'ScreenSize') return 'Screen Size';
    if (cat === 'ScreenResolution') return 'Screen Resolution';
    if (cat === 'GraphicsModel') return 'Graphics Model';
    if (cat === 'GraphicsSize') return 'Graphics Size';
    return cat;
}

export async function GET(req: Request): Promise<NextResponse> {
    try {
        await ensureSchema();
        const { searchParams } = new URL(req.url);
        const category = mapCategory(searchParams.get('category'));
        const parent = searchParams.get('parent');

        let data: any[];
        if (category && parent) {
            data = await sql`
                SELECT * FROM drop_lists 
                WHERE category = ${category} AND parent = ${parent}
                ORDER BY value ASC
            ` as unknown as any[];
        } else if (category) {
            data = await sql`
                SELECT * FROM drop_lists 
                WHERE category = ${category}
                ORDER BY value ASC
            ` as unknown as any[];
        } else {
            // Return all items if no query is passed
            data = await sql`
                SELECT * FROM drop_lists 
                ORDER BY category ASC, value ASC
            ` as unknown as any[];
        }

        const mappedData = data.map((item: any) => ({
            ...item,
            category: unmapCategory(item.category)
        }));

        return NextResponse.json({
            success: true,
            data: mappedData
        });

    } catch (error: unknown) {
        console.error('Error fetching drop list:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        await ensureSchema();
        const body = await req.json();
        const { category, value, parent, createdBy } = body;

        if (!category || !value) {
            return NextResponse.json({ success: false, error: 'Category and value are required' }, { status: 400 });
        }

        const mappedCategory = mapCategory(category) as string;

        // Check if item already exists under the category (and parent if applicable)
        let existing;
        if (parent) {
            existing = await sql`
                SELECT id FROM drop_lists
                WHERE category = ${mappedCategory} AND value = ${value} AND parent = ${parent}
            ` as unknown as any[];
        } else {
            existing = await sql`
                SELECT id FROM drop_lists
                WHERE category = ${mappedCategory} AND value = ${value} AND (parent IS NULL OR parent = '')
            ` as unknown as any[];
        }

        if (existing.length > 0) {
            return NextResponse.json({ success: false, error: 'This value already exists in this category' }, { status: 400 });
        }

        const insertResult = await sql`
            INSERT INTO drop_lists (category, value, parent, created_at)
            VALUES (${mappedCategory}, ${value}, ${parent || null}, NOW())
            RETURNING id
        ` as unknown as { id: number }[];

        await logActivity(
            createdBy || 'Admin',
            'Add Dropdown Option',
            `Added dropdown option "${value}" to category "${mappedCategory}"${parent ? ` under parent "${parent}"` : ''}`,
            'success',
            'Admin'
        );

        return NextResponse.json({
            success: true,
            message: 'Dropdown option added successfully',
            data: { id: insertResult[0].id }
        });

    } catch (error: unknown) {
        console.error('Error adding dropdown option:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}

export async function PUT(req: Request): Promise<NextResponse> {
    try {
        await ensureSchema();
        const body = await req.json();
        const { id, value, parent, updatedBy } = body;

        if (!id || !value) {
            return NextResponse.json({ success: false, error: 'ID and value are required' }, { status: 400 });
        }

        // Fetch old value before update for logging
        const oldResult = await sql`
            SELECT category, value FROM drop_lists WHERE id = ${id}
        ` as unknown as any[];

        if (oldResult.length === 0) {
            return NextResponse.json({ success: false, error: 'Dropdown option not found' }, { status: 404 });
        }

        const { category, value: oldValue } = oldResult[0];

        await sql`
            UPDATE drop_lists
            SET value = ${value}, parent = ${parent || null}
            WHERE id = ${id}
        `;

        await logActivity(
            updatedBy || 'Admin',
            'Update Dropdown Option',
            `Updated dropdown option in category "${category}" from "${oldValue}" to "${value}"`,
            'success',
            'Admin'
        );

        return NextResponse.json({
            success: true,
            message: 'Dropdown option updated successfully'
        });

    } catch (error: unknown) {
        console.error('Error updating dropdown option:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}

export async function DELETE(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const deletedBy = searchParams.get('deletedBy') || 'Admin';

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        // Fetch details before delete
        const oldResult = await sql`
            SELECT category, value FROM drop_lists WHERE id = ${id}
        ` as unknown as any[];

        if (oldResult.length === 0) {
            return NextResponse.json({ success: false, error: 'Dropdown option not found' }, { status: 404 });
        }

        const { category, value } = oldResult[0];

        await sql`
            DELETE FROM drop_lists WHERE id = ${id}
        `;

        await logActivity(
            deletedBy,
            'Delete Dropdown Option',
            `Deleted dropdown option "${value}" from category "${category}"`,
            'success',
            'Admin'
        );

        return NextResponse.json({
            success: true,
            message: 'Dropdown option deleted successfully'
        });

    } catch (error: unknown) {
        console.error('Error deleting dropdown option:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}
