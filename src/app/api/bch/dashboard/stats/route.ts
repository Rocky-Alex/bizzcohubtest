import { NextResponse } from 'next/server';
import { sql, invoiceSql, quotationSql } from '@/lib/db';

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        const lifetime = searchParams.get('lifetime') === 'true';

        // If lifetime=true, don't apply date filters
        let from: string;
        let to: string;
        let startDate: Date;
        let endDate: Date;

        if (lifetime) {
            // For lifetime stats, use a reasonable date range from 2020
            startDate = new Date('2020-01-01T00:00:00.000Z');
            endDate = new Date();
            from = startDate.toISOString();
            to = endDate.toISOString();
        } else {
            // Default to last 30 days if not specified
            endDate = toParam ? new Date(toParam) : new Date();
            startDate = fromParam ? new Date(fromParam) : new Date();
            if (!fromParam) startDate.setDate(endDate.getDate() - 30);

            // Adjust for full day coverage
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            // Use ISO strings for DB comparison
            from = startDate.toISOString();
            to = endDate.toISOString();
        }

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date range provided' }, { status: 400 });
        }

        // Previous Period for trends
        const duration = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - duration);
        const prevEndDate = new Date(endDate.getTime() - duration);
        
        if (isNaN(prevStartDate.getTime()) || isNaN(prevEndDate.getTime())) {
            return NextResponse.json({ error: 'Invalid previous period range' }, { status: 400 });
        }

        // Using the already declared and assigned from/to
        const prevFrom = prevStartDate.toISOString();
        const prevTo = prevEndDate.toISOString();

        // Execute queries with individual error handling for better debugging
        let invGeneral, miscStats, invDetails, quotDetails, recentBilling, recentPurchases;

            const results = await Promise.all([
                // 1. Invoices General Stats
                sql`
                    WITH periods AS (
                        SELECT 
                            SUM(CASE WHEN created_date >= ${from}::timestamp AND created_date <= ${to}::timestamp THEN 1 ELSE 0 END) as curr_count,
                            COALESCE(SUM(CASE WHEN created_date >= ${from}::timestamp AND created_date <= ${to}::timestamp THEN total_amount ELSE 0 END), 0) as curr_total,
                            COALESCE(SUM(CASE WHEN created_date >= ${from}::timestamp AND created_date <= ${to}::timestamp THEN advance_received ELSE 0 END), 0) as curr_received,
                            SUM(CASE WHEN created_date >= ${prevFrom}::timestamp AND created_date <= ${prevTo}::timestamp THEN 1 ELSE 0 END) as prev_count,
                            COALESCE(SUM(CASE WHEN created_date >= ${prevFrom}::timestamp AND created_date <= ${prevTo}::timestamp THEN total_amount ELSE 0 END), 0) as prev_total
                        FROM invoices 
                        WHERE UPPER(TRIM(status)) != 'CANCELLED'
                    )
                    SELECT * FROM periods
                `.catch((e: unknown) => { console.error('Query 1 failed:', e); throw e; }),

                // 2. Customers, Products, Purchases
                sql`
                    SELECT
                        (SELECT COUNT(*) FROM customers WHERE created_at >= ${from}::timestamp AND created_at <= ${to}::timestamp) as curr_cust,
                        (SELECT COUNT(*) FROM customers WHERE created_at >= ${prevFrom}::timestamp AND created_at <= ${prevTo}::timestamp) as prev_cust,
                        (SELECT COUNT(*) FROM products) as prod_count,
                        (SELECT COALESCE(SUM(total_cost), 0) FROM purchase_lots WHERE created_at >= ${from}::timestamp AND created_at <= ${to}::timestamp) as pur_total,
                        (SELECT COALESCE(SUM(quantity), 0) FROM purchase_lot_items WHERE created_at >= ${from}::timestamp AND created_at <= ${to}::timestamp) as pur_qty,
                        (SELECT COALESCE(SUM(quantity), 0) FROM master_inventory WHERE created_at >= ${from}::timestamp AND created_at <= ${to}::timestamp) as qc_qty,
                        (SELECT COUNT(*) FROM sale_out WHERE sold_at >= ${from}::timestamp AND sold_at <= ${to}::timestamp) as sold_qty
                `.catch((e: unknown) => { console.error('Query 2 failed:', e); throw e; }),

                // 3. Invoices Detailed Stats & Payments
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
                        WHERE i.created_date >= ${from}::timestamp AND i.created_date <= ${to}::timestamp AND UPPER(TRIM(i.status)) NOT IN ('CANCELLED', 'PAID')
                    ),
                    payments AS (
                        SELECT COALESCE(SUM(amount), 0) as total_paid 
                        FROM invoice_payments ip 
                        JOIN invoices i ON ip.invoice_id = i.id 
                        WHERE i.created_date >= ${from}::timestamp AND i.created_date <= ${to}::timestamp AND UPPER(TRIM(i.status)) != 'CANCELLED'
                    ),
                    receipts AS (
                        SELECT COUNT(*) as count FROM receipt_list WHERE payment_date >= ${from}::timestamp AND payment_date <= ${to}::timestamp
                    )
                    SELECT * FROM inv_stats, payments, receipts
                `.catch((e: unknown) => { console.error('Query 3 failed:', e); throw e; }),

                // 4. Quotations Stats
                sql`
                    WITH q_stats AS (
                        SELECT 
                            SUM(CASE WHEN created_date >= ${from}::timestamp AND created_date <= ${to}::timestamp THEN 1 ELSE 0 END) as curr_count,
                            COALESCE(SUM(CASE WHEN created_date >= ${from}::timestamp AND created_date <= ${to}::timestamp THEN total_amount ELSE 0 END), 0) as curr_total,
                            COALESCE(SUM(CASE WHEN created_date >= ${from}::timestamp AND created_date <= ${to}::timestamp THEN advance_received ELSE 0 END), 0) as curr_received,
                            SUM(CASE WHEN created_date >= ${prevFrom}::timestamp AND created_date <= ${prevTo}::timestamp THEN 1 ELSE 0 END) as prev_count,
                            COALESCE(SUM(CASE WHEN created_date >= ${prevFrom}::timestamp AND created_date <= ${prevTo}::timestamp THEN total_amount ELSE 0 END), 0) as prev_total
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
                        WHERE q.created_date >= ${from}::timestamp AND q.created_date <= ${to}::timestamp AND UPPER(TRIM(q.status)) NOT IN ('CANCELLED', 'PAID')
                    ),
                    q_payments AS (
                        SELECT COALESCE(SUM(amount), 0) as total_paid 
                        FROM quotation_payments qp 
                        JOIN quotations q ON qp.quotation_id = q.id 
                        WHERE q.created_date >= ${from}::timestamp AND q.created_date <= ${to}::timestamp AND UPPER(TRIM(q.status)) != 'CANCELLED'
                    )
                    SELECT * FROM q_stats, q_pending, q_payments
                `.catch((e: unknown) => { console.error('Query 4 failed:', e); throw e; }),

                // 5. Recent Billing
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
                               CAST(NULL AS TEXT) as customer_avatar
                        FROM quotations q
                        LEFT JOIN (
                            SELECT quotation_id, COALESCE(SUM(amount), 0) as paid_amount
                            FROM quotation_payments
                            GROUP BY quotation_id
                        ) p ON q.id = p.quotation_id
                    ) t
                    ORDER BY created_date DESC
                    LIMIT 5
                `.catch((e: unknown) => { console.error('Query 5 failed:', e); throw e; }),

                // 6. Recent Purchases
                sql`
                    SELECT id, lot_number, supplier_name, invoice_number, total_cost, created_at
                    FROM purchase_lots
                    ORDER BY created_at DESC
                    LIMIT 5
                `.catch((e: unknown) => { console.error('Query 6 failed:', e); throw e; })
            ]);

        invGeneral = results[0];
        miscStats = results[1];
        invDetails = results[2];
        quotDetails = results[3];
        recentBilling = results[4];
        recentPurchases = results[5];

        const invGen = invGeneral?.[0] || { curr_count: 0, curr_total: 0, curr_received: 0, prev_count: 0, prev_total: 0 };
        const misc = miscStats?.[0] || { curr_cust: 0, prev_cust: 0, prod_count: 0, pur_total: 0, pur_qty: 0, qc_qty: 0, sold_qty: 0 };
        const invDet = invDetails?.[0] || { pending: 0, overdue: 0, total_paid: 0, count: 0 };
        const quotDet = quotDetails?.[0] || { curr_count: 0, curr_total: 0, curr_received: 0, prev_count: 0, prev_total: 0, pending: 0, overdue: 0, total_paid: 0 };

        const calcTrend = (curr: any, prev: any) => {
            const c = Number(curr) || 0;
            const p = Number(prev) || 0;
            if (p === 0) return c > 0 ? 100 : 0;
            return ((c - p) / p) * 100;
        };

        const totalInvoicedAmount = (Number(invGen.curr_total) || 0) + (Number(quotDet.curr_total) || 0);
        const totalPendingInvoicedAmount = (Number(invDet.pending) || 0) + (Number(quotDet.pending) || 0);
        const totalOverdueAmount = (Number(invDet.overdue) || 0) + (Number(quotDet.overdue) || 0);
        const totalPaidInvoicedAmount = totalInvoicedAmount - totalPendingInvoicedAmount;
        
        const totalProductQty = (Number(misc.pur_qty) || 0) - (Number(misc.sold_qty) || 0);
        const totalSoldQty = Number(misc.sold_qty) || 0;

        const data = {
            invoices: Number(invGen.curr_count) || 0,
            proformaCount: Number(quotDet.curr_count) || 0,
            receiptCount: Number(invDet.count) || 0,
            totalProductQty,
            totalSoldQty,
            totalInvoicedAmount,
            totalPaidInvoicedAmount,
            totalPendingInvoicedAmount,
            customers: Number(misc.curr_cust) || 0,
            amountDue: (Number(invDet.pending) || 0) + (Number(invDet.overdue) || 0),
            quotations: Number(quotDet.curr_count) || 0,
            sales: Number(invGen.curr_total) || 0,
            purchase: Number(misc.pur_total) || 0,
            expenses: 0,
            credits: (Number(invDet.pending) || 0) + (Number(invDet.overdue) || 0),
            invoicedAmt: Number(invGen.curr_total) || 0,
            receivedAmt: Number(invGen.curr_received) || 0,
            outstandingAmt: Number(invDet.pending) || 0,
            overdueAmt: totalOverdueAmount,
            products: Number(misc.prod_count) || 0,
            recentBilling: recentBilling || [],
            recentPurchases: recentPurchases || [],
            trends: {
                sales: calcTrend(invGen.curr_total, invGen.prev_total),
                quotations: calcTrend(quotDet.curr_count, quotDet.prev_count),
                customers: calcTrend(misc.curr_cust, misc.prev_cust),
                invoices: calcTrend(invGen.curr_count, invGen.prev_count)
            }
        };

        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error('Final Error in dashboard stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats', details: errorMessage },
            { status: 500 }
        );
    }
}
