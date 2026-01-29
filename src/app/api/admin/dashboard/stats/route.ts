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
        let endDate = toParam ? new Date(toParam) : new Date();
        let startDate = fromParam ? new Date(fromParam) : new Date();

        // Validate dates (check for Invalid Date)
        if (isNaN(endDate.getTime())) endDate = new Date();
        if (isNaN(startDate.getTime())) startDate = new Date();

        if (!fromParam) startDate.setDate(endDate.getDate() - 30);

        // Adjust for full day coverage
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Use ISO strings for DB comparison
        const from = startDate.toISOString();
        const to = endDate.toISOString();

        // Helper to safely execute queries
        const safeQuery = async (queryPromise: Promise<any>, fallback: any, name: string) => {
            try {
                return await queryPromise;
            } catch (error) {
                console.warn(`Query failed for ${name}:`, error);
                return fallback;
            }
        };

        // Parallel queries with individual error handling
        const [invoiceStats, customerStats, productStats, recentInvoicesRaw, purchaseStats, expenseStats] = await Promise.all([
            // 1. Invoice Stats
            safeQuery(
                sql`
                    SELECT 
                        COUNT(i.invoice_id) as count,
                        COALESCE(SUM(o.total_amount), 0) as total_invoiced,
                        COALESCE(SUM(CASE WHEN o.payment_status = 'Paid' THEN o.total_amount ELSE 0 END), 0) as received,
                        COALESCE(SUM(CASE WHEN o.payment_status = 'Unpaid' THEN o.total_amount ELSE 0 END), 0) as outstanding,
                        0 as overdue
                    FROM invoices i
                    JOIN orders o ON i.order_id = o.order_id
                    WHERE i.created_at >= ${from} AND i.created_at <= ${to} AND o.order_status != 'Cancelled'
                `,
                [{ count: 0, total_invoiced: 0, received: 0, outstanding: 0, overdue: 0 }],
                'Invoice Stats'
            ),

            // 2. Customer Stats
            safeQuery(
                sql`
                    SELECT COUNT(*) as count 
                    FROM customers 
                    WHERE created_at >= ${from} AND created_at <= ${to}
                `,
                [{ count: 0 }],
                'Customer Stats'
            ),

            // 3. Product Stats
            safeQuery(
                sql`SELECT COUNT(*) as count FROM products`,
                [{ count: 0 }],
                'Product Stats'
            ),

            // 4. Recent Invoices
            safeQuery(
                sql`
                    SELECT i.invoice_id as id, c.name as customer_name, i.created_at as created_date, o.total_amount, 
                           CASE WHEN o.payment_status = 'Paid' THEN o.total_amount ELSE 0 END as paid_amount, 
                           'Standard' as payment_type, o.payment_status as status, NULL as due_date,
                           COALESCE(c.avatar, c.image_url) as customer_avatar
                    FROM invoices i
                    JOIN orders o ON i.order_id = o.order_id
                    JOIN customers c ON o.customer_id = c.customer_id
                    ORDER BY i.created_at DESC 
                    LIMIT 5
                `,
                [],
                'Recent Invoices'
            ),

            // 5. Purchase Stats
            safeQuery(
                sql`
                    SELECT COALESCE(SUM(total_cost), 0) as total 
                    FROM purchase_lots 
                    WHERE invoice_date >= ${from.split('T')[0]} AND invoice_date <= ${to.split('T')[0]}
                `,
                [{ total: 0 }],
                'Purchase Stats'
            ),

            // 6. Expense Stats
            safeQuery(
                sql`
                    SELECT COALESCE(SUM(amount), 0) as total 
                    FROM accounting_ledger 
                    WHERE type = 'Expense' AND date >= ${from} AND date <= ${to}
                `,
                [{ total: 0 }],
                'Expense Stats'
            )
        ]);

        const inv = invoiceStats[0] || {};
        const cust = customerStats[0] || {};
        const prod = productStats[0] || {};
        const recentInvoices = recentInvoicesRaw || [];
        const purchase = purchaseStats[0] || {};
        const expenses = expenseStats[0] || {};

        const data = {
            invoices: Number(inv.count || 0),
            customers: Number(cust.count || 0),
            amountDue: Number(inv.outstanding || 0) + Number(inv.overdue || 0),
            quotations: 0,
            sales: Number(inv.total_invoiced || 0),
            purchase: Number(purchase.total || 0),
            expenses: Number(expenses.total || 0),
            credits: 0,
            invoicedAmt: Number(inv.total_invoiced || 0),
            receivedAmt: Number(inv.received || 0),
            outstandingAmt: Number(inv.outstanding || 0),
            overdueAmt: Number(inv.overdue || 0),
            products: Number(prod.count || 0),
            recentInvoices: recentInvoices
        };

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}
