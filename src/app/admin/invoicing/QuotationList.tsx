import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../shared/ConfirmModal';

export default function QuotationList({ setActiveSection, onEdit }: { setActiveSection: (section: string) => void, onEdit: (quotation: any) => void }) {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- View Modal State ---
    const [viewData, setViewData] = useState<{ quotation: any, items: any[] } | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    React.useEffect(() => {
        const fetchQuotations = async () => {
            try {
                const response = await fetch('/api/admin/quotations', { cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json();
                    setQuotations(data.quotations || []);
                }
            } catch (error) {
                console.error('Error fetching quotations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuotations();
        const interval = setInterval(fetchQuotations, 600000); // 10 minutes
        return () => clearInterval(interval);
    }, []);

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

    const handleStatusChange = (id: number, newStatus: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Status Change',
            message: <span>Are you sure you want to change status to <strong>{newStatus}</strong>?</span>,
            type: 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                // Optimistic update
                setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));

                try {
                    const response = await fetch(`/api/admin/quotations/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });

                    if (!response.ok) {
                        console.error('Failed to update status');
                    }
                } catch (error) {
                    console.error('Error updating status:', error);
                }
            }
        });
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    // --- Action Handlers ---
    const handleView = async (id: number) => {
        setLoadingDetails(true);
        setShowViewModal(true);
        try {
            const res = await fetch(`/api/admin/quotations/${id}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setViewData(data);
            } else {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Failed to fetch quotation details',
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                setShowViewModal(false);
            }
        } catch (error) {
            console.error(error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Error fetching details',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            setShowViewModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDelete = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Quotation',
            message: 'Are you sure you want to delete this quotation? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setQuotations(prev => prev.filter(q => q.id !== id));
                try {
                    const res = await fetch(`/api/admin/quotations/${id}`, { method: 'DELETE' });
                    if (!res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Failed to delete quotation',
                            type: 'danger',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (e) { console.error(e); }
            }
        });
    };

    const handlePrint = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/quotations/${id}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch quotation details');
            const data = await res.json();
            const { quotation, items } = data;

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Please allow popups to print',
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
                    <title>Quotation ${quotation.quotation_no}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                        body { font-family: 'Inter', sans-serif; color: #1f2937; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .invoice-container { width: 210mm; min-height: 297mm; padding: 5mm; margin: 0 auto; background: white; box-sizing: border-box; position: relative; }
                        @media print { body { background: white; } .invoice-container { width: 100%; margin: 0; padding: 5mm; border: none; box-shadow: none; } @page { size: A4; margin: 0; } }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                        th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; padding: 1rem; text-align: left; font-size: 0.8rem; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
                        td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                         <!-- Header -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 2px solid #1A2244; padding-bottom: 0.5rem; position: relative;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.1rem; margin-bottom: 0.1rem;">
                                    <img src="${window.location.origin}/icon/nav-logo.png" alt="Logo" style="width: 40px; height: auto;" />
                                    <h1 style="margin: 0; font-size: 2rem; color: #1A2244; font-weight: 700; font-family: 'Square721 BT Roman', sans-serif;">BIZZ CO HUB LLC</h1>
                                </div>
                                <p style="margin: 0; color: #1A2244; font-size: 0.7rem;">Premium Refurbished Electronics and Professional IT Services</p>
                                <p style="margin: 0; color: #1A2244; font-size: 0.7rem;">Sharjah Media City, Sharjah, UAE</p>
                                <p style="margin: 0; color: #1A2244; font-size: 0.7rem;">Ph: +971 52 714 6582 | +971 55 614 8279</p>
                            </div>
                            


                             <div>
                                <h1 style="margin: 0; font-size: 2.5rem; color: #1A2244; letter-spacing: 1px; font-weight: 700;">QUOTATION INVOICE</h1>
                            </div>
                        </div>

                        <!-- Bill To & Meta -->
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3rem;">
                            <div style="max-width: 50%;">
                                <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem;">Bill To</h3>
                                <div style="font-size: 0.95rem; font-weight: 600; color: #000;">${quotation.customer_name}</div>
                                <div style="white-space: pre-line; color: #374151; font-size: 0.9rem; line-height: 1.4;">${quotation.customer_address || ''}</div>
                                ${quotation.customer_email ? `<div style="font-size: 0.9rem;">${quotation.customer_email}</div>` : ''}
                                ${quotation.customer_phone ? `<div style="font-size: 0.9rem;">${quotation.customer_phone}</div>` : ''}
                            </div>
                            <div style="text-align: right; min-width: 200px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-size: 0.9rem;">Date:</span>
                                    <span style="font-size: 0.9rem; font-weight: 500;">${new Date(quotation.created_date).toLocaleDateString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-size: 0.9rem;">Valid Until:</span>
                                    <span style="font-size: 0.9rem; font-weight: 500;">${new Date(quotation.due_date).toLocaleDateString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 0.9rem;">Payment Type:</span>
                                    <span style="font-size: 0.9rem; font-weight: 500;">${quotation.payment_type}</span>
                                </div>
                                ${quotation.is_taxable ? `
                                    <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                                        <span style="font-size: 0.9rem;">Tax ID:</span>
                                        <span style="font-size: 0.9rem; font-weight: 500;">123456789123456</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Items Table -->
                        <table>
                            <thead>
                                 <tr>
                                    <th style="color: #1A2244;">Job Description</th>
                                    <th style="text-align: center; color: #1A2244;">Qty</th>
                                    <th style="text-align: center; color: #1A2244;">Cost</th>
                                    <th style="text-align: center; color: #1A2244;">Discount</th>
                                    <th style="text-align: right; color: #1A2244;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((item: any) => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td style="text-align: center;">${item.quantity}</td>
                                        <td style="text-align: center;">AED ${Number(item.unit_price).toFixed(0)}</td>
                                        <td style="text-align: center;">AED ${Number(item.discount).toFixed(0)}</td>
                                        <td style="text-align: right;">AED ${Number(item.total).toFixed(0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <!-- Footer -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                             <div style="max-width: 45%;">
                                <h4 style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem; color: #1A2244;">Terms and Conditions</h4>
                                <p style="font-size: 0.8rem; color: #6b7280; margin-bottom: 1rem;">Valid for 7 days from the date of quotation.</p>
                            </div>

                            <div style="width: 300px;">
                                ${(quotation.is_discountable || quotation.is_taxable) ? `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #4b5563;">
                                        <span>Sub Total</span>
                                        <span>AED ${Number(quotation.sub_total).toFixed(0)}</span>
                                    </div>
                                ` : ''}

                                ${quotation.is_taxable ? `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #4b5563;">
                                        <span>VAT (5%)</span>
                                        <span>AED ${Number(quotation.tax_amount).toFixed(0)}</span>
                                    </div>
                                ` : ''}

                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700; color: #ea580c; border-top: 1px solid #e5e7eb; padding-top: 0.5rem;">
                                    <span>Total Amount</span>
                                    <span>AED ${Number(quotation.total_amount).toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Signature -->
                        <div style="margin-top: 4rem; text-align: right;">
                            <div style="display: inline-block; text-align: center;">
                                 <div style="width: 150px; border-bottom: 1px solid #000; margin-bottom: 0.5rem;"></div>
                                <h5 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #1A2244;">Muhammed Rishad</h5>
                                <p style="margin: 0; font-size: 0.8rem; color: #6b7280;">Accountant</p>
                            </div>
                        </div>

                        <!-- Bottom Branding -->
                        <div style="position: absolute; bottom: 10mm; left: 0; width: 100%; text-align: center;">
                             <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <img src="${window.location.origin}/icon/nav-logo.png" alt="Logo" style="width: 24px; height: auto;" />
                                <h3 style="margin: 0; font-size: 1.2rem; color: #1A2244; font-family: 'Square721 BT Roman', sans-serif;">BIZZ CO HUB LLC</h3>
                            </div>
                            <div style="font-size: 0.8rem; color: #6b7280;">
                                Premium Refurbished Electronics and Professional IT Services
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
            console.error(error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to print',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleSent = async (id: number) => {
        const inv = quotations.find(q => q.id === id);
        if (!inv) return;

        if (!inv.customer_email) {
            setConfirmModal({
                isOpen: true,
                title: 'No Email',
                message: 'This quotation does not have a customer email associated with it.',
                type: 'info',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Send Quotation',
            message: `Send Quotation #${inv.quotation_no} to ${inv.customer_email}?`,
            type: 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`/api/admin/quotations/${id}/send`, { method: 'POST' });
                    const data = await res.json();

                    if (res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Success',
                            message: 'Quotation email sent successfully! (Sent to rishadpnpm@gmail.com for testing)',
                            type: 'success',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                        // Optionally update status to 'Sent' if relevant, or just notify user
                    } else {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Failed to send quotation: ' + data.error,
                            type: 'danger',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    console.error('Error sending quotation:', error);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'An error occurred while sending the quotation.',
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
    };

    const handleConvert = async (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Convert to Invoice',
            message: 'Are you sure you want to convert this quotation to an invoice?',
            type: 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`/api/admin/quotations/${id}/convert`, { method: 'POST' });
                    const data = await res.json();

                    if (res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Success',
                            message: `Quotation converted successfully! New Invoice: ${data.invoiceNo}`,
                            type: 'success',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                        // Update local state to show 'Converted'
                        setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: 'Converted' } : q));
                        // Optionally redirect to invoices or show link
                    } else {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Failed to convert: ' + data.error,
                            type: 'danger',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    console.error('Error converting:', error);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'An error occurred during conversion',
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
    };

    return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>All Quotations</h2>
                <button
                    onClick={() => setActiveSection('create-quotation')}
                    style={{ background: '#ea580c', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                >
                    + New Quotation
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Quotation #</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Customer</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Amount</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontWeight: 600 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {quotations.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No quotations found. Create a new quotation to get started.</td></tr>
                    ) : (
                        quotations.map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem', fontWeight: 500, color: '#111827' }}>{inv.quotation_no}</td>
                                <td style={{ padding: '1rem', color: '#4b5563' }}>{new Date(inv.created_date).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', color: '#4b5563' }}>{inv.customer_name}</td>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>AED {Number(inv.total_amount).toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <select
                                        value={inv.status}
                                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                                        style={{
                                            padding: '0.25rem 2rem 0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500, border: 'none', cursor: 'pointer', outline: 'none', appearance: 'none',
                                            backgroundColor:
                                                inv.status === 'Accepted' ? '#dcfce7' :
                                                    inv.status === 'Rejected' ? '#fee2e2' :
                                                        inv.status === 'Converted' ? '#dbeafe' : '#fef3c7',
                                            color:
                                                inv.status === 'Accepted' ? '#166534' :
                                                    inv.status === 'Rejected' ? '#991b1b' :
                                                        inv.status === 'Converted' ? '#1e40af' : '#92400e',
                                            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65em auto'
                                        }}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Accepted">Accepted</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Converted">Converted</option>
                                    </select>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button title="Edit" onClick={() => onEdit(inv)} style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-edit" style={{ fontSize: '0.8rem' }}></i></button>
                                        <button title="View" onClick={() => handleView(inv.id)} style={{ border: 'none', background: '#f5f3ff', color: '#8b5cf6', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-eye" style={{ fontSize: '0.8rem' }}></i></button>
                                        <button title="Delete" onClick={() => handleDelete(inv.id)} style={{ border: 'none', background: '#fef2f2', color: '#ef4444', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-trash" style={{ fontSize: '0.8rem' }}></i></button>
                                        <button title="Print" onClick={() => handlePrint(inv.id)} style={{ border: 'none', background: '#fff7ed', color: '#f97316', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-print" style={{ fontSize: '0.8rem' }}></i></button>
                                        <button title="Send" onClick={() => handleSent(inv.id)} style={{ border: 'none', background: '#f0fdf4', color: '#16a34a', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-paper-plane" style={{ fontSize: '0.8rem' }}></i></button>
                                        {inv.status !== 'Converted' && (
                                            <button title="Convert to Invoice" onClick={() => handleConvert(inv.id)} style={{ border: 'none', background: '#e0e7ff', color: '#4338ca', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-file-invoice" style={{ fontSize: '0.8rem' }}></i></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />

            {/* View Modal */}
            {showViewModal && viewData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}>
                    <div style={{ background: 'white', width: '210mm', minHeight: '297mm', margin: '0 auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }}>

                        <div style={{ padding: '1rem', color: '#1f2937', fontFamily: "'Inter', sans-serif" }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '2px solid #1A2244', paddingBottom: '0.5rem', position: 'relative' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginBottom: '0.1rem' }}>
                                        <img src="/icon/nav-logo.png" alt="Logo" style={{ width: '40px', height: 'auto' }} />
                                        <h1 style={{ margin: 0, fontSize: '2rem', color: '#1A2244', fontWeight: 700, fontFamily: "'Square721 BT Roman', sans-serif" }}>BIZZ CO HUB LLC</h1>
                                    </div>
                                    <p style={{ margin: 0, color: '#1A2244', fontSize: '0.7rem' }}>Premium Refurbished Electronics and Professional IT Services</p>
                                    <p style={{ margin: 0, color: '#1A2244', fontSize: '0.7rem' }}>Sharjah Media City, Sharjah, UAE</p>
                                    <p style={{ margin: 0, color: '#1A2244', fontSize: '0.7rem' }}>Ph: +971 52 714 6582 | +971 55 614 8279</p>
                                </div>



                                <div>
                                    <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#1A2244', letterSpacing: '1px', fontWeight: 700 }}>QUOTATION INVOICE</h1>
                                </div>
                            </div>

                            {/* Bill To */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                                <div style={{ maxWidth: '50%' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>Bill To</h3>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000' }}>{viewData.quotation.customer_name}</div>
                                    <div style={{ whiteSpace: 'pre-line', color: '#374151', fontSize: '0.9rem', lineHeight: '1.4' }}>{viewData.quotation.customer_address}</div>
                                    {viewData.quotation.customer_email && <div style={{ fontSize: '0.9rem' }}>{viewData.quotation.customer_email}</div>}
                                    {viewData.quotation.customer_phone && <div style={{ fontSize: '0.9rem' }}>{viewData.quotation.customer_phone}</div>}
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '200px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Date:</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(viewData.quotation.created_date).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Valid Until:</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(viewData.quotation.due_date).toLocaleDateString()}</span>
                                    </div>
                                    {viewData.quotation.is_taxable && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.9rem' }}>Tax ID:</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>123456789123456</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <table style={{ width: '100%', marginBottom: '3rem', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: '#1A2244', fontWeight: 600, border: 'none' }}>Job Description</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#1A2244', fontWeight: 600, border: 'none' }}>Qty</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#1A2244', fontWeight: 600, border: 'none' }}>Cost</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#1A2244', fontWeight: 600, border: 'none' }}>Discount</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: '#1A2244', fontWeight: 600, border: 'none' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewData.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{item.description}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{item.quantity}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>AED {Number(item.unit_price).toFixed(0)}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>AED {Number(item.discount).toFixed(0)}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>AED {Number(item.total).toFixed(0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ maxWidth: '45%' }}>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1A2244' }}>Terms and Conditions</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>Valid for 7 days from the date of quotation.</p>
                                </div>
                                <div style={{ width: '300px' }}>
                                    {(viewData.quotation.is_discountable || viewData.quotation.is_taxable) && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                            <span>Sub Total</span>
                                            <span>AED {Number(viewData.quotation.sub_total).toFixed(0)}</span>
                                        </div>
                                    )}
                                    {viewData.quotation.is_taxable && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                            <span>VAT (5%)</span>
                                            <span>AED {Number(viewData.quotation.tax_amount).toFixed(0)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, color: '#ea580c', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                                        <span>Total Amount</span>
                                        <span>AED {Number(viewData.quotation.total_amount).toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Signatures and Branding */}
                            <div style={{ marginTop: '4rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-block', textAlign: 'center' }}>
                                    <div style={{ width: '150px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1A2244' }}>Muhammed Rishad</h5>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Accountant</p>
                                </div>
                            </div>

                            <div style={{ position: 'absolute', bottom: '2rem', left: 0, width: '100%', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <img src="/icon/nav-logo.png" alt="Logo" style={{ width: '24px', height: 'auto' }} />
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1A2244', fontFamily: "'Square721 BT Roman', sans-serif" }}>BIZZ CO HUB LLC</h3>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    Premium Refurbished Electronics and Professional IT Services
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
