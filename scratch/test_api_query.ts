import 'dotenv/config';
import { sql } from '../src/lib/db';

async function main() {
    const invoiceNo = 'QTN2602';
    try {
        const salesOut = await sql`
            SELECT 
                so.*, 
                COALESCE(so.customer_name, i.customer_name, q.customer_name) as display_customer_name,
                COALESCE(so.unit_price, ii.unit_price, qi.unit_price) as price,
                -- Fallback specs from master/purchase if not in sale_out
                COALESCE(so.ram, mi.ram, pli.ram) as ram,
                COALESCE(so.storage, mi.storage, pli.storage) as storage,
                COALESCE(so.graphics, mi.graphics_card, pli.graphics) as graphics,
                COALESCE(so.processor_gen, mi.processor_gen, pli.processor_gen) as generation
            FROM sale_out so
            LEFT JOIN invoices i ON so.invoice_no = i.invoice_no
            LEFT JOIN quotations q ON so.invoice_no = q.quotation_no
            LEFT JOIN invoice_items ii ON (so.invoice_no = i.invoice_no AND (so.inventory_id = ii.inventory_id OR so.barcode = ii.product_code))
            LEFT JOIN quotation_items qi ON (so.invoice_no = q.quotation_no AND (so.inventory_id = qi.inventory_id OR so.barcode = qi.product_code))
            LEFT JOIN master_inventory mi ON so.inventory_id = mi.id AND (so.source = 'master' OR so.source = 'QC Passed')
            LEFT JOIN purchase_lot_items pli ON so.inventory_id = pli.id AND (so.source = 'purchase' OR so.source = 'Purchase')
            WHERE so.invoice_no = ${invoiceNo} 
            ORDER BY so.sold_at DESC
        `;
        console.log('Results for QTN2602:', JSON.stringify(salesOut, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
