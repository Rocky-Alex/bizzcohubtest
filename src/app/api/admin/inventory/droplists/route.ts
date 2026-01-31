import { NextResponse } from 'next/server';
import { sql, unsafe } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        if (category === 'Laptop') {
            // Special case for Laptop Models: returns { brand, series, model }
            const query = await sql`
                SELECT DISTINCT brand, series, model 
                FROM products 
                WHERE (type = 'laptop' OR type = 'system' OR type IS NULL) 
                  AND brand IS NOT NULL AND model IS NOT NULL
                ORDER BY brand, model
            `;
            return NextResponse.json({ success: true, data: query });
        }

        let field = '';
        let table = 'products'; // Default source

        switch (category) {
            case 'RAM': field = 'ram'; break;
            case 'Storage': field = 'storage'; break;
            case 'Graphics': field = 'graphics_card'; break;
            case 'Processor': field = 'processor'; break;
            case 'Gen': field = 'processor_gen'; break;
            case 'Screen Size': field = 'screen_size'; break;
            case 'Resolution': field = 'screen_resolution'; break;
            case 'Condition': field = 'condition_status'; break;
            // Examples where we might not have a column yet, but let's map best effort:
            case 'Keyboard Type': field = 'keyboard_type'; table = 'inventory_qc'; break;
            case 'Keyboard Backlit': field = 'keyboard_backlit'; table = 'inventory_qc'; break;
            default: field = '';
        }

        if (!field) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Fetch distinct values
        // If table is inventory_qc, check if it exists (it should now)
        let query;
        if (table === 'inventory_qc') {
            const q = `
                SELECT DISTINCT ${field} as value 
                FROM inventory_qc 
                WHERE ${field} IS NOT NULL 
                ORDER BY ${field}
            `;
            query = await unsafe(q);
        } else {
            const q = `
                SELECT DISTINCT ${field} as value 
                FROM products 
                WHERE ${field} IS NOT NULL AND ${field} != ''
                ORDER BY ${field}
            `;
            query = await unsafe(q);
        }

        return NextResponse.json({
            success: true,
            data: query.map(row => ({ value: row.value }))
        });

    } catch (error: any) {
        console.error('Droplist error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
