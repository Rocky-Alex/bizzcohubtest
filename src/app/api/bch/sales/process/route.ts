import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const grouped = searchParams.get('grouped') === 'true';
        const invoiceNo = searchParams.get('invoiceNo');

        // Migration: Ensure sale_out columns exist
        try {
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Sold Out'`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS ram TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS storage TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS graphics TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS inventory_id INTEGER`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS customer_name TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS unit_price NUMERIC`;
        } catch (e) {
            console.log('Migration note (sale_out):', e);
        }

        let salesOut;
        if (grouped) {
            salesOut = await sql`
                SELECT 
                    so.invoice_no, 
                    MAX(so.sold_at) as sold_at, 
                    COALESCE(MAX(so.customer_name), MAX(i.customer_name), MAX(q.customer_name)) as customer_name, 
                    COALESCE(MAX(i.total_amount), MAX(q.total_amount)) as total_amount, 
                    SUM(so.quantity) as product_quantity,
                    MAX(so.status) as status
                FROM sale_out so
                LEFT JOIN invoices i ON so.invoice_no = i.invoice_no
                LEFT JOIN quotations q ON so.invoice_no = q.quotation_no
                GROUP BY so.invoice_no
                ORDER BY sold_at DESC
            ` as unknown as any[];
        } else if (invoiceNo) {
            salesOut = await sql`
                SELECT 
                    so.*, 
                    COALESCE(so.customer_name, i.customer_name, q.customer_name) as display_customer_name,
                    -- Use COALESCE for unit_price if it exists, otherwise fallback to item tables
                    ii.unit_price as price_from_ii,
                    qi.unit_price as price_from_qi,
                    -- Fallback specs from items, master, or purchase if not in sale_out
                    COALESCE(so.ram, ii.ram, qi.ram, mi.ram, pli.ram) as ram,
                    COALESCE(so.storage, ii.storage, qi.storage, mi.storage, pli.storage) as storage,
                    COALESCE(so.graphics, ii.graphics, qi.graphics, mi.graphics_card, pli.graphics) as graphics,
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
            ` as unknown as any[];

            // Add price mapping in JS to handle dynamic columns
            salesOut = salesOut.map((item: any) => ({
                ...item,
                price: item.unit_price || item.price_from_ii || item.price_from_qi || 0
            }));
        } else {
            salesOut = await sql`
                SELECT 
                    so.*, 
                    COALESCE(so.customer_name, i.customer_name, q.customer_name) as display_customer_name,
                    COALESCE(so.ram, mi.ram, pli.ram) as ram,
                    COALESCE(so.storage, mi.storage, pli.storage) as storage,
                    COALESCE(so.graphics, mi.graphics_card, pli.graphics) as graphics,
                    COALESCE(so.processor_gen, mi.processor_gen, pli.processor_gen) as generation
                FROM sale_out so
                LEFT JOIN invoices i ON so.invoice_no = i.invoice_no
                LEFT JOIN quotations q ON so.invoice_no = q.quotation_no
                LEFT JOIN master_inventory mi ON so.inventory_id = mi.id AND (so.source = 'master' OR so.source = 'QC Passed')
                LEFT JOIN purchase_lot_items pli ON so.inventory_id = pli.id AND (so.source = 'purchase' OR so.source = 'Purchase')
                ORDER BY so.sold_at DESC
            ` as unknown as any[];
        }

        return NextResponse.json({ success: true, salesOut });
    } catch (error: any) {
        console.error('Error fetching sales out:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { invoiceId, invoiceNo, docType, barcode, inventoryId, source: inputSource, quantity: inputQty, user, ram, storage, graphics, unit_price, customerName } = body;
        const quantity = inputQty ? parseInt(inputQty) : 1;

        if (!invoiceNo || (!barcode && !inventoryId)) {
            return NextResponse.json({ success: false, error: 'Invoice Number and either Barcode or Inventory ID are required' }, { status: 400 });
        }

        // 0. Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS sale_out (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER,
                invoice_no TEXT,
                barcode TEXT,
                product_name TEXT,
                sold_by TEXT,
                sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'Sold Out'
            )
        `;

        // Ensure columns exist (Migration for existing tables)
        try {
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS inventory_id INTEGER`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS invoice_id INTEGER`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Sold Out'`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS customer_name TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS unit_price NUMERIC`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS ram TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS storage TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS graphics TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS doc_type TEXT`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
            // Backfill existing rows if status is null
            await sql`UPDATE sale_out SET status = 'Sold Out' WHERE status IS NULL`;
        } catch (e) {
            console.log('Migration note:', e);
        }

        // 1. Verify product exists in master_inventory or purchase_lot_items
        let product = null;
        let source = inputSource || 'master';

        if (inventoryId) {
            // Priority: Use the specific ID passed from the invoice
            if (source === 'master' || source === 'QC Passed') {
                const masterResult = await sql`SELECT id, product_name, quantity, barcode, brand, model, series, processor, ram, storage, processor_gen, graphics_card as graphics FROM master_inventory WHERE id = ${inventoryId}` as unknown as any[];
                if (masterResult.length > 0) { product = masterResult[0]; }
            } else if (source === 'purchase' || source === 'Purchase') {
                const purchaseResult = await sql`SELECT id, sku as barcode, product_name, quantity, brand, model, series, processor, ram, storage, processor_gen, graphics FROM purchase_lot_items WHERE id = ${inventoryId}` as unknown as any[];
                if (purchaseResult.length > 0) { product = purchaseResult[0]; }
            }
        }

        if (!product && barcode) {
            // Fallback: Search by barcode if ID lookup failed or wasn't provided
            const masterResult = await sql`
                SELECT id, product_name, quantity, barcode, brand, model, series, processor, ram, storage, processor_gen, graphics_card as graphics FROM master_inventory 
                WHERE (barcode = ${barcode} OR sku = ${barcode})
            ` as unknown as any[];

            if (masterResult.length > 0) {
                product = masterResult[0];
                source = 'master';
            } else {
                const purchaseResult = await sql`
                    SELECT id, sku as barcode, product_name, quantity, brand, model, series, processor, ram, storage, processor_gen, graphics FROM purchase_lot_items 
                    WHERE sku = ${barcode}
                ` as unknown as any[];
                if (purchaseResult.length > 0) {
                    product = purchaseResult[0];
                    source = 'purchase';
                }
            }
        }

        if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found in inventory.' }, { status: 404 });
        }

        // Check if already confirmed to prevent double deduction
        // We check if THIS specific inventory item has been sold on THIS invoice
        const alreadyConfirmed = await sql`
            SELECT id FROM sale_out 
            WHERE invoice_no = ${invoiceNo} 
              AND inventory_id = ${product.id}
              AND source = ${source}
        ` as unknown as any[];
        
        if (alreadyConfirmed.length > 0) {
            return NextResponse.json({ success: false, error: 'Product already confirmed/sold out for this invoice.' }, { status: 400 });
        }

        // 2. Insert into sale_out
        // We populate both the new generic columns and the old specific ones for compatibility
        await sql`
            INSERT INTO sale_out (
                invoice_id, invoice_no, inventory_id, source, 
                barcode, product_name, sold_by, status, quantity,
                master_inventory_id, purchase_lot_item_id,
                brand, model, series, processor, ram, storage,
                processor_gen, graphics, unit_price, customer_name
            )
            VALUES (
                ${invoiceId || 0}, ${invoiceNo}, ${product.id}, ${source}, 
                ${barcode || product.barcode || ''}, ${product.product_name}, ${user || 'Admin'}, 'Sold Out', ${quantity},
                ${source === 'master' ? product.id : null}, 
                ${source === 'purchase' ? product.id : null},
                ${product.brand || null}, ${product.model || null}, ${product.series || null},
                ${product.processor || null}, ${ram || product.ram || null}, ${storage || product.storage || null},
                ${product.processor_gen || null}, ${graphics || product.graphics || null}, ${unit_price || null}, ${customerName || null}
            )
        `;

        // 3. Physical deduction is now handled via the sale_out balance calculation
        // We no longer update the quantity column in the source tables to preserve original data
        // and avoid double-deduction issues.
        
        await logActivity(
            user || 'Admin',
            'Sales Out',
            `Product ${barcode || 'ID:' + product.id} (Qty: ${quantity}) processed against Invoice ${invoiceNo}`,
            'success',
            user || 'Admin'
        );

        return NextResponse.json({ success: true, message: 'Product sale processed successfully.' });

    } catch (error: any) {
        console.error('Error processing sales out:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
