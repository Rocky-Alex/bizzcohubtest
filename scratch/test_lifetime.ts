import 'dotenv/config';
import { sql } from '../src/lib/db';

async function test() {
    const lifetime = true;
    let from: string;
    let to: string;
    let startDate: Date;
    let endDate: Date;

    if (lifetime) {
        startDate = new Date('2020-01-01T00:00:00.000Z');
        endDate = new Date();
        from = startDate.toISOString();
        to = endDate.toISOString();
    } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        from = startDate.toISOString();
        to = endDate.toISOString();
    }

    const duration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - duration);
    const prevEndDate = new Date(endDate.getTime() - duration);
    const prevFrom = prevStartDate.toISOString();
    const prevTo = prevEndDate.toISOString();

    try {
        console.log("Parameters:", { from, to, prevFrom, prevTo });
        const results = await Promise.all([
            sql`
                WITH periods AS (
                    SELECT 
                        COUNT(*) FILTER (WHERE created_date >= ${from} AND created_date <= ${to}) as curr_count,
                        COALESCE(SUM(total_amount) FILTER (WHERE created_date >= ${from} AND created_date <= ${to}), 0) as curr_total,
                        COALESCE(SUM(advance_received) FILTER (WHERE created_date >= ${from} AND created_date <= ${to}), 0) as curr_received,
                        COUNT(*) FILTER (WHERE created_date >= ${prevFrom} AND created_date <= ${prevTo}) as prev_count,
                        COALESCE(SUM(total_amount) FILTER (WHERE created_date >= ${prevFrom} AND created_date <= ${prevTo}), 0) as prev_total
                    FROM invoices 
                    WHERE UPPER(TRIM(status)) != 'CANCELLED'
                )
                SELECT * FROM periods
            `,
            sql`
                SELECT
                    (SELECT COUNT(*) FROM customers WHERE created_at >= ${from} AND created_at <= ${to}) as curr_cust,
                    (SELECT COUNT(*) FROM customers WHERE created_at >= ${prevFrom} AND created_at <= ${prevTo}) as prev_cust,
                    (SELECT COUNT(*) FROM products) as prod_count,
                    (SELECT COALESCE(SUM(total_cost), 0) FROM purchase_lots WHERE created_at >= ${from} AND created_at <= ${to}) as pur_total,
                    (SELECT COALESCE(SUM(quantity), 0) FROM purchase_lot_items WHERE created_at >= ${from} AND created_at <= ${to}) as pur_qty,
                    (SELECT COALESCE(SUM(quantity), 0) FROM master_inventory WHERE created_at >= ${from} AND created_at <= ${to}) as qc_qty,
                    (SELECT COALESCE(SUM(qty_sold), 0) FROM sale_out WHERE sold_at >= ${from} AND sold_at <= ${to}) as sold_qty
            `,
            sql`
                WITH inv_stats AS (
                    SELECT 
                        COALESCE(SUM(GREATEST(i.total_amount - COALESCE(p.paid_amount, 0), 0)), 0) as pending,
                        COALESCE(SUM(CASE 
                            WHEN (i.total_amount - COALESCE(p.paid_amount, 0)) > 0 AND (
                                (i.due_date IS NOT NULL AND i.due_date < (CURRENT_DATE - INTERVAL '7 days')) OR 
                                (i.due_date IS NULL AND i.created_date < (CURRENT_DATE - INTERVAL '7 days'))
                            ) THEN (i.total_amount - COALESCE(p.paid_amount, 0)) 
                            ELSE 0 
                        END), 0) as overdue
                    FROM invoices i
                    LEFT JOIN (
                        SELECT invoice_id, COALESCE(SUM(amount), 0) as paid_amount
                        FROM invoice_payments
                        GROUP BY invoice_id
                    ) p ON i.id = p.invoice_id
                    WHERE i.created_date >= ${from} AND i.created_date <= ${to} AND UPPER(TRIM(i.status)) NOT IN ('CANCELLED', 'PAID')
                ),
                payments AS (
                    SELECT COALESCE(SUM(amount), 0) as total_paid 
                    FROM invoice_payments ip 
                    JOIN invoices i ON ip.invoice_id = i.id 
                    WHERE i.created_date >= ${from} AND i.created_date <= ${to} AND UPPER(TRIM(i.status)) != 'CANCELLED'
                ),
                receipts AS (
                    SELECT COUNT(*) as count FROM receipt_list WHERE payment_date >= ${from} AND payment_date <= ${to}
                )
                SELECT * FROM inv_stats, payments, receipts
            `,
            sql`
                WITH q_stats AS (
                    SELECT 
                        COUNT(*) FILTER (WHERE created_date >= ${from} AND created_date <= ${to}) as curr_count,
                        COALESCE(SUM(total_amount) FILTER (WHERE created_date >= ${from} AND created_date <= ${to}), 0) as curr_total,
                        COALESCE(SUM(advance_received) FILTER (WHERE created_date >= ${from} AND created_date <= ${to}), 0) as curr_received,
                        COUNT(*) FILTER (WHERE created_date >= ${prevFrom} AND created_date <= ${prevTo}) as prev_count,
                        COALESCE(SUM(total_amount) FILTER (WHERE created_date >= ${prevFrom} AND created_date <= ${prevTo}), 0) as prev_total
                    FROM quotations 
                    WHERE UPPER(TRIM(status)) != 'CANCELLED'
                ),
                q_pending AS (
                    SELECT 
                        COALESCE(SUM(GREATEST(q.total_amount - COALESCE(p.paid_amount, 0), 0)), 0) as pending,
                        COALESCE(SUM(CASE 
                            WHEN (q.total_amount - COALESCE(p.paid_amount, 0)) > 0 AND (
                                (q.due_date IS NOT NULL AND q.due_date < (CURRENT_DATE - INTERVAL '7 days')) OR 
                                (q.due_date IS NULL AND q.created_date < (CURRENT_DATE - INTERVAL '7 days'))
                            ) THEN (q.total_amount - COALESCE(p.paid_amount, 0)) 
                            ELSE 0 
                        END), 0) as overdue
                    FROM quotations q
                    LEFT JOIN (
                        SELECT quotation_id, COALESCE(SUM(amount), 0) as paid_amount
                        FROM quotation_payments
                        GROUP BY quotation_id
                    ) p ON q.id = p.quotation_id
                    WHERE q.created_date >= ${from} AND q.created_date <= ${to} AND UPPER(TRIM(q.status)) NOT IN ('CANCELLED', 'PAID')
                ),
                q_payments AS (
                    SELECT COALESCE(SUM(amount), 0) as total_paid 
                    FROM quotation_payments qp 
                    JOIN quotations q ON qp.quotation_id = q.id 
                    WHERE q.created_date >= ${from} AND q.created_date <= ${to} AND UPPER(TRIM(q.status)) != 'CANCELLED'
                )
                SELECT * FROM q_stats, q_pending, q_payments
            `,
            sql`
                SELECT * FROM (
                    SELECT i.id, i.invoice_no as doc_no, i.customer_name, i.created_date, i.total_amount,
                           COALESCE(p.paid_amount, 0) as paid_amount, i.payment_type, i.status, i.due_date,
                           'Invoice' as doc_type,
                           c.image_url as customer_avatar
                    FROM invoices i
                    LEFT JOIN customers c ON i.customer_name = c.name
                    LEFT JOIN (
                        SELECT invoice_id, COALESCE(SUM(amount), 0) as paid_amount
                        FROM invoice_payments
                        GROUP BY invoice_id
                    ) p ON i.id = p.invoice_id
                    UNION ALL
                    SELECT q.id, q.quotation_no as doc_no, q.customer_name, q.created_date, q.total_amount,
                           COALESCE(p.paid_amount, 0) as paid_amount, q.payment_type, q.status, q.due_date,
                           'Proforma' as doc_type,
                           NULL as customer_avatar
                    FROM quotations q
                    LEFT JOIN (
                        SELECT quotation_id, COALESCE(SUM(amount), 0) as paid_amount
                        FROM quotation_payments
                        GROUP BY quotation_id
                    ) p ON q.id = p.quotation_id
                ) t
                ORDER BY created_date DESC
                LIMIT 5
            `,
            sql`
                SELECT id, lot_number, supplier_name, invoice_number, total_cost, created_at
                FROM purchase_lots
                ORDER BY created_at DESC
                LIMIT 5
            `
        ]);
        console.log("SUCCESS");
    } catch (e) {
        console.error("FAILED:", e);
    }
}

test();
