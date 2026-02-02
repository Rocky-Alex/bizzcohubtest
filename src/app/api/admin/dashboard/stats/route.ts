import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        // Default to last 30 days if not specified
        const endDate = toParam ? new Date(toParam) : new Date();
        const startDate = fromParam ? new Date(fromParam) : new Date();
        if (!fromParam) startDate.setDate(endDate.getDate() - 30);

        // Adjust for full day coverage
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Use ISO strings for DB comparison
        const from = startDate.toISOString();
        const to = endDate.toISOString();

        // Previous Period for trends
        const duration = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - duration);
        const prevEndDate = new Date(endDate.getTime() - duration);
        const prevFrom = prevStartDate.toISOString();
        const prevTo = prevEndDate.toISOString();

        // Parallel queries
        const results = await Promise.all([
            // 1. Current Invoice Stats
            sql`
                SELECT 
                    COUNT(*) as count,
                    COALESCE(SUM(total_amount), 0) as total_invoiced,
                    COALESCE(SUM(advance_received), 0) as received
                FROM invoices 
                WHERE created_date >= ${from} AND created_date <= ${to} AND TRIM(status) != 'Cancelled'
            `,
            // 2. Previous Invoice Stats (for trends)
            sql`
                SELECT 
                    COUNT(*) as count,
                    COALESCE(SUM(total_amount), 0) as total_invoiced,
                    COALESCE(SUM(advance_received), 0) as received
                FROM invoices 
                WHERE created_date >= ${prevFrom} AND created_date <= ${prevTo} AND TRIM(status) != 'Cancelled'
            `,
            // 3. Outstanding/Overdue (Total Snapshot/Calculated from range)
            sql`
                SELECT 
                    COALESCE(SUM(CASE WHEN (total_amount - COALESCE(advance_received, 0)) > 0 AND (due_date >= CURRENT_DATE OR due_date IS NULL) THEN (total_amount - COALESCE(advance_received, 0)) ELSE 0 END), 0) as outstanding,
                    COALESCE(SUM(CASE WHEN (total_amount - COALESCE(advance_received, 0)) > 0 AND due_date < CURRENT_DATE THEN (total_amount - COALESCE(advance_received, 0)) ELSE 0 END), 0) as overdue
                FROM invoices 
                WHERE created_date >= ${from} AND created_date <= ${to} AND TRIM(status) != 'Cancelled'
            `,
            // 4. Customer Stats (Current vs Prev)
            sql`SELECT COUNT(*) as count FROM customers WHERE created_at >= ${from} AND created_at <= ${to}`,
            sql`SELECT COUNT(*) as count FROM customers WHERE created_at >= ${prevFrom} AND created_at <= ${prevTo}`,
            // 5. Product/Quotation/Purchase
            sql`SELECT COUNT(*) as count FROM products`,
            sql`SELECT COUNT(*) as count FROM quotations WHERE created_date >= ${from} AND created_date <= ${to}`,
            sql`SELECT COUNT(*) as count FROM quotations WHERE created_date >= ${prevFrom} AND created_date <= ${prevTo}`,
            sql`SELECT COALESCE(SUM(total_cost), 0) as total FROM purchase_lots WHERE created_at >= ${from} AND created_at <= ${to}`,
            sql`
                SELECT i.id, i.invoice_no, i.customer_name, i.created_date, i.total_amount, 
                       COALESCE(i.advance_received, 0) as paid_amount, 
                       i.payment_type, i.status, i.due_date,
                       c.image_url as customer_avatar
                FROM invoices i
                LEFT JOIN customers c ON i.customer_name = c.name
                WHERE i.created_date >= ${from} AND i.created_date <= ${to}
                ORDER BY i.created_date DESC 
                LIMIT 5
            `
        ]);

        const [currInv, prevInv, outStat, currCust, prevCust, prodStat, currQuot, prevQuot, purStat, recentInvoices] = results;

        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const data = {
            invoices: Number(currInv[0].count),
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
            overdueAmt: Number(outStat[0].overdue),
            products: Number(prodStat[0].count),
            recentInvoices: recentInvoices || [],
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
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}
