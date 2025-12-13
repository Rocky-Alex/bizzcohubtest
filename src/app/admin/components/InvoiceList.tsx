import React, { useState } from 'react';

export default function InvoiceList({ setActiveSection }: { setActiveSection: (section: string) => void }) {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoices...</div>;
    }

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
                                                        inv.status === 'Cancelled' ? '#f3f4f6' : '#fef3c7',
                                            color:
                                                inv.status === 'Paid' ? '#166534' :
                                                    inv.status === 'Overdue' ? '#991b1b' :
                                                        inv.status === 'Cancelled' ? '#374151' : '#92400e',
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
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Overdue">Overdue</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>
                                        <i className="fas fa-ellipsis-v"></i>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Confirmation Modal */}
            {confirmationModal.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        width: '400px',
                        maxWidth: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                            Confirm Status Change
                        </h3>
                        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Are you sure you want to change the invoice status to <strong style={{ color: '#000' }}>{confirmationModal.newStatus}</strong>?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={closeConfirmationModal}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#ea580c', // Or use primary color
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
