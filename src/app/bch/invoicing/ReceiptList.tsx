"use client";

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../shared/ConfirmModal';
import { ToWords } from 'to-words';
import { pdf } from '@react-pdf/renderer';
import ReceiptPDF from '../../../components/pdf/ReceiptPDF';
import { Search, Printer, Receipt, Trash2, Calendar, User, FileText, ChevronRight, Download } from 'lucide-react';

const toWords = new ToWords({
    localeCode: 'en-AE',
    converterOptions: {
        currency: true,
        ignoreDecimal: false,
        ignoreZeroCurrency: false,
        doNotAddOnly: false,
        currencyOptions: {
            name: 'AED',
            plural: 'AED',
            symbol: 'AED',
            fractionalUnit: {
                name: 'Fils',
                plural: 'Fils',
                symbol: '',
            }
        }
    }
});

interface ReceiptListProps {
    setActiveSection?: (section: string) => void;
}

export default function ReceiptList({ setActiveSection }: ReceiptListProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("direct");
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

    const [staffName, setStaffName] = useState("");
    const [staffRole, setStaffRole] = useState("");

    const fetchPayments = async () => {
        try {
            const res = await fetch(`/api/bch/payments?_t=${Date.now()}`, { cache: 'no-store' });
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

    useEffect(() => {
        const adminData = localStorage.getItem('admin_user');
        if (adminData) {
            try {
                const user = JSON.parse(adminData);
                const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '';
                setStaffName(name);
                setStaffRole(user.role || "Accountant");
            } catch (e) {
                console.error("Error parsing admin user", e);
            }
        }
        fetchPayments();
        const interval = setInterval(fetchPayments, 600000); // 10 minutes
        return () => clearInterval(interval);
    }, []);

    const handlePrintReceipt = (pay: any) => {
        const docDate = pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        const receiptId = pay.id.toString().padStart(4, '0');
        const customerName = (pay.customer_name || '').toUpperCase();

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Money Receipt - REC-${receiptId}</title>
                <style>
                    @page { size: A4 portrait; margin: 0; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
                    .receipt-container {
                        width: 100%;
                        max-width: 210mm;
                        height: 297mm;
                        padding: 5mm 5mm;
                        box-sizing: border-box;
                        background: white;
                        border: none;
                        margin: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        border-bottom: 2px solid #1A2244;
                        padding-bottom: 12px;
                        margin-bottom: 20px;
                    }
                    .company-branding h1 { margin: 0; font-size: 28px; color: #1A2244; font-weight: 800; font-family: sans-serif; }
                    .company-branding p { margin: 0; font-size: 11px; color: #1A2244; font-weight: 500; }
                    .receipt-title { text-align: right; }
                    .receipt-title h1 { margin: 0; font-size: 32px; color: #1A2244; letter-spacing: 1px; font-weight: 800; }
                    .meta-info { display: flex; justify-content: flex-end; gap: 30px; margin-top: 8px; font-size: 14px; font-weight: 700; color: #1A2244; }
                    
                    .info-row { display: flex; align-items: flex-end; gap: 15px; margin-bottom: 18px; font-size: 15px; font-weight: 500; }
                    .dotted-underline { flex: 1; border-bottom: 1px dotted #000; padding-bottom: 3px; font-weight: 700; font-size: 18px; }
                    
                    .amount-group { display: flex; align-items: center; gap: 50px; margin-bottom: 18px; }
                    .amount-label { font-size: 15px; font-weight: 500; }
                    .amount-box { border: 1.5px solid #000; padding: 6px 15px; min-width: 150px; font-weight: 800; font-size: 18px; display: flex; align-items: center; }
                    .currency { margin-right: 10px; font-size: 16px; }

                    .method-group { display: flex; align-items: center; gap: 20px; font-size: 15px; }
                    .checkbox-item { display: flex; align-items: center; gap: 8px; }
                    .checkbox { width: 22px; height: 22px; border: 1.2px solid #000; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; }

                    .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; align-items: flex-end; margin-top: 15px; margin-bottom: 10px; }
                    .received-by-wrap { display: flex; align-items: center; gap: 10px; justify-content: center; }
                    .received-by-text { font-size: 14px; font-weight: 400; text-align: left; white-space: nowrap; }
                    .sig-line { border-bottom: 1px dotted #000; width: 200px; padding-bottom: 4px; font-weight: 800; font-size: 16px; text-align: center; }
                    .auth-sig { font-size: 16px; font-weight: 700; text-align: center; }

                    .footer-note { text-align: center; font-size: 11px; opacity: 0.8; margin-top: 10px; }

                    @media print {
                        body { padding: 0; }
                        .receipt-container { border: none; box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div>
                        <div class="header">
                            <div class="company-branding">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                                    <img src="/icon/nav-logo.png" style="width: 40px; height: auto;" />
                                    <h1>BIZZ CO HUB LLC</h1>
                                </div>
                                <p>Premium Refurbished Electronics and Professional IT Services</p>
                                <p>Sharjah Media City, Sharjah, UAE</p>
                            </div>
                            <div class="receipt-title">
                                <h1>MONEY RECEIPT</h1>
                                <div class="meta-info">
                                    <span>Date: ${docDate}</span>
                                    <span>Receipt No: REC-${receiptId}</span>
                                </div>
                            </div>
                        </div>

                        <div class="info-row">
                            <span style="white-space: nowrap;">Received with thanks from</span>
                            <div class="dotted-underline">${customerName}</div>
                        </div>

                        <div class="amount-group">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <span class="amount-label">Amount</span>
                                <div class="amount-box">
                                    <span class="currency">AED</span>
                                    <span>${Number(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div class="method-group">
                                <span>By</span>
                                <div class="checkbox-item"><div class="checkbox">${pay.payment_method === 'Cash' ? '✓' : ''}</div> Cash</div>
                                <div class="checkbox-item"><div class="checkbox">${pay.payment_method === 'Cheque' ? '✓' : ''}</div> Cheque</div>
                                <div class="checkbox-item"><div class="checkbox">${pay.payment_method === 'Bank' || pay.payment_method === 'Transfer' ? '✓' : ''}</div> Bank</div>
                            </div>
                        </div>

                        <div class="info-row">
                            <div style="display: flex; flex-direction: column; font-size: 14px; line-height: 1.1; white-space: nowrap;">
                                <span>Amount in a</span>
                                <span>word</span>
                            </div>
                            <div class="dotted-underline" style="text-align: center; font-style: italic; font-weight: 600; font-size: 15px;">${toWords.convert(Number(pay.amount))}</div>
                        </div>

                        <div class="info-row">
                            <span style="white-space: nowrap;">For the purpose of</span>
                            <div class="dotted-underline" style="text-align: center; font-weight: 500; font-size: 15px;">${(pay.notes || pay.doc_no || 'Payment')}</div>
                        </div>

                        <div class="signature-section">
                            <div class="received-by-wrap">
                                <div class="received-by-text">Received By</div>
                                <div class="sig-line">${(pay.staff_name || staffName || 'Muhammed Rishad').toUpperCase()}</div>
                            </div>
                            <div class="auth-sig">Authorized Signature</div>
                        </div>
                    </div>

                    <div class="footer-note">
                        - This is a computer generated receipt, it does not need signature or stamp -
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleDownload = async (pay: any) => {
        try {
            const blob = await pdf(
                <ReceiptPDF 
                    payment={pay} 
                    staffName={staffName} 
                    logoUrl={window.location.origin + '/icon/nav-logo.png'} 
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Receipt-REC-${pay.id.toString().padStart(4, '0')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    const handleDelete = (id: number, type: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Receipt',
            message: 'Are you sure you want to delete this payment record? This will update the balance on the associated bill.',
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const payment = payments.find(p => p.id === id && p.doc_type === type);
                    if (!payment) return;

                    let endpoint = "";
                    if (type === 'direct') {
                        endpoint = `/api/bch/payments/${id}`;
                    } else {
                        const docId = type === 'invoice' ? payment.invoice_id : payment.quotation_id;
                        endpoint = type === 'invoice'
                            ? `/api/bch/invoices/${docId}/payments/${id}`
                            : `/api/bch/quotations/${docId}/payments/${id}`;
                    }

                    const res = await fetch(endpoint, { method: 'DELETE' });
                    if (res.ok) {
                        setPayments(prev => prev.filter(p => !(p.id === id && p.doc_type === type)));
                        window.dispatchEvent(new Event('dashboard-updated'));
                    }
                } catch (error) {
                    console.error('Error deleting payment:', error);
                }
            }
        });
    };

    const filteredPayments = payments.filter(p => {
        const typeMatch = filterType === 'all' || p.doc_type === filterType;
        if (!typeMatch) return false;

        return (
            p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.doc_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0 }}>All Receipts</h2>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>View and manage all payment receipts</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Filter Toggle */}
                    <div style={{ 
                        display: 'flex', 
                        background: '#f3f4f6', 
                        padding: '4px', 
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb'
                    }}>
                        {['all', 'invoice', 'quotation', 'direct'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '7px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: 'none',
                                    transition: 'all 0.2s',
                                    backgroundColor: filterType === type ? 'white' : 'transparent',
                                    color: filterType === type ? '#1A2244' : '#6b7280',
                                    boxShadow: filterType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1) === 'Direct' ? 'Receipt' : type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search Customer, Bill #..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                width: '220px',
                                fontSize: '0.9rem'
                            }}
                        />
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: '#9ca3af' }} />
                    </div>
                    {setActiveSection && (
                        <button
                            onClick={() => setActiveSection('receipts-new')}
                            style={{
                                backgroundColor: '#2563eb',
                                color: 'white',
                                padding: '0.6rem 1.25rem',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            <Receipt style={{ width: '1.1rem', height: '1.1rem' }} />
                            Add New Receipt
                        </button>
                    )}
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                        <th style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Customer</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Bill #</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Method</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Amount</th>
                        <th style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPayments.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                No receipts found.
                            </td>
                        </tr>
                    ) : (
                        filteredPayments.map(pay => (
                            <tr key={`${pay.doc_type}-${pay.id}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem', color: '#374151' }}>{new Date(pay.payment_date).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', color: '#111827', fontWeight: 500 }}>{pay.customer_name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        backgroundColor: pay.doc_type === 'invoice' ? '#eff6ff' : '#fef3c7',
                                        color: pay.doc_type === 'invoice' ? '#2563eb' : '#d97706',
                                        fontWeight: 600
                                    }}>
                                        {pay.doc_no}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#4b5563' }}>{pay.payment_method}</td>
                                <td style={{ padding: '1rem', color: '#059669', fontWeight: 700 }}>AED {Number(pay.amount).toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                        <button
                                            title="Print Receipt"
                                            onClick={() => handlePrintReceipt(pay)}
                                            style={{ border: 'none', background: '#f0fdf4', color: '#16a34a', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Printer style={{ width: '1rem', height: '1rem' }} />
                                        </button>
                                        <button
                                            title="Download PDF"
                                            onClick={() => handleDownload(pay)}
                                            style={{ border: 'none', background: '#eff6ff', color: '#2563eb', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Download style={{ width: '1rem', height: '1rem' }} />
                                        </button>
                                        <button
                                            title="Delete"
                                            onClick={() => handleDelete(pay.id, pay.doc_type)}
                                            style={{ border: 'none', background: '#fef2f2', color: '#ef4444', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />
        </div>
    );
}
