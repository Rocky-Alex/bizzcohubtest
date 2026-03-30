import { NextResponse } from 'next/server';
import { sql, invoiceSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get('query')?.trim();
        const searchPattern = query && query.length >= 2 ? `%${query}%` : null;

        // Parallel queries for all document types
        const [invoices, quotations, receipts, customers] = await Promise.all([
            searchPattern ? 
                invoiceSql`SELECT DISTINCT invoice_no, customer_name FROM invoices WHERE invoice_no ILIKE ${searchPattern} OR customer_name ILIKE ${searchPattern} ORDER BY invoice_no DESC LIMIT 10` :
                invoiceSql`SELECT DISTINCT invoice_no, customer_name FROM invoices ORDER BY invoice_no DESC LIMIT 10`,
            searchPattern ? 
                invoiceSql`SELECT DISTINCT quotation_no, customer_name FROM quotations WHERE quotation_no ILIKE ${searchPattern} OR customer_name ILIKE ${searchPattern} ORDER BY quotation_no DESC LIMIT 10` :
                invoiceSql`SELECT DISTINCT quotation_no, customer_name FROM quotations ORDER BY quotation_no DESC LIMIT 10`,
            searchPattern ? 
                invoiceSql`SELECT DISTINCT receipt_no, customer_name FROM receipt_list WHERE receipt_no ILIKE ${searchPattern} OR customer_name ILIKE ${searchPattern} ORDER BY receipt_no DESC LIMIT 10` :
                invoiceSql`SELECT DISTINCT receipt_no, customer_name FROM receipt_list ORDER BY receipt_no DESC LIMIT 10`,
            searchPattern ? 
                sql`SELECT DISTINCT id, name FROM customers WHERE name ILIKE ${searchPattern} AND status = 'Active' ORDER BY name ASC LIMIT 10` :
                sql`SELECT DISTINCT id, name FROM customers WHERE status = 'Active' ORDER BY name ASC LIMIT 10`
        ]) as [any[], any[], any[], any[]];

        const suggestions: { type: string; label: string; value: string }[] = [];

        // Invoices
        invoices.forEach(inv => {
            suggestions.push({
                type: 'invoice',
                label: `Invoice: ${inv.invoice_no} — ${inv.customer_name}`,
                value: `${inv.invoice_no} — ${inv.customer_name}`
            });
        });

        // Proformas / Quotations (Using quotations table)
        quotations.forEach(q => {
            suggestions.push({
                type: 'proforma',
                label: `Proforma: ${q.quotation_no} — ${q.customer_name}`,
                value: `${q.quotation_no} — ${q.customer_name}`
            });
        });

        // Receipts
        receipts.forEach(r => {
            suggestions.push({
                type: 'receipt',
                label: `Receipt: ${r.receipt_no} — ${r.customer_name}`,
                value: `${r.receipt_no} — ${r.customer_name}`
            });
        });

        // Customers
        customers.forEach(cust => {
            suggestions.push({
                type: 'customer',
                label: `Customer: ${cust.name}`,
                value: cust.name
            });
        });

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Notes search error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}
