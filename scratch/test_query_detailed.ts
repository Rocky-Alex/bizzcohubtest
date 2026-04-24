import 'dotenv/config';
import { sql } from '../src/lib/db';

async function check() {
    try {
        const query = 'Lenovo Thinkpad T14';
        const searchTerms = query.trim().split(/\s+/).filter(Boolean).slice(0, 4);
        const t0 = searchTerms[0] ? `%${searchTerms[0]}%` : '%';
        const t1 = searchTerms[1] ? `%${searchTerms[1]}%` : '%';
        const t2 = searchTerms[2] ? `%${searchTerms[2]}%` : '%';
        const t3 = searchTerms[3] ? `%${searchTerms[3]}%` : '%';

        console.log('Terms:', { t0, t1, t2, t3 });

        // 1. Test Master Inventory
        console.log('Testing Master Inventory...');
        await sql`
            SELECT id FROM master_inventory 
            WHERE 
                CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t0} AND
                CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t1} AND
                CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t2} AND
                CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t3}
            LIMIT 1
        `;

        // 2. Test Purchase Lot Items
        console.log('Testing Purchase Lot Items...');
        await sql`
            SELECT id FROM purchase_lot_items 
            WHERE 
               CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t0} AND
               CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t1} AND
               CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t2} AND
               CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t3} AND
               quantity > 0
            LIMIT 1
        `;

        console.log('All tests passed!');
    } catch (e: any) {
        console.error('Error Message:', e.message);
        console.error('Error Code:', e.code);
        console.error('Error Stack:', e.stack);
    }
}

check();
