import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function InvoiceList({ setActiveSection, onEdit }: { setActiveSection: (section: string) => void, onEdit: (invoice: any) => void }) {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- View Modal State ---
    const [viewData, setViewData] = useState<{ invoice: any, items: any[] } | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // --- Payment Modal State ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', method: 'Cash' });
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null); // For edit mode
    const [loadingPayments, setLoadingPayments] = useState(false);

    React.useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch('/api/admin/invoices');
                if (response.ok) {
                    const data = await response.json();
                    setInvoices(data.invoices || []);
                }
            } catch (error) {
                console.error('Error fetching invoices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
        const interval = setInterval(fetchInvoices, 600000); // 10 minutes
        return () => clearInterval(interval);
    }, []);

    const [confirmationModal, setConfirmationModal] = useState<{ show: boolean; id: number | null; newStatus: string | null }>({
        show: false,
        id: null,
        newStatus: null
    });

    const handleStatusChange = (id: number, newStatus: string) => {
        setConfirmationModal({ show: true, id, newStatus });
    };

    const confirmStatusChange = async () => {
        const { id, newStatus } = confirmationModal;
        if (!id || !newStatus) return;

        setConfirmationModal({ show: false, id: null, newStatus: null });

        // Optimistic update
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));

        try {
            const response = await fetch(`/api/admin/invoices/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                console.error('Failed to update status');
                // Could fetchInvoices() to revert
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const closeConfirmationModal = () => {
        setConfirmationModal({ show: false, id: null, newStatus: null });
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }



    // --- Action Handlers ---
    const handleView = async (id: number) => {
        setLoadingDetails(true);
        setShowViewModal(true);
        try {
            const res = await fetch(`/api/admin/invoices/${id}`);
            if (res.ok) {
                const data = await res.json();
                setViewData(data);
            } else {
                alert('Failed to fetch invoice details');
                setShowViewModal(false);
            }
        } catch (error) {
            console.error(error);
            alert('Error fetching details');
            setShowViewModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDelete = (id: number) => {
        // Reuse confirmation modal for delete, utilizing a special status 'DELETE' to identify action
        setConfirmationModal({ show: true, id, newStatus: 'DELETE' });
    };

    const handlePayment = async (inv: any) => {
        setSelectedInvoiceId(inv.id);
        setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', method: 'Cash' });
        setEditingPaymentId(null);
        setShowPaymentModal(true);
        setLoadingPayments(true);
        try {
            const res = await fetch(`/api/admin/invoices/${inv.id}/payments`);
            if (res.ok) {
                const data = await res.json();
                setPaymentHistory(data.payments || []);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoadingPayments(false);
        }
    };

    const submitPayment = async () => {
        if (!selectedInvoiceId || !paymentForm.amount) return;

        // Determine Method (POST or PATCH) and URL
        const method = editingPaymentId ? 'PATCH' : 'POST';
        const url = editingPaymentId
            ? `/api/admin/invoices/${selectedInvoiceId}/payments/${editingPaymentId}`
            : `/api/admin/invoices/${selectedInvoiceId}/payments`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentForm)
            });

            const data = await res.json();

            if (res.ok) {
                alert(editingPaymentId ? 'Payment updated successfully!' : 'Payment recorded successfully!');

                // Refresh list logic
                // 1. Update Invoices List locally
                setInvoices(prev => prev.map(inv => inv.id === selectedInvoiceId ? {
                    ...inv,
                    status: data.newStatus,
                    advance_received: data.newPaid
                } : inv));

                // 2. Refresh Payment History
                const histRes = await fetch(`/api/admin/invoices/${selectedInvoiceId}/payments`);
                if (histRes.ok) {
                    const histData = await histRes.json();
                    setPaymentHistory(histData.payments || []);
                }

                // 3. Reset Form
                setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', method: 'Cash' });
                setEditingPaymentId(null);

                // Optional: Keep modal open to show updated history
                // setShowPaymentModal(false); 

            } else {
                alert('Failed to save payment: ' + data.error);
            }
        } catch (error) {
            console.error('Error submitting payment:', error);
            alert('Error submitting payment');
        }
    };

    const handleEditPayment = (pay: any) => {
        setEditingPaymentId(pay.id);
        const dateStr = new Date(pay.payment_date).toISOString().split('T')[0];
        setPaymentForm({
            amount: pay.amount,
            date: dateStr,
            notes: pay.notes || '',
            method: pay.payment_method || 'Cash'
        });
    };

    const handleDeletePayment = async (payId: number) => {
        if (!confirm('Are you sure you want to delete this payment record? This will adjust the invoice balance.')) return;
        if (!selectedInvoiceId) return;

        try {
            const res = await fetch(`/api/admin/invoices/${selectedInvoiceId}/payments/${payId}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (res.ok) {
                alert('Payment deleted successfully.');
                // Update Invoice List
                setInvoices(prev => prev.map(inv => inv.id === selectedInvoiceId ? {
                    ...inv,
                    status: data.newStatus,
                    advance_received: data.newPaid
                } : inv));

                // Refresh History
                setPaymentHistory(prev => prev.filter(p => p.id !== payId));
            } else {
                alert('Failed to delete: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting payment:', error);
        }
    };

    const handleSendReceipt = async (payId: number) => {
        if (!selectedInvoiceId) return;
        if (!confirm('Send payment receipt to customer?')) return;
        try {
            const res = await fetch(`/api/admin/invoices/${selectedInvoiceId}/payments/${payId}/send`, { method: 'POST' });
            if (res.ok) {
                alert('Receipt sent successfully! (Sent to rishadpnpm@gmail.com for testing)');
            } else {
                const data = await res.json();
                alert('Failed to send: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error sending receipt');
        }
    };

    const handlePrintReceipt = (pay: any) => {
        // Find invoice details
        const inv = invoices.find(i => i.id === selectedInvoiceId);
        if (!inv) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups');
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Receipt #${pay.id}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; }
                        .receipt-box { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        h2 { color: #0c86ea; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        td { padding: 10px; border-bottom: 1px solid #eee; }
                        .label { color: #666; }
                        .value { text-align: right; font-weight: bold; }
                        .amount { font-size: 1.5em; color: #16a34a; }
                    </style>
                </head>
                <body>
                    <div class="receipt-box">
                        <div class="header">
                            <h2>PAYMENT RECEIPT</h2>
                            <p>Bizz Co Hub</p>
                        </div>
                        <p><strong>Customer:</strong> ${inv.customer_name}</p>
                        <p><strong>Invoice #:</strong> ${inv.invoice_no}</p>
                        
                        <table>
                            <tr><td class="label">Date</td><td class="value">${new Date(pay.payment_date).toLocaleDateString()}</td></tr>
                            <tr><td class="label">Method</td><td class="value">${pay.payment_method || '-'}</td></tr>
                            <tr><td class="label">Reference</td><td class="value">${pay.notes || '-'}</td></tr>
                            <tr><td class="label">Amount Paid</td><td class="value amount">$${Number(pay.amount).toFixed(2)}</td></tr>
                        </table>

                        <div style="margin-top: 30px; text-align: center; font-size: 0.8em; color: #999;">
                             <p>Total Invoice: $${Number(inv.total_amount).toFixed(2)} | Balance Due: $${(Number(inv.total_amount) - Number(inv.advance_received)).toFixed(2)}</p>
                             <p>Thank you for your business!</p>
                        </div>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handlePrint = async (id: number) => {
        try {
            // Fetch Data
            const res = await fetch(`/api/admin/invoices/${id}`);
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const data = await res.json();
            const { invoice, items } = data;

            // Generate HTML
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Please allow popups to print');
                return;
            }

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice ${invoice.invoice_no}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                        body {
                            font-family: 'Inter', sans-serif;
                            color: #1f2937;
                            margin: 0;
                            padding: 0;
                            background: white;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .invoice-container {
                            width: 210mm;
                            min-height: 297mm;
                            padding: 5mm;
                            margin: 0 auto;
                            background: white;
                            box-sizing: border-box;
                            position: relative;
                        }
                        @media print {
                            body {
                                background: white;
                            }
                            .invoice-container {
                                width: 100%;
                                margin: 0;
                                padding: 5mm;
                                border: none;
                                box-shadow: none;
                            }
                            @page {
                                size: A4;
                                margin: 0;
                            }
                        }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                        th { 
                            background-color: #f8fafc !important; 
                            -webkit-print-color-adjust: exact; 
                            padding: 1rem; 
                            text-align: left; 
                            font-size: 0.8rem; 
                            color: #64748b; 
                            font-weight: 600; 
                            border-bottom: 1px solid #e2e8f0;
                        }
                        td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                         <!-- Header -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; position: relative;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                    <img src="${window.location.origin}/icon/nav-logo.png" alt="Logo" style="width: 30px; height: auto;" />
                                    <h1 style="margin: 0; font-size: 1.8rem; color: #0c86eaff; font-weight: 700;">Bizz Co Hub</h1>
                                </div>
                                <p style="margin: 0; color: #0c86eaff; font-size: 0.8rem;">Professional Solutions for Modern Business</p>
                            </div>
                            
                            ${invoice.is_taxable ? `
                                <div style="position: absolute; left: 50%; transform: translateX(-50%); top: 10px; color: #0c86eaff; font-weight: 500;">
                                    TAX : 123456789123456
                                </div>
                            ` : ''}

                            <div>
                                <h1 style="margin: 0; font-size: 2.5rem; color: #0c86eaff; letter-spacing: 1px; font-weight: 700;">INVOICE</h1>
                            </div>
                        </div>

                        <!-- Bill To & Meta -->
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3rem;">
                            <div style="max-width: 50%;">
                                <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem;">Bill To</h3>
                                <div style="font-size: 0.95rem; font-weight: 600; color: #000;">${invoice.customer_name}</div>
                                <div style="white-space: pre-line; color: #374151; font-size: 0.9rem; line-height: 1.4;">${invoice.customer_address || ''}</div>
                                ${invoice.customer_email ? `<div style="font-size: 0.9rem;">${invoice.customer_email}</div>` : ''}
                                ${invoice.customer_phone ? `<div style="font-size: 0.9rem;">${invoice.customer_phone}</div>` : ''}
                            </div>
                            <div style="text-align: right; min-width: 200px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-size: 0.9rem;">Invoice #:</span>
                                    <span style="font-size: 0.9rem; font-weight: 600;">${invoice.invoice_no}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-size: 0.9rem;">Date:</span>
                                    <span style="font-size: 0.9rem; font-weight: 500;">${new Date(invoice.created_date).toLocaleDateString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-size: 0.9rem;">Due Date:</span>
                                    <span style="font-size: 0.9rem; font-weight: 500;">${new Date(invoice.due_date).toLocaleDateString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 0.9rem;">Payment Type:</span>
                                    <span style="font-size: 0.9rem; font-weight: 500;">${invoice.payment_type}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Items Table -->
                        <table>
                            <thead>
                                <tr>
                                    <th>Job Description</th>
                                    <th style="text-align: center;">Qty</th>
                                    <th style="text-align: center;">Cost</th>
                                    <th style="text-align: center;">Discount</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((item: any) => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td style="text-align: center;">${item.quantity}</td>
                                        <td style="text-align: center;">${Number(item.unit_price).toFixed(0)}</td>
                                        <td style="text-align: center;">${Number(item.discount).toFixed(0)}</td>
                                        <td style="text-align: right;">${Number(item.total).toFixed(0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <!-- Footer -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="max-width: 45%;">
                                <h4 style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem;">Terms and Conditions</h4>
                                <p style="font-size: 0.8rem; color: #6b7280; margin-bottom: 1rem;">Please pay within 7 days from the date of invoice.</p>
                                
                                <h4 style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem;">Notes</h4>
                                ${invoice.notes ? `<p style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">${invoice.notes}</p>` : ''}
                                <p style="font-size: 0.8rem; color: #6b7280;">Please quote invoice number when remitting funds.</p>
                            </div>

                            <div style="width: 300px;">
                                ${(invoice.is_discountable || invoice.is_taxable) ? `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #4b5563;">
                                        <span>Sub Total</span>
                                        <span>$${Number(invoice.sub_total).toFixed(0)}</span>
                                    </div>
                                ` : ''}

                                ${invoice.is_taxable ? `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #4b5563;">
                                        <span>VAT (5%)</span>
                                        <span>$${Number(invoice.tax_amount).toFixed(0)}</span>
                                    </div>
                                ` : ''}

                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700; color: #ea580c; border-top: 1px solid #e5e7eb; padding-top: 0.5rem;">
                                    <span>Total Amount</span>
                                    <span>$${Number(invoice.total_amount).toFixed(0)}</span>
                                </div>

                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #4b5563;">
                                    <span>Advance Paid</span>
                                    <span>$${Number(invoice.advance_received || 0).toFixed(0)}</span>
                                </div>

                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.9rem; font-weight: 700; color: #dc2626;">
                                    <span>Balance Due</span>
                                    <span>$${(Number(invoice.total_amount) - Number(invoice.advance_received || 0)).toFixed(0)}</span>
                                </div>

                                <div style="font-size: 0.8rem; color: #9ca3af; text-align: right; font-style: italic;">
                                    Amount in Words : Dollar ${Number(invoice.total_amount)} Only
                                </div>
                            </div>
                        </div>

                         <!-- Signature -->
                        <div style="margin-top: 4rem; text-align: right;">
                            <div style="display: inline-block; text-align: center;">
                                <div style="width: 150px; border-bottom: 1px solid #000; margin-bottom: 0.5rem;"></div>
                                <h5 style="margin: 0; font-size: 0.9rem; font-weight: 700;">Muhammed Rishad</h5>
                                <p style="margin: 0; font-size: 0.8rem; color: #6b7280;">Assistant Manager</p>
                            </div>
                        </div>

                        <!-- Bottom Branding -->
                        <div style="position: absolute; bottom: 10mm; left: 0; width: 100%; text-align: center;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <img src="${window.location.origin}/icon/nav-logo.png" alt="Logo" style="width: 24px; height: auto;" />
                                <h3 style="margin: 0; font-size: 1.2rem; color: #0c86eaff;">Bizz Co Hub</h3>
                            </div>
                            <div style="font-size: 0.8rem; color: #6b7280;">
                                Professional Solutions for Modern Business
                            </div>
                        </div>

                    </div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();

        } catch (error) {
            console.error('Error printing:', error);
            alert('Failed to print invoice');
        }
    };

    const handleSent = async (id: number) => {
        const inv = invoices.find(i => i.id === id);
        if (!inv) return;

        if (!inv.customer_email) {
            alert('This invoice does not have a customer email associated with it.');
            return;
        }

        if (!confirm(`Send Invoice #${inv.invoice_no} to ${inv.customer_email}?`)) return;

        try {
            // Optimistic feedback? No, wait for result.
            const res = await fetch(`/api/admin/invoices/${id}/send`, { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                alert('Invoice email sent successfully! (Sent to rishadpnpm@gmail.com for testing)');
                // Refresh list to show 'Sent' status if backend updated it
                // fetching invoices again or updating state locally
                setInvoices(prev => prev.map(item => item.id === id ? { ...item, status: 'Sent' } : item));
            } else {
                alert('Failed to send invoice: ' + data.error);
            }
        } catch (error) {
            console.error('Error sending invoice:', error);
            alert('An error occurred while sending the invoice.');
        }
    };

    // Refactored Confirm Action
    const confirmAction = async () => {
        const { id, newStatus } = confirmationModal;
        if (!id || !newStatus) return;

        setConfirmationModal({ show: false, id: null, newStatus: null });

        if (newStatus === 'DELETE') {
            // Optimistic Delete
            setInvoices(prev => prev.filter(i => i.id !== id));
            try {
                const res = await fetch(`/api/admin/invoices/${id}`, { method: 'DELETE' });
                if (!res.ok) {
                    alert('Failed to delete invoice');
                    // Revert (fetch)
                    // ... fetchInvoices() logic reuse issues if not pulled out. Warning.
                }
            } catch (e) {
                console.error(e);
                alert('Error deleting invoice');
            }
        } else {
            // Status Update
            confirmStatusChange();
        }
    };

    return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>All Invoices</h2>
                <button
                    onClick={() => setActiveSection('invoicing-new')}
                    style={{
                        background: '#ea580c',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    + New Invoice
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Invoice #</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Customer</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Amount</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                No invoices found. Create a new invoice to get started.
                            </td>
                        </tr>
                    ) : (
                        invoices.map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem', fontWeight: 500, color: '#111827' }}>{inv.invoice_no}</td>
                                <td style={{ padding: '1rem', color: '#4b5563' }}>{new Date(inv.created_date).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', color: '#4b5563' }}>{inv.customer_name}</td>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>${Number(inv.total_amount).toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <select
                                        value={inv.status}
                                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                                        style={{
                                            padding: '0.25rem 2rem 0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            backgroundColor:
                                                inv.status === 'Paid' ? '#dcfce7' :
                                                    inv.status === 'Overdue' ? '#fee2e2' :
                                                        inv.status === 'Cancelled' ? '#f1f5f9' :
                                                            inv.status === 'Draft' ? '#f3f4f6' :
                                                                inv.status === 'Credit' ? '#e0e7ff' :
                                                                    inv.status === 'Partial' ? '#ffedd5' : '#fef3c7',
                                            color:
                                                inv.status === 'Paid' ? '#166534' :
                                                    inv.status === 'Overdue' ? '#991b1b' :
                                                        inv.status === 'Cancelled' ? '#64748b' :
                                                            inv.status === 'Draft' ? '#4b5563' :
                                                                inv.status === 'Credit' ? '#3730a3' :
                                                                    inv.status === 'Partial' ? '#9a3412' : '#92400e',
                                            border: 'none',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            appearance: 'none',
                                            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 0.7rem top 50%',
                                            backgroundSize: '0.65em auto'
                                        }}
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Credit">Credit</option>
                                        <option value="Partial">Partial Payment</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Overdue">Overdue</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            title="Edit"
                                            onClick={() => onEdit(inv)}
                                            style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className="fas fa-edit" style={{ fontSize: '0.8rem' }}></i>
                                        </button>
                                        <button
                                            title="View"
                                            onClick={() => handleView(inv.id)}
                                            style={{ border: 'none', background: '#f5f3ff', color: '#8b5cf6', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className="fas fa-eye" style={{ fontSize: '0.8rem' }}></i>
                                        </button>
                                        <button
                                            title="Delete"
                                            onClick={() => handleDelete(inv.id)}
                                            style={{ border: 'none', background: '#fef2f2', color: '#ef4444', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className="fas fa-trash" style={{ fontSize: '0.8rem' }}></i>
                                        </button>
                                        <button
                                            title="Print"
                                            onClick={() => handlePrint(inv.id)}
                                            style={{ border: 'none', background: '#fff7ed', color: '#f97316', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className="fas fa-print" style={{ fontSize: '0.8rem' }}></i>
                                        </button>
                                        <button
                                            title="Sent"
                                            onClick={() => handleSent(inv.id)}
                                            style={{ border: 'none', background: '#f0fdf4', color: '#16a34a', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className="fas fa-paper-plane" style={{ fontSize: '0.8rem' }}></i>
                                        </button>
                                        <button
                                            title="Record Payment"
                                            onClick={() => handlePayment(inv)}
                                            style={{ border: 'none', background: '#ecfdf5', color: '#059669', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className="fas fa-hand-holding-usd" style={{ fontSize: '0.8rem' }}></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Confirmation Modal */}
            {
                confirmationModal.show && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white', padding: '2rem', borderRadius: '12px', width: '400px', maxWidth: '90%',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                                {confirmationModal.newStatus === 'DELETE' ? 'Delete Invoice' : 'Confirm Status Change'}
                            </h3>
                            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                {confirmationModal.newStatus === 'DELETE'
                                    ? 'Are you sure you want to delete this invoice? This action cannot be undone.'
                                    : <span>Are you sure you want to change status to <strong style={{ color: '#000' }}>{confirmationModal.newStatus}</strong>?</span>}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button onClick={closeConfirmationModal}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button onClick={confirmAction}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: confirmationModal.newStatus === 'DELETE' ? '#dc2626' : '#ea580c', color: 'white', cursor: 'pointer' }}>
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Modal */}
            {
                showViewModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
                        overflowY: 'auto', padding: '2rem 0'
                    }}>
                        <div style={{
                            background: 'white',
                            width: '210mm',
                            maxWidth: '95%',
                            minHeight: '297mm',
                            margin: '0 auto',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            display: 'flex', flexDirection: 'column'
                        }}>
                            {loadingDetails ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>Loading details...</div>
                            ) : viewData ? (
                                <div style={{ padding: '3rem', color: '#1f2937', fontFamily: "'Inter', sans-serif" }}>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        style={{
                                            position: 'absolute', top: '1rem', right: '1rem',
                                            background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280'
                                        }}
                                    >
                                        &times;
                                    </button>

                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <img src="/icon/nav-logo.png" alt="Logo" style={{ width: '30px', height: 'auto' }} />
                                                <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0c86eaff', fontWeight: 700 }}>Bizz Co Hub</h1>
                                            </div>
                                            <p style={{ margin: 0, color: '#0c86eaff', fontSize: '0.8rem' }}>Professional Solutions for Modern Business</p>
                                        </div>

                                        {viewData.invoice.is_taxable && (
                                            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '10px', color: '#0c86eaff', fontWeight: 500 }}>
                                                TAX : 123456789123456
                                            </div>
                                        )}

                                        <div>
                                            <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#0c86eaff', letterSpacing: '1px', fontWeight: 700 }}>INVOICE</h1>
                                        </div>
                                    </div>

                                    {/* Bill To & Meta */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                                        <div style={{ maxWidth: '50%' }}>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>Bill To</h3>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000' }}>{viewData.invoice.customer_name}</div>
                                            <div style={{ whiteSpace: 'pre-line', color: '#374151', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                {viewData.invoice.customer_address}
                                            </div>
                                            {viewData.invoice.customer_email && <div style={{ fontSize: '0.9rem' }}>{viewData.invoice.customer_email}</div>}
                                            {viewData.invoice.customer_phone && <div style={{ fontSize: '0.9rem' }}>{viewData.invoice.customer_phone}</div>}
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '200px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.9rem' }}>Invoice #:</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewData.invoice.invoice_no}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.9rem' }}>Date:</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(viewData.invoice.created_date).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.9rem' }}>Due Date:</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(viewData.invoice.due_date).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.9rem' }}>Payment Type:</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{viewData.invoice.payment_type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <table style={{ width: '100%', marginBottom: '3rem', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, border: 'none' }}>Job Description</th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, border: 'none' }}>Qty</th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, border: 'none' }}>Cost</th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, border: 'none' }}>Discount</th>
                                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, border: 'none' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewData.items.map((item: any) => (
                                                <tr key={item.id}>
                                                    <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{item.description}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{item.quantity}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{Number(item.unit_price).toFixed(0)}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{Number(item.discount).toFixed(0)}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{Number(item.total).toFixed(0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Footer Section */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        {/* Left: Terms & Notes */}
                                        <div style={{ maxWidth: '45%' }}>
                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Terms and Conditions</h4>
                                            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>Please pay within 7 days from the date of invoice.</p>

                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Notes</h4>
                                            {viewData.invoice.notes && (
                                                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>{viewData.invoice.notes}</p>
                                            )}
                                            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Please quote invoice number when remitting funds.</p>
                                        </div>

                                        {/* Right: Totals */}
                                        <div style={{ width: '300px' }}>


                                            {(viewData.invoice.is_discountable || viewData.invoice.is_taxable) && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                                    <span>Sub Total</span>
                                                    <span>${Number(viewData.invoice.sub_total).toFixed(0)}</span>
                                                </div>
                                            )}

                                            {viewData.invoice.is_taxable && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                                    <span>VAT (5%)</span>
                                                    <span>${Number(viewData.invoice.tax_amount).toFixed(0)}</span>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, color: '#ea580c', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                                                <span>Total Amount</span>
                                                <span>${Number(viewData.invoice.total_amount).toFixed(0)}</span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                                <span>Advance Paid</span>
                                                <span>${Number(viewData.invoice.advance_received || 0).toFixed(0)}</span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
                                                <span>Balance Due</span>
                                                <span>${(Number(viewData.invoice.total_amount) - Number(viewData.invoice.advance_received || 0)).toFixed(0)}</span>
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'right', fontStyle: 'italic' }}>
                                                Amount in Words : Dollar {Number(viewData.invoice.total_amount)} Only
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signature */}
                                    <div style={{ marginTop: '4rem', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-block', textAlign: 'center' }}>
                                            <div style={{ width: '150px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                                            <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Muhammed Rishad</h5>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Assistant Manager</p>
                                        </div>
                                    </div>

                                    {/* Bottom Branding */}
                                    <div style={{ position: 'absolute', bottom: '2rem', left: 0, width: '100%', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <img src="/icon/nav-logo.png" alt="Logo" style={{ width: '24px', height: 'auto' }} />
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0c86eaff' }}>Bizz Co Hub</h3>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                            Professional Solutions for Modern Business
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div style={{ padding: '2rem' }}>Error loading data</div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Payment Modal */}
            {
                showPaymentModal && selectedInvoiceId && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white', padding: '2rem', borderRadius: '12px', width: '600px', maxWidth: '90%',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                                    {editingPaymentId ? 'Edit Payment' : 'Record Partial Payment'}
                                </h3>
                                <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                            </div>

                            {/* Invoice Info Context */}
                            {(() => {
                                const inv = invoices.find(i => i.id === selectedInvoiceId);
                                const total = Number(inv?.total_amount || 0);
                                const paid = Number(inv?.advance_received || 0);
                                const balance = total - paid;

                                return (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Amount</div>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>${total.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Paid So Far</div>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#16a34a' }}>${paid.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Balance Due</div>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#dc2626' }}>${balance.toFixed(2)}</div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Payment Entry Form */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Amount</label>
                                    <input
                                        type="number"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Payment Date</label>
                                    <input
                                        type="date"
                                        value={paymentForm.date}
                                        onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Notes / Reference</label>
                                <input
                                    type="text"
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    placeholder="e.g. Bank Transfer Ref: #12345"
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                {editingPaymentId && (
                                    <button
                                        onClick={() => {
                                            setEditingPaymentId(null);
                                            setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', method: 'Cash' });
                                        }}
                                        style={{
                                            width: '100%', padding: '0.75rem', background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db',
                                            borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                                <button
                                    onClick={submitPayment}
                                    style={{
                                        width: '100%', padding: '0.75rem', background: '#ea580c', color: 'white', border: 'none',
                                        borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    {editingPaymentId ? 'Update Payment' : 'Record Payment'}
                                </button>
                            </div>

                            {/* History Table */}
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>Payment History</h4>
                            {loadingPayments ? (
                                <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading history...</div>
                            ) : paymentHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No payments recorded yet.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Notes</th>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Amount</th>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map((pay: any) => (
                                            <tr key={pay.id}>
                                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', color: '#4b5563' }}>{new Date(pay.payment_date).toLocaleDateString()}</td>
                                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', color: '#4b5563' }}>{pay.notes || '-'}</td>
                                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', fontWeight: 500, textAlign: 'right' }}>${Number(pay.amount).toFixed(2)}</td>
                                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                        <button title="Print Receipt" onClick={() => handlePrintReceipt(pay)} style={{ border: 'none', background: '#fff7ed', color: '#f97316', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-print"></i></button>
                                                        <button title="Email Receipt" onClick={() => handleSendReceipt(pay.id)} style={{ border: 'none', background: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-paper-plane"></i></button>
                                                        <button title="Edit" onClick={() => handleEditPayment(pay)} style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-edit"></i></button>
                                                        <button title="Delete" onClick={() => handleDeletePayment(pay.id)} style={{ border: 'none', background: '#fef2f2', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
        </div>
    );
}
