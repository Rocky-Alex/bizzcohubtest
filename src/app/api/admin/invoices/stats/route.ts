import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function GET() {
    try {
        // Parallelize queries for efficiency
        const [overallStats, currentMonthStats, prevMonthStats] = await Promise.all([
            // 1. Overall Totals
            sql`
                SELECT
                    COUNT(*) as total_invoices,
                    -- Total Received: Explicitly 'Paid'
                    COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) as total_received,
                    
                    -- Pending Amount: 'Pending' status AND NOT overdue
                    COALESCE(SUM(CASE 
                        WHEN status = 'Pending' AND (due_date >= CURRENT_DATE OR due_date IS NULL) THEN total_amount 
                        ELSE 0 
                    END), 0) as pending_amount,
                    
                    -- Overdue Amount: Explicit 'Overdue' status OR ('Pending' status AND past due date)
                    -- Excludes 'Cancelled'
                    COALESCE(SUM(CASE 
                        WHEN status = 'Overdue' THEN total_amount
                        WHEN status = 'Pending' AND due_date < CURRENT_DATE THEN total_amount
                        ELSE 0 
                    END), 0) as overdue_amount
                FROM invoices
                WHERE status != 'Cancelled' -- Generally exclude Cancelled from financial sums, or handle inside status checks if count includes them
            `,
            // 2. Current Month Stats
            sql`
                SELECT
                    COUNT(*) as count,
                    COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) as received
                FROM invoices
                WHERE created_date >= date_trunc('month', CURRENT_DATE)
            `,
            // 3. Previous Month Stats
            sql`
                SELECT
                    COUNT(*) as count,
                    COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) as received
                FROM invoices
                WHERE created_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                  AND created_date < date_trunc('month', CURRENT_DATE)
            `
        ]);

        const totals = overallStats[0];
        const cm = currentMonthStats[0]; // Current Month
        const pm = prevMonthStats[0];    // Previous Month

        // Helper to calculate percentage change
        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const result = {
            totalInvoices: Number(totals.total_invoices) || 0,
            totalReceived: Number(totals.total_received) || 0,
            pendingAmount: Number(totals.pending_amount) || 0,
            overdueAmount: Number(totals.overdue_amount) || 0,
            trends: {
                invoices: calcTrend(Number(cm.count), Number(pm.count)),
                received: calcTrend(Number(cm.received), Number(pm.received)),
                // For pending/overdue, tracking trends is tricker without snapshots, defaulting to 0 for now
                pending: 0,
                overdue: 0
            }
        };

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching invoice stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
