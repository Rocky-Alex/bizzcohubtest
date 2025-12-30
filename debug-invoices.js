
const { invoiceSql } = require('@/lib/invoice-db');

async function checkInvoices() {
    try {
        const invoices = await invoiceSql`SELECT id, invoice_no, status, total_amount, created_date FROM invoices`;
        console.log('--- Invoice List ---');
        console.table(invoices);
    } catch (err) {
        console.error(err);
    }
}

checkInvoices();
