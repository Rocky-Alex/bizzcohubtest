import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

const SECTIONS = {
    "User & Security Management": ["users", "roles", "password_resets", "admin_emails"],
    "Product & Pricing Management": ["products", "products_price", "featured_products_config", "wishlist"],
    "Inventory & Logistics": ["master_inventory", "purchase_lots", "purchase_lot_items", "lots", "packed_items", "packing_boxes", "label_settings", "sale_out", "sales_returns"],
    "Sales & Quotations": ["orders", "invoices", "invoice_items", "invoice_payments", "quotations", "quotation_items", "quotation_payments", "receipt_list"],
    "Accounting & Finance": ["cash_book", "chart_of_accounts", "accounting_transactions", "accountant_sessions", "authorized_accountants"],
    "Contacts Management": ["customers", "suppliers"],
    "System Configuration": ["settings", "drop_lists", "activity_logs", "playing_with_neon"]
};

export async function GET(request: NextRequest) {
    try {
        const wb = XLSX.utils.book_new();

        for (const [sectionName, tables] of Object.entries(SECTIONS)) {
            let sectionData: any[] = [];

            for (const table of tables) {
                try {
                    const rows = await sql(`SELECT * FROM ${table}`) as any[];
                    if (rows && rows.length > 0) {
                        // Add a header for each table within the section sheet
                        sectionData.push({ "SYSTEM_INFO": `--- TABLE: ${table.toUpperCase()} ---` });
                        sectionData.push(...rows);
                        sectionData.push({}); // Empty row separator
                    }
                } catch (e) {
                    console.error(`Error fetching table ${table}:`, e);
                }
            }

            if (sectionData.length > 0) {
                const ws = XLSX.utils.json_to_sheet(sectionData);
                XLSX.utils.book_append_sheet(wb, ws, sectionName.substring(0, 31)); // Sheet name limit 31 chars
            }
        }

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="BizzCoHub_Database_Full_Export.xlsx"',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error: any) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
