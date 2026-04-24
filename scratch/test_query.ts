import 'dotenv/config';
import { sql } from '../src/lib/db';

async function test() {
    const query = 'Lenovo Thinkpad T14';
    const t = `%${query}%`;
    
    console.log('--- Testing Master Inventory ---');
    try {
        const res = await sql`
            SELECT id, product_name, sku, brand, model, series
            FROM master_inventory 
            WHERE CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t}
            LIMIT 1
        `;
        console.log('Success');
    } catch (e: any) {
        console.error('Failed:', e.message);
    }

    console.log('--- Testing Products ---');
    try {
        const res = await sql`
            SELECT id, product_name, product_code, brand, model, series
            FROM products 
            WHERE CONCAT_WS(' ', brand, product_name, product_code, series) ILIKE ${t}
            LIMIT 1
        `;
        console.log('Success');
    } catch (e: any) {
        console.error('Failed:', e.message);
    }

    console.log('--- Testing Purchase Lots ---');
    try {
        const res = await sql`
            SELECT id, supplier_name, lot_number
            FROM purchase_lots 
            WHERE CONCAT_WS(' ', lot_number, supplier_name) ILIKE ${t}
            LIMIT 1
        `;
        console.log('Success');
    } catch (e: any) {
        console.error('Failed:', e.message);
    }

    console.log('--- Testing Purchase Lot Items ---');
    try {
        const res = await sql`
            SELECT id, product_name, sku, brand, model, series
            FROM purchase_lot_items 
            WHERE CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t}
            LIMIT 1
        `;
        console.log('Success');
    } catch (e: any) {
        console.error('Failed:', e.message);
    }
}

test();
