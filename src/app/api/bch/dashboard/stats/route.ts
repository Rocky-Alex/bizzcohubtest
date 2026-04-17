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

        // Previous Period for trends
        const duration = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - duration);
        const prevEndDate = new Date(endDate.getTime() - duration);
        const prevFrom = prevStartDate.toISOString();
        const prevTo = prevEndDate.toISOString();

        const results = await Promise.all([
            sql`
                SELECT 
                    COUNT(*) as count,
                    COALESCE(SUM(total_amount), 0) as total_invoiced,
                    COALESCE(SUM(advance_received), 0) as received
                FROM invoices 
                WHERE created_date >= ${from} AND created_date <= ${to} AND UPPER(TRIM(status)) != 'CANCELLED'
            `,
            sql`
                SELECT 
                    COUNT(*) as count,
                    COALESCE(SUM(total_amount), 0) as total_invoiced,
                    COALESCE(SUM(advance_received), 0) as received
                FROM invoices 
                WHERE created_date >= ${prevFrom} AND created_date <= ${prevTo} AND UPPER(TRIM(status)) != 'CANCELLED'
            `,
            invoiceSql`
                SELECT 
                    COALESCE(SUM(CASE WHEN (i.total_amount - COALESCE(p.paid_amount, 0)) > 0 AND (i.due_date >= CURRENT_DATE OR i.due_date IS NULL) THEN (i.total_amount - COALESCE(p.paid_amount, 0)) ELSE 0 END), 0) as outstanding,
                    COALESCE(SUM(CASE WHEN (i.total_amount - COALESCE(p.paid_amount, 0)) > 0 AND i.due_date < CURRENT_DATE THEN (i.total_amount - COALESCE(p.paid_amount, 0)) ELSE 0 END), 0) as overdue
                FROM invoices i
                LEFT JOIN (
                    SELECT invoice_id, COALESCE(SUM(amount), 0) as paid_amount
                    FROM invoice_payments
                    GROUP BY invoice_id
                ) p ON i.id = p.invoice_id
                WHERE i.created_date >= ${from} AND i.created_date <= ${to} AND UPPER(TRIM(i.status)) NOT IN ('CANCELLED', 'PAID')
            `,
            sql`SELECT COUNT(*) as count FROM customers WHERE created_at >= ${from} AND created_at <= ${to}`,
            sql`SELECT COUNT(*) as count FROM customers WHERE created_at >= ${prevFrom} AND created_at <= ${prevTo}`,
            sql`SELECT COUNT(*) as count FROM products`,
            quotationSql`SELECT COUNT(*) as count, COALESCE(SUM(advance_received), 0) as received FROM quotations WHERE created_date >= ${from} AND created_date <= ${to} AND UPPER(TRIM(status)) != 'CANCELLED'`,
            quotationSql`SELECT COUNT(*) as count, COALESCE(SUM(advance_received), 0) as received FROM quotations WHERE created_date >= ${prevFrom} AND created_date <= ${prevTo} AND UPPER(TRIM(status)) != 'CANCELLED'`,
            sql`SELECT COALESCE(SUM(total_cost), 0) as total FROM purchase_lots WHERE created_at >= ${from} AND created_at <= ${to}`,
            quotationSql`SELECT COALESCE(SUM(total_amount), 0) as total_amount FROM quotations WHERE created_date >= ${from} AND created_date <= ${to} AND UPPER(TRIM(status)) != 'CANCELLED'`,
            invoiceSql`SELECT COALESCE(SUM(amount), 0) as total_paid FROM invoice_payments ip JOIN invoices i ON ip.invoice_id = i.id WHERE i.created_date >= ${from} AND i.created_date <= ${to} AND UPPER(TRIM(i.status)) != 'CANCELLED'`,
            quotationSql`SELECT COALESCE(SUM(amount), 0) as total_paid FROM quotation_payments qp JOIN quotations q ON qp.quotation_id = q.id WHERE q.created_date >= ${from} AND q.created_date <= ${to} AND UPPER(TRIM(q.status)) != 'CANCELLED'`,
            invoiceSql`
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
            `,
            quotationSql`
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
            `,
            invoiceSql`SELECT COUNT(*) as count FROM receipt_list WHERE payment_date >= ${from} AND payment_date <= ${to}`,
            sql`SELECT COALESCE(SUM(quantity), 0) as qty FROM purchase_lot_items WHERE created_at >= ${from} AND created_at <= ${to}`,
            sql`SELECT COALESCE(SUM(quantity), 0) as qty FROM master_inventory WHERE created_at >= ${from} AND created_at <= ${to}`,
            sql`SELECT COALESCE(SUM(qty_sold), 0) as sold_qty FROM sale_out WHERE sold_at >= ${from} AND sold_at <= ${to}`,
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
        ]) as unknown as any[][];

        const [
            currInv,
            prevInv,
            outStat,
            currCust,
            prevCust,
            prodStat,
            currQuot,
            prevQuot,
            purStat,
            currQuotTotal,
            invPaid,
            quotPaid,
            invPending,
            quotPending,
            receipts,
            purchaseQty,
            qcQty,
            soldQty,
            recentBilling,
            recentPurchases
        ] = results;

        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const totalInvoicedAmount = Number(currInv[0].total_invoiced) + Number(currQuotTotal[0].total_amount);
        const totalPendingInvoicedAmount = Number(invPending[0].pending) + Number(quotPending[0].pending);
        const totalOverdueAmount = Number(invPending[0].overdue) + Number(quotPending[0].overdue);
        const totalPaidInvoicedAmount = totalInvoicedAmount - totalPendingInvoicedAmount;
        
        // Fix: Don't just add purchaseQty and qcQty together because they overlap.
        // totalProductQty should be the total manifest (purchaseQty) plus any products added directly to Master Inventory (not from a lot).
        const totalProductQty = Number(purchaseQty[0].qty) - Number(soldQty[0].sold_qty);
        const totalSoldQty = Number(soldQty[0].sold_qty);

        const data = {
            invoices: Number(currInv[0].count),
            proformaCount: Number(currQuot[0].count),
            receiptCount: Number(receipts[0].count),
            totalProductQty,
            totalSoldQty,
            totalInvoicedAmount,
            totalPaidInvoicedAmount,
            totalPendingInvoicedAmount,
            customers: Number(currCust[0].count),
            amountDue: Number(outStat[0].outstanding) + Number(outStat[0].overdue),
            quotations: Number(currQuot[0].count),
            sales: Number(currInv[0].total_invoiced),
            purchase: Number(purStat[0].total),
            expenses: 0,
            credits: Number(outStat[0].outstanding) + Number(outStat[0].overdue),
            invoicedAmt: Number(currInv[0].total_invoiced),
            receivedAmt: Number(currInv[0].received),
            outstandingAmt: Number(outStat[0].outstanding),
            overdueAmt: totalOverdueAmount,
            products: Number(prodStat[0].count),
            recentBilling: recentBilling || [],
            recentPurchases: recentPurchases || [],
            trends: {
                sales: calcTrend(Number(currInv[0].total_invoiced), Number(prevInv[0].total_invoiced)),
                quotations: calcTrend(Number(currQuot[0].count), Number(prevQuot[0].count)),
                customers: calcTrend(Number(currCust[0].count), Number(prevCust[0].count)),
                invoices: calcTrend(Number(currInv[0].count), Number(prevInv[0].count))
            }
        };

        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error('Error fetching dashboard stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats', details: errorMessage },
            { status: 500 }
        );
    }
}
