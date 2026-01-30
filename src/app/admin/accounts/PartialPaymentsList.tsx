import React, { useState, useEffect } from 'react';
import ConfirmModal from '../shared/ConfirmModal';

interface PartialPaymentsListProps {
    setActiveSection: (section: string) => void;
}

export default function PartialPaymentsList({ setActiveSection }: PartialPaymentsListProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any>(null);
    const [editForm, setEditForm] = useState({ amount: '', date: '', notes: '', method: 'Cash' });

    // View Modal State
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewData, setViewData] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
        singleButton?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/payments');
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments || []);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pay: any) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Payment',
            message: `Are you sure you want to delete this payment for Invoice ${pay.invoice_no}?`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`/api/admin/invoices/${pay.invoice_id}/payments/${pay.id}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Success',
                            message: 'Payment deleted successfully',
                            type: 'success',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                        fetchPayments(); // Refresh list
                    } else {
                        const data = await res.json();
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Failed to delete: ' + data.error,
                            type: 'danger',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    console.error('Error deleting payment:', error);
                }
            }
        });
    };

    const handleSendReceipt = async (pay: any) => {
        setConfirmModal({
            isOpen: true,
            title: 'Send Receipt',
            message: `Send receipt to ${pay.customer_name}?`,
            type: 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`/api/admin/invoices/${pay.invoice_id}/payments/${pay.id}/send`, {
                        method: 'POST'
                    });

                    if (res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Success',
                            message: 'Receipt sent successfully! (Sent to rishadpnpm@gmail.com for testing)',
                            type: 'success',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    } else {
                        const data = await res.json();
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Failed to send receipt: ' + data.error,
                            type: 'danger',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    console.error('Error sending receipt:', error);
                }
            }
        });
    };

    const handlePrintReceipt = (pay: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Please allow popups',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
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
                        <p><strong>Customer:</strong> ${pay.customer_name}</p>
                        <p><strong>Invoice #:</strong> ${pay.invoice_no}</p>
                        
                        <table>
                            <tr><td class="label">Date</td><td class="value">${new Date(pay.payment_date).toLocaleDateString()}</td></tr>
                            <tr><td class="label">Method</td><td class="value">${pay.payment_method || '-'}</td></tr>
                            <tr><td class="label">Reference</td><td class="value">${pay.notes || '-'}</td></tr>
                            <tr><td class="label">Amount Paid</td><td class="value amount">$${Number(pay.amount).toFixed(2)}</td></tr>
                        </table>
                        
                        <div style="margin-top: 30px; text-align: center; font-size: 0.8em; color: #999;">
                             <p>This receipt confirms the partial payment received.</p>
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

    const openEditModal = (pay: any) => {
        setEditingPayment(pay);
        setEditForm({
            amount: pay.amount,
            date: new Date(pay.payment_date).toISOString().split('T')[0],
            notes: pay.notes || '',
            method: pay.payment_method || 'Cash'
        });
        setShowEditModal(true);
    };

    const submitEdit = async () => {
        if (!editingPayment) return;

        try {
            const res = await fetch(`/api/admin/invoices/${editingPayment.invoice_id}/payments/${editingPayment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            const data = await res.json();

            if (res.ok) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Success',
                    message: 'Payment updated successfully',
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                setShowEditModal(false);
                setEditingPayment(null);
                fetchPayments();
            } else {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Failed to update: ' + data.error,
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Error updating payment',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleViewInvoice = async (pay: any) => {
        setLoadingDetails(true);
        setShowViewModal(true);
        try {
            const res = await fetch(`/api/admin/invoices/${pay.invoice_id}`);
            if (res.ok) {
                const data = await res.json();
                setViewData(data);
            } else {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Failed to fetch invoice details',
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                setShowViewModal(false);
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Error fetching invoice details',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            setShowViewModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Filter Logic
    const filteredPayments = payments.filter((p: any) =>
        p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="partial-payments-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Partial Payments</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search Customer or Invoice..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '300px' }}
                    />
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading payments...</div>
                ) : filteredPayments.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No payments found.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Invoice #</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Customer</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Notes</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((pay: any) => (
                                <tr key={pay.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '1rem', color: '#4b5563' }}>{new Date(pay.payment_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{pay.invoice_no}</td>
                                    <td style={{ padding: '1rem', color: '#4b5563' }}>{pay.customer_name}</td>
                                    <td style={{ padding: '1rem', color: '#6b7280' }}>{pay.payment_method}</td>
                                    <td style={{ padding: '1rem', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pay.notes || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>${Number(pay.amount).toFixed(2)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button title="View Invoice" onClick={() => handleViewInvoice(pay)} style={{ border: 'none', background: '#dbeafe', color: '#1e40af', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><i className="fas fa-eye"></i></button>
                                            <button title="Print Receipt" onClick={() => handlePrintReceipt(pay)} style={{ border: 'none', background: '#fff7ed', color: '#f97316', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><i className="fas fa-print"></i></button>
                                            <button title="Email Receipt" onClick={() => handleSendReceipt(pay)} style={{ border: 'none', background: '#f0fdf4', color: '#16a34a', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><i className="fas fa-paper-plane"></i></button>
                                            <button title="Edit" onClick={() => openEditModal(pay)} style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><i className="fas fa-edit"></i></button>
                                            <button title="Delete" onClick={() => handleDelete(pay)} style={{ border: 'none', background: '#fef2f2', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />

            {/* Edit Modal */}
            {showEditModal && editingPayment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>Edit Payment</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Amount</label>
                            <input
                                type="number"
                                value={editForm.amount}
                                onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Date</label>
                            <input
                                type="date"
                                value={editForm.date}
                                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Notes</label>
                            <input
                                type="text"
                                value={editForm.notes}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => setShowEditModal(false)}
                                style={{ width: '100%', padding: '0.75rem', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitEdit}
                                style={{ width: '100%', padding: '0.75rem', background: '#0c86ea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}
