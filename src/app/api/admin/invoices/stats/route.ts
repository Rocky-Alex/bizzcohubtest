import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function GET() {
    try {
        // Parallelize queries for efficiency
        const [overallStats, currentMonthStats, prevMonthStats, recentTransactions, monthlyRevenue, quotationStats] = await Promise.all([
            // 1. Overall Totals
            sql`
                SELECT
                    COUNT(*) as total_invoices,
                    COALESCE(SUM(CASE WHEN TRIM(status) = 'Paid' THEN total_amount ELSE 0 END), 0) as total_received,
                    
                     COALESCE(SUM(CASE 
                        WHEN TRIM(status) != 'Paid' AND TRIM(status) != 'Cancelled' THEN total_amount 
                        ELSE 0 
                    END), 0) as total_credit_amount,

                    COUNT(CASE WHEN TRIM(status) = 'Partial' THEN 1 END) as total_partial_count,
                    COUNT(CASE WHEN TRIM(status) = 'Pending' THEN 1 END) as total_pending_count,

                    COALESCE(SUM(CASE 
                        WHEN TRIM(status) = 'Pending' AND (due_date >= CURRENT_DATE OR due_date IS NULL) THEN total_amount 
                        ELSE 0 
                    END), 0) as pending_amount,
                    
                    COALESCE(SUM(CASE 
                        WHEN TRIM(status) = 'Overdue' THEN total_amount
                        WHEN TRIM(status) = 'Pending' AND due_date < CURRENT_DATE THEN total_amount
                        ELSE 0 
                    END), 0) as overdue_amount
                FROM invoices
                WHERE TRIM(status) != 'Cancelled'
            `,
            // 2. Current Month Stats
            sql`
                SELECT
                    COUNT(*) as count,
                    COALESCE(SUM(CASE WHEN TRIM(status) = 'Paid' THEN total_amount ELSE 0 END), 0) as received,
                    COALESCE(SUM(CASE WHEN TRIM(status) = 'Pending' THEN total_amount ELSE 0 END), 0) as pending,
                    COALESCE(SUM(CASE WHEN TRIM(status) = 'Overdue' THEN total_amount ELSE 0 END), 0) as overdue
                FROM invoices
                WHERE created_date >= date_trunc('month', CURRENT_DATE)
            `,
            // 3. Previous Month Stats
            sql`
                SELECT
                    COUNT(*) as count,
                    COALESCE(SUM(CASE WHEN TRIM(status) = 'Paid' THEN total_amount ELSE 0 END), 0) as received,
                    COALESCE(SUM(CASE WHEN TRIM(status) = 'Pending' THEN total_amount ELSE 0 END), 0) as pending,
                    COALESCE(SUM(CASE WHEN TRIM(status) = 'Overdue' THEN total_amount ELSE 0 END), 0) as overdue
                FROM invoices
                WHERE created_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                  AND created_date < date_trunc('month', CURRENT_DATE)
            `,
            // 4. Recent Transactions (Last 5)
            sql`
                SELECT id, invoice_no, customer_name, total_amount, status, created_date 
                FROM invoices 
                WHERE TRIM(status) != 'Cancelled'
                ORDER BY created_date DESC 
                LIMIT 5
            `,
            // 5. Monthly Revenue (Last 6 Months)
            sql`
                SELECT 
                    TO_CHAR(date_trunc('month', created_date), 'Mon') as month,
                    COALESCE(SUM(total_amount), 0) as revenue
                FROM invoices
                WHERE created_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 month') -- Get 5 previous + current = 6 months
                  AND TRIM(status) != 'Cancelled'
                GROUP BY date_trunc('month', created_date)
                ORDER BY date_trunc('month', created_date) ASC
            `,
            // 6. Quotation Account
            sql`
                SELECT COUNT(*) as count FROM quotations
            `.catch(() => [{ count: 0 }])
        ]);

        const totals = overallStats[0];
        const cm = currentMonthStats[0]; // Current Month
        const pm = prevMonthStats[0];    // Previous Month
        const quotTotal = quotationStats[0];

        // Helper to calculate percentage change
        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const result = {
            totalInvoices: Number(totals.total_invoices) || 0,
            totalReceived: Number(totals.total_received) || 0,

            totalCreditAmount: Number(totals.total_credit_amount) || 0,
            totalPartialCount: Number(totals.total_partial_count) || 0,
            totalPendingCount: Number(totals.total_pending_count) || 0,
            totalQuotations: Number(quotTotal.count) || 0,

            pendingAmount: Number(totals.pending_amount) || 0,
            overdueAmount: Number(totals.overdue_amount) || 0,
            trends: {
                invoices: calcTrend(Number(cm.count), Number(pm.count)),
                received: calcTrend(Number(cm.received), Number(pm.received)),
                pending: calcTrend(Number(cm.pending), Number(pm.pending)),
                overdue: calcTrend(Number(cm.overdue), Number(pm.overdue))
            },
            recentTransactions: recentTransactions || [],
            monthlyRevenue: monthlyRevenue || []
        };

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching invoice stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
