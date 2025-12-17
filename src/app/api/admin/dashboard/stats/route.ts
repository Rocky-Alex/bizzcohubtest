import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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

        // Parallel queries
        const [invoiceStats, customerStats, productStats, recentInvoicesRaw] = await Promise.all([
            // 1. Invoice Stats (Status based sums within date range)
            sql`
                SELECT 
                    COUNT(*) as count,
                    COALESCE(SUM(total_amount), 0) as total_invoiced,
                    COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) as received,
                    COALESCE(SUM(CASE WHEN status = 'Pending' AND (due_date >= CURRENT_DATE OR due_date IS NULL) THEN total_amount ELSE 0 END), 0) as outstanding,
                    COALESCE(SUM(CASE WHEN status = 'Overdue' OR (status = 'Pending' AND due_date < CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as overdue
                FROM invoices 
                WHERE created_date >= ${from} AND created_date <= ${to} AND status != 'Cancelled'
            `,
            // 2. Customer Stats (New customers in range)
            sql`
                SELECT COUNT(*) as count 
                FROM customers 
                WHERE created_at >= ${from} AND created_at <= ${to}
            `,
            // 3. Product Stats (Total current products - snapshot)
            // Note: History of products count is harder without a history table, so we just return current total
            // 4. Recent Invoices
            sql`SELECT COUNT(*) as count FROM products`,
            sql`
                SELECT id, customer_name, created_date, total_amount, 
                       CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END as paid_amount, 
                       payment_type, status, due_date 
                FROM invoices 
                ORDER BY created_date DESC 
                LIMIT 5
            `
        ]);

        const inv = invoiceStats[0];
        const cust = customerStats[0];
        const prod = productStats[0];
        const recentInvoices = recentInvoicesRaw; // The 4th result form Promise.all

        const data = {
            invoices: Number(inv.count || 0),
            customers: Number(cust.count || 0),
            amountDue: Number(inv.outstanding || 0) + Number(inv.overdue || 0),
            quotations: 0, // Placeholder
            sales: Number(inv.total_invoiced || 0),
            purchase: 0, // Placeholder
            expenses: 0, // Placeholder
            credits: 0, // Placeholder
            invoicedAmt: Number(inv.total_invoiced || 0),
            receivedAmt: Number(inv.received || 0),
            outstandingAmt: Number(inv.outstanding || 0),
            overdueAmt: Number(inv.overdue || 0),
            products: Number(prod.count || 0),
            recentInvoices: recentInvoices || []
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
