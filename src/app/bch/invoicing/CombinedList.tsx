"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../shared/ConfirmModal';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '../../../components/pdf/InvoicePDF';
import QuotationPDF from '../../../components/pdf/QuotationPDF';
import ReceiptPDF from '../../../components/pdf/ReceiptPDF';
import { ToWords } from 'to-words';
import { exportBillsToExcel, parseBillsFromExcel } from '@/lib/xlsx-utils';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';


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

export default function CombinedList({ setActiveSection, onEditInvoice, onEditQuotation, onConvertQuotation }: {
    setActiveSection: (section: string) => void,
    onEditInvoice: (invoice: any) => void,
    onEditQuotation: (quotation: any) => void,
    onConvertQuotation?: (quotation: any, items: any[]) => void
}) {
    const router = useRouter();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);


    // --- View Modal State ---
    const [viewData, setViewData] = useState<{ document: any, items: any[], type: 'invoice' | 'quotation' } | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'invoice' | 'quotation'>('all');

    // --- Payment Modal State ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState<'invoice' | 'quotation' | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', method: 'Cash' });
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [staffName, setStaffName] = useState("");
    const [staffRole, setStaffRole] = useState("");

    React.useEffect(() => {
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
    }, []);

    React.useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const [invoicesRes, quotationsRes] = await Promise.all([
                    fetch(`/api/bch/invoices?_t=${Date.now()}`, { cache: 'no-store' }),
                    fetch(`/api/bch/quotations?_t=${Date.now()}`, { cache: 'no-store' })
                ]);

                let combined: any[] = [];

                if (invoicesRes.ok) {
                    const data = await invoicesRes.json();
                    const invoices = (data.invoices || []).map((inv: any) => ({ ...inv, documentType: 'invoice' }));
                    combined = [...combined, ...invoices];
                }

                if (quotationsRes.ok) {
                    const data = await quotationsRes.json();
                    const quotations = (data.quotations || []).map((q: any) => ({ ...q, documentType: 'quotation' }));
                    combined = [...combined, ...quotations];
                }

                combined.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
                setDocuments(combined);
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
        const interval = setInterval(fetchDocuments, 600000); // 10 minutes

        window.addEventListener('dashboard-updated', fetchDocuments);

        return () => {
            clearInterval(interval);
            window.removeEventListener('dashboard-updated', fetchDocuments);
        };
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

    const handleStatusChange = (id: number, type: 'invoice' | 'quotation', newStatus: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Status Change',
            message: <span>Are you sure you want to change status to <strong>{newStatus}</strong>?</span>,
            type: 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setDocuments(prev => prev.map(doc => (doc.id === id && doc.documentType === type) ? { ...doc, status: newStatus } : doc));

                try {
                    const endpoint = type === 'invoice' ? `/api/bch/invoices/${id}` : `/api/bch/quotations/${id}`;
                    const response = await fetch(endpoint, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });

                    if (!response.ok) {
                        console.error('Failed to update status');
                    } else {
                        window.dispatchEvent(new Event('dashboard-updated'));
                        localStorage.setItem('dashboardLastUpdated', Date.now().toString());
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
    const handleView = async (id: number, type: 'invoice' | 'quotation') => {
        setLoadingDetails(true);
        setShowViewModal(true);
        try {
            const endpoint = type === 'invoice' ? `/api/bch/invoices/${id}` : `/api/bch/quotations/${id}`;
            const res = await fetch(endpoint, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setViewData({
                    document: type === 'invoice' ? data.invoice : data.quotation,
                    items: data.items,
                    type
                });
            } else {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: `Failed to fetch ${type} details`,
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

    const handleDownload = async (docData: any, items: any[], type: 'invoice' | 'quotation' | 'receipt') => {
        try {
            if (typeof window === 'undefined') return;
            let PDFComponent;
            let filename = "Document.pdf";

            if (type === 'invoice') {
                PDFComponent = <InvoicePDF invoice={docData} items={items} logoUrl={window.location.origin + '/icon/nav-logo.png'} staffName={staffName} staffRole={staffRole} />;
                filename = `Invoice-${docData.invoice_no}.pdf`;
            } else if (type === 'quotation') {
                PDFComponent = <QuotationPDF quotation={docData} items={items} logoUrl={window.location.origin + '/icon/nav-logo.png'} staffName={staffName} staffRole={staffRole} />;
                filename = `ProformaInvoice-${docData.quotation_no}.pdf`;
            } else if (type === 'receipt') {
                PDFComponent = <ReceiptPDF payment={docData} staffName={staffName} logoUrl={window.location.origin + '/icon/nav-logo.png'} />;
                filename = `Receipt-REC-${docData.id.toString().padStart(4, '0')}.pdf`;
            }

            if (!PDFComponent) return;

            const blob = await pdf(PDFComponent).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleDelete = (id: number, type: 'invoice' | 'quotation') => {
        setConfirmModal({
            isOpen: true,
            title: `Delete ${type === 'invoice' ? 'Invoice' : 'PROFORMA INVOICE'}`,
            message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setDocuments(prev => prev.filter(i => !(i.id === id && i.documentType === type)));
                try {
                    const endpoint = type === 'invoice' ? `/api/bch/invoices/${id}` : `/api/bch/quotations/${id}`;
                    const res = await fetch(endpoint, { method: 'DELETE' });
                    if (!res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: `Failed to delete ${type}`,
                            type: 'danger',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    } else {
                        window.dispatchEvent(new Event('dashboard-updated'));
                        localStorage.setItem('dashboardLastUpdated', Date.now().toString());
                    }
                } catch (e) {
                    console.error(e);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: `Error deleting ${type}`,
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
    };

    const handleSent = async (id: number, type: 'invoice' | 'quotation') => {
        const doc = documents.find(d => d.id === id && d.documentType === type);
        if (!doc) return;

        if (!doc.customer_email) {
            setConfirmModal({
                isOpen: true,
                title: 'No Email',
                message: 'This document does not have a customer email associated with it.',
                type: 'info',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Send Email',
            message: `Send ${type === 'invoice' ? 'Invoice' : 'Proforma Invoice'} #${type === 'invoice' ? doc.invoice_no : doc.quotation_no} to ${doc.customer_email}?`,
            type: 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const endpoint = type === 'invoice' ? `/api/bch/invoices/${id}/send` : `/api/bch/quotations/${id}/send`;
                    const res = await fetch(endpoint, { method: 'POST' });
                    const data = await res.json();

                    if (res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Success',
                            message: `Email sent successfully! (Sent to ${doc.customer_email})`,
                            type: 'success',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                        setDocuments(prev => prev.map(item => (item.id === id && item.documentType === type) ? { ...item, status: 'Sent' } : item));
                    } else {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Failed to send: ' + data.error,
                            type: 'danger',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    console.error('Error sending:', error);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'Error sending email',
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
    };

    const handlePrint = async (id: number, type: 'invoice' | 'quotation') => {
        try {
            const endpoint = type === 'invoice' ? `/api/bch/invoices/${id}` : `/api/bch/quotations/${id}`;
            const res = await fetch(endpoint, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch details');
            const data = await res.json();
            const doc = type === 'invoice' ? data.invoice : data.quotation;
            const items = data.items;

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

            const docNo = type === 'invoice' ? doc.invoice_no : doc.quotation_no;
            const docTitle = type === 'invoice' ? 'INVOICE' : 'PROFORMA INVOICE';

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${docTitle} ${docNo}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                        body { font-family: 'Inter', sans-serif; color: #1f2937; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .container { width: 210mm; min-height: 297mm; padding: 5mm; margin: 0 auto; background: white; box-sizing: border-box; position: relative; }
                        @media print { body { background: white; } .container { width: 100%; margin: 0; padding: 5mm; border: none; box-shadow: none; } @page { size: A4; margin: 0; } }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                        th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; padding: 1rem; text-align: left; font-size: 0.8rem; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
                        td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
                    </style>
                </head>
                <body>
                    <div class="container">
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
                            ${doc.is_taxable ? `<div style="position: absolute; left: 50%; transform: translateX(-50%); top: 62px;"><p style="color: #1A2244; font-size: 1.2rem; fontWeight: 500; margin: 0;">TAX : 123456789123456</p></div>` : ''}
                            <div><h1 style="margin: 0; font-size: 2.5rem; color: #1A2244; letter-spacing: 1px; font-weight: 700;">${docTitle}</h1></div>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 3rem;">
                            <div style="max-width: 50%;">
                                <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem;">Bill To</h3>
                                <div style="font-size: 0.95rem; font-weight: 600; color: #000;">${doc.customer_name}</div>
                                <div style="white-space: pre-line; color: #374151; font-size: 0.9rem; line-height: 1.4;">${doc.customer_address || ''}</div>
                                ${doc.customer_email ? `<div style="font-size: 0.9rem;">${doc.customer_email}</div>` : ''}
                                ${doc.customer_phone ? `<div style="font-size: 0.9rem;">${doc.customer_phone}</div>` : ''}
                            </div>
                            <div style="text-align: right; min-width: 200px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;"><span style="font-size: 0.9rem;">${type === 'invoice' ? 'Invoice' : 'Pro-Inv No'} #:</span><span style="font-size: 0.9rem; font-weight: 600;">${docNo}</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;"><span style="font-size: 0.9rem;">Date:</span><span style="font-size: 0.9rem; font-weight: 500;">${new Date(doc.created_date).toLocaleDateString()}</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;"><span style="font-size: 0.9rem;">Due Date:</span><span style="font-size: 0.9rem; font-weight: 500;">${new Date(doc.due_date).toLocaleDateString()}</span></div>
                                <div style="display: flex; justify-content: space-between;"><span style="font-size: 0.9rem;">Payment Type:</span><span style="font-size: 0.9rem; font-weight: 500;">${doc.payment_type}</span></div>
                            </div>
                        </div>

                        <table>
                            <thead><tr><th style="color: #1A2244;">Job Description</th><th style="text-align: center; color: #1A2244;">Qty</th><th style="text-align: center; color: #1A2244;">Cost</th><th style="text-align: center; color: #1A2244;">Discount</th><th style="text-align: right; color: #1A2244;">Total</th></tr></thead>
                            <tbody>${items.map((item: any) => `<tr><td>${item.description}</td><td style="text-align: center;">${item.quantity}</td><td style="text-align: center;">AED ${Number(item.unit_price).toFixed(0)}</td><td style="text-align: center;">AED ${Number(item.discount).toFixed(0)}</td><td style="text-align: right;">AED ${Number(item.total).toFixed(0)}</td></tr>`).join('')}</tbody>
                        </table>

                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="max-width: 45%;">
                                ${(doc.show_terms !== false) ? `
                                <h4 style="font-size: 0.7rem; font-weight: 700; margin-bottom: 0.20rem; color: #1A2244;">Terms and Conditions</h4>
                                <p style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.20rem; white-space: pre-line; line-height: .9rem;">${doc.terms_and_conditions || ''}</p>
                                <h4 style="font-size: 0.7rem; font-weight: 700; margin-bottom: 0.20rem; color: #1A2244;">Notes</h4>
                                <p style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.20rem; white-space: pre-line; line-height: .9rem;">${doc.notes || ''}</p>
                                ` : ''}
                            </div>
                            <div style="width: 300px;">
                                ${(doc.is_discountable || doc.is_taxable) ? `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #4b5563;"><span>Sub Total</span><span>AED ${Number(doc.sub_total).toFixed(0)}</span></div>` : ''}
                                ${doc.is_taxable ? `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #4b5563;"><span>VAT (5%)</span><span>AED ${Number(doc.tax_amount).toFixed(0)}</span></div>` : ''}
                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700; color: #ea580c; border-top: 1px solid #e5e7eb; padding-top: 0.5rem;"><span>Total Amount</span><span>AED ${Number(doc.total_amount).toFixed(0)}</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #4b5563;"><span>Advance Paid</span><span>AED ${Number(doc.advance_received || 0).toFixed(0)}</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.9rem; font-weight: 700; color: #dc2626;"><span>Balance Due</span><span>AED ${(Number(doc.total_amount) - Number(doc.advance_received || 0)).toFixed(0)}</span></div>
                            </div>
                        </div>

                        <div style="margin-top: 4rem; text-align: right;"><div style="display: inline-block; text-align: center;"><div style="width: 150px; border-bottom: 1px solid #000; margin-bottom: 0.5rem;"></div><h5 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #1A2244;">${staffName || 'Muhammed Rishad'}</h5><p style="margin: 0; font-size: 0.8rem; color: #6b7280;">${staffRole || 'Accountant'}</p></div></div>
                        <div style="position: absolute; bottom: 10mm; left: 0; width: 100%; text-align: center;"><div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.25rem;"><img src="${window.location.origin}/icon/nav-logo.png" alt="Logo" style="width: 24px; height: auto;" /><h3 style="margin: 0; font-size: 1.2rem; color: #1A2244; font-family: 'Square721 BT Roman', sans-serif;">BIZZ CO HUB LLC</h3></div><div style="font-size: 0.8rem; color: #6b7280;">Premium Refurbished Electronics and Professional IT Services</div></div>
                    </div>
                    <script>window.onload = function() { window.print(); }</script>
                </body>
                </html>
            `;
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        } catch (error) {
            console.error('Error printing:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to print document',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handlePayment = async (doc: any) => {
        setSelectedDocumentId(doc.id);
        setSelectedDocumentType(doc.documentType);
        setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', method: 'Cash' });
        setEditingPaymentId(null);
        setShowPaymentModal(true);
        setLoadingPayments(true);
        try {
            const endpoint = doc.documentType === 'invoice'
                ? `/api/bch/invoices/${doc.id}/payments`
                : `/api/bch/quotations/${doc.id}/payments`;
            const res = await fetch(endpoint);
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
        if (!selectedDocumentId || !selectedDocumentType || !paymentForm.amount) return;

        const method = editingPaymentId ? 'PATCH' : 'POST';
        const baseUrl = selectedDocumentType === 'invoice'
            ? `/api/bch/invoices/${selectedDocumentId}/payments`
            : `/api/bch/quotations/${selectedDocumentId}/payments`;

        const url = editingPaymentId ? `${baseUrl}/${editingPaymentId}` : baseUrl;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...paymentForm,
                    staff_name: staffName
                })
            });

            const data = await res.json();

            if (res.ok) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingPaymentId ? 'Payment updated successfully!' : 'Payment recorded successfully!',
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });

                setDocuments(prev => prev.map(doc => (doc.id === selectedDocumentId && doc.documentType === selectedDocumentType) ? {
                    ...doc,
                    status: data.newStatus,
                    advance_received: data.newPaid
                } : doc));

                const histRes = await fetch(baseUrl);
                if (histRes.ok) {
                    const histData = await histRes.json();
                    setPaymentHistory(histData.payments || []);
                }

                setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', method: 'Cash' });
                setEditingPaymentId(null);

                window.dispatchEvent(new Event('dashboard-updated'));
                localStorage.setItem('dashboardLastUpdated', Date.now().toString());
            } else {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Failed to save payment: ' + data.error,
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error('Error submitting payment:', error);
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
        if (!selectedDocumentId || !selectedDocumentType) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Payment',
            message: 'Are you sure you want to delete this payment record?',
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const baseUrl = selectedDocumentType === 'invoice'
                        ? `/api/bch/invoices/${selectedDocumentId}/payments`
                        : `/api/bch/quotations/${selectedDocumentId}/payments`;
                    const res = await fetch(`${baseUrl}/${payId}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) {
                        setDocuments(prev => prev.map(doc => (doc.id === selectedDocumentId && doc.documentType === selectedDocumentType) ? {
                            ...doc,
                            status: data.newStatus,
                            advance_received: data.newPaid
                        } : doc));
                        setPaymentHistory(prev => prev.filter(p => p.id !== payId));
                        window.dispatchEvent(new Event('dashboard-updated'));
                        localStorage.setItem('dashboardLastUpdated', Date.now().toString());
                    }
                } catch (error) { console.error(error); }
            }
        });
    };

    const handleExport = async () => {
        if (filteredDocs.length === 0) {
            toast.error("No data to export");
            return;
        }

        const toastId = toast.loading("Preparing detailed export...");
        try {
            const billIds = filteredDocs.map(doc => ({
                id: doc.id,
                type: doc.documentType
            }));

            const res = await fetch('/api/bch/bills/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billIds })
            });

            const result = await res.json();
            if (result.success) {
                exportBillsToExcel(result.data);
                toast.success("Detailed Excel file exported successfully", { id: toastId });
            } else {
                toast.error("Export failed: " + result.error, { id: toastId });
            }
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error preparing export data", { id: toastId });
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const toastId = toast.loading("Parsing Excel file...");
        try {
            const data = await parseBillsFromExcel(file);
            if (data.length === 0) {
                toast.error("Excel file is empty", { id: toastId });
                setIsImporting(false);
                return;
            }

            toast.loading(`Importing ${data.length} records...`, { id: toastId });
            
            const res = await fetch('/api/bch/bills/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bills: data })
            });

            const result = await res.json();
            if (result.success) {
                toast.success(`Imported ${result.importedInvoices} invoices and ${result.importedQuotations} proformas`, { id: toastId });
                if (result.errors?.length > 0) {
                    console.warn("Import errors:", result.errors);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Import Summary with Warnings',
                        message: (
                            <div>
                                <p>Import completed with some issues:</p>
                                <ul style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    {result.errors.slice(0, 10).map((err: string, i: number) => <li key={i} style={{ color: '#dc2626' }}>{err}</li>)}
                                    {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
                                </ul>
                            </div>
                        ),
                        type: 'info',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
                // Refresh list
                window.dispatchEvent(new Event('dashboard-updated'));
            } else {
                toast.error("Import failed: " + result.error, { id: toastId });
            }
        } catch (error) {
            console.error("Import error:", error);
            toast.error("Error processing Excel file", { id: toastId });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePrintReceipt = (pay: any) => {
        const doc = documents.find(d => d.id === selectedDocumentId && d.documentType === selectedDocumentType);
        if (!doc) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const docNo = doc.documentType === 'invoice' ? doc.invoice_no : doc.quotation_no;
        const docDate = pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        const receiptId = pay.id.toString().padStart(4, '0');
        const customerName = (pay.customer_name || doc.customer_name || '').toUpperCase();

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
                            <div class="dotted-underline" style="text-align: center; font-weight: 500; font-size: 15px;">${(pay.notes || 'Payment for ' + docNo)}</div>
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

    const handleSendReceipt = async (payId: number) => {
        if (!selectedDocumentId || !selectedDocumentType) return;
        try {
            const baseUrl = selectedDocumentType === 'invoice'
                ? `/api/bch/invoices/${selectedDocumentId}/payments`
                : `/api/bch/quotations/${selectedDocumentId}/payments`;
            const res = await fetch(`${baseUrl}/${payId}/send`, { method: 'POST' });
            if (res.ok) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Success',
                    message: 'Receipt sent successfully!',
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) { console.error(error); }
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = (doc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
            (doc.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
            (doc.quotation_no?.toLowerCase().includes(searchTerm.toLowerCase()) || "");

        const matchesFilter = filterType === 'all' || doc.documentType === filterType;

        return matchesSearch && matchesFilter;
    });

    return (
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>All Bills (Invoices & Proforma)</h2>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {/* 3-State Toggle Filter */}
                    <div style={{ display: 'flex', background: '#f3f4f6', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <button
                            onClick={() => setFilterType('invoice')}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: filterType === 'invoice' ? 'white' : 'transparent',
                                color: filterType === 'invoice' ? '#2563eb' : '#6b7280',
                                boxShadow: filterType === 'invoice' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Invoices
                        </button>
                        <button
                            onClick={() => setFilterType('all')}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: filterType === 'all' ? 'white' : 'transparent',
                                color: filterType === 'all' ? '#1f2937' : '#6b7280',
                                boxShadow: filterType === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterType('quotation')}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: filterType === 'quotation' ? 'white' : 'transparent',
                                color: filterType === 'quotation' ? '#d97706' : '#6b7280',
                                boxShadow: filterType === 'quotation' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Proforma
                        </button>
                    </div>

                    <button
                        onClick={handleExport}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
                            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
                            fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    >
                        <Download size={16} />
                        Export
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
                            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
                            fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
                            opacity: isImporting ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    >
                        <Upload size={16} />
                        {isImporting ? 'Importing...' : 'Import'}
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".xlsx, .xls, .csv"
                        style={{ display: 'none' }}
                    />

                    <input
                        type="text"
                        placeholder="Search Customer or Invoice..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.6rem 1rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.9rem', width: '250px', outline: 'none' }}
                    />
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>Bill #</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>Type</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>Customer</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>Amount</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredDocs.length > 0 ? filteredDocs.map((doc) => {
                        const billNumber = doc.documentType === 'invoice' ? doc.invoice_no : doc.quotation_no;
                        return (
                            <tr key={`${doc.documentType}-${doc.id}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', fontWeight: 500, color: '#1f2937' }}>
                                    {billNumber}
                                </td>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        backgroundColor: doc.documentType === 'invoice' ? '#eff6ff' : '#fef3c7',
                                        color: doc.documentType === 'invoice' ? '#2563eb' : '#d97706'
                                    }}>
                                        {doc.documentType === 'invoice' ? 'Invoice' : 'Proforma'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                    {new Date(doc.created_date).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', color: '#4b5563' }}>{doc.customer_name}</td>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', color: '#1f2937', fontWeight: 700 }}>
                                    AED {Number(doc.total_amount).toFixed(2)}
                                </td>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem' }}>
                                    <select
                                        value={doc.status}
                                        onChange={(e) => handleStatusChange(doc.id, doc.documentType, e.target.value)}
                                        style={{
                                            padding: '0.3rem 0.5rem', borderRadius: '4px', border: 'none', fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
                                            backgroundColor: doc.status === 'Paid' ? '#dcfce7' : doc.status === 'Overdue' ? '#fee2e2' : (doc.status === 'Partially Paid' || doc.status === 'Partial') ? '#ffedd5' : (doc.status === 'Converted' || doc.status === 'Accepted') ? '#f3e8ff' : doc.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                            color: doc.status === 'Paid' ? '#166534' : doc.status === 'Overdue' ? '#991b1b' : (doc.status === 'Partially Paid' || doc.status === 'Partial') ? '#9a3412' : (doc.status === 'Converted' || doc.status === 'Accepted') ? '#9333ea' : doc.status === 'Rejected' ? '#991b1b' : '#d97706',
                                            appearance: 'none',
                                            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 0.5rem top 50%',
                                            backgroundSize: '0.65em auto',
                                            paddingRight: '1.5rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        {doc.documentType === 'invoice' ? (
                                            <>
                                                <option value="Pending">Pending</option>
                                                <option value="Partial">Partial Payment</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Overdue">Overdue</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </>
                                        ) : (
                                            <>
                                                {(doc.status === 'Accepted' || doc.status === 'Converted' || doc.status === 'Partial' || doc.status === 'Paid' || doc.status === 'Overdue' || doc.status === 'Cancelled') ? (
                                                    <>
                                                        <option value="Pending">Pending</option>
                                                        <option value="Partial">Partial Payment</option>
                                                        <option value="Paid">Paid</option>
                                                        <option value="Overdue">Overdue</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="Pending">Pending</option>
                                                        <option value="Accepted">Accepted</option>
                                                        <option value="Rejected">Rejected</option>
                                                        <option value="Converted">Converted</option>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </select>
                                </td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        <button onClick={() => handleView(doc.id, doc.documentType)} title="View" style={{ border: 'none', background: '#f5f3ff', color: '#8b5cf6', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-eye" style={{ fontSize: '0.8rem' }}></i>
                                        </button>
                                        <button onClick={() => handleDelete(doc.id, doc.documentType)} title="Delete" style={{ border: 'none', background: '#fef2f2', color: '#ef4444', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-trash" style={{ fontSize: '0.8rem' }}></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                No bills found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* View Modal */}
            {showViewModal && viewData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
                    overflowY: 'auto', padding: '2rem 0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    {/* Action Buttons Panel */}
                    <div style={{
                        width: '210mm',
                        display: 'flex', gap: '1rem', marginBottom: '1rem',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            onClick={() => handlePayment(viewData.document)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 500 }}
                        >
                            <i className="fas fa-hand-holding-usd"></i> Record Payment
                        </button>
                        <button 
                            onClick={() => {
                                const docNo = viewData.type === 'invoice' ? viewData.document.invoice_no : viewData.document.quotation_no;
                                const param = viewData.type === 'invoice' ? 'invoice' : 'proforma';
                                router.push(`/bch/inventory/soldout?${param}=${encodeURIComponent(docNo)}`);
                            }} 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4f46e5', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 500 }}
                        >
                            <i className="fas fa-cart-arrow-down"></i> Sales Out
                        </button>
                        <button onClick={() => handleDownload(viewData.document, viewData.items, viewData.type)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 500 }}>
                            <i className="fas fa-download"></i> Download
                        </button>
                        <button onClick={() => handlePrint(viewData.document.id, viewData.type)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 500 }}>
                            <i className="fas fa-print"></i> Print
                        </button>
                        <button onClick={() => handleSent(viewData.document.id, viewData.type)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 500 }}>
                            <i className="fas fa-envelope"></i> Send Email
                        </button>
                        {viewData.type === 'quotation' && viewData.document.status !== 'Converted' && onConvertQuotation && (
                            <button onClick={() => { setShowViewModal(false); onConvertQuotation(viewData.document, viewData.items); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 500 }}>
                                <i className="fas fa-exchange-alt"></i> Convert
                            </button>
                        )}
                        <button onClick={() => { setShowViewModal(false); if (viewData.type === 'invoice') onEditInvoice(viewData.document); else onEditQuotation(viewData.document); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 500 }}>
                            <i className="fas fa-edit"></i> Edit
                        </button>
                        <button onClick={() => setShowViewModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#6b7280', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            &times;
                        </button>
                    </div>

                    <div style={{
                        background: 'white',
                        width: '210mm',
                        minHeight: '297mm',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '1rem', color: '#1f2937', fontFamily: "'Inter', sans-serif" }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '2px solid #1A2244', paddingBottom: '0.5rem', position: 'relative' }}>
                                <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginBottom: '0.1rem' }}>
                                        <img src="/icon/nav-logo.png" alt="Logo" style={{ width: '40px', height: 'auto' }} />
                                        <h1 style={{ margin: 0, fontSize: '2rem', color: '#1A2244', fontWeight: 700, fontFamily: "'Square721 BT Roman', sans-serif" }}>BIZZ CO HUB LLC</h1>
                                    </div>
                                    <p style={{ margin: 0, color: '#1A2244', fontSize: '0.7rem' }}>Premium Refurbished Electronics and Professional IT Services</p>
                                    <p style={{ margin: 0, color: '#1A2244', fontSize: '0.7rem' }}>Sharjah Media City, Sharjah, UAE</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <p style={{ margin: 0, color: '#1A2244', fontSize: '0.7rem' }}>Ph: +971 52 714 6582 | +971 55 614 8279</p>
                                        {viewData.document.is_taxable && (
                                            <p style={{ color: '#1A2244', fontSize: '1.2rem', fontWeight: 500, margin: 0, marginRight: '210px' }}>TAX : 123456789123456</p>
                                        )}
                                    </div>
                                </div>
                                <div style={{ position: 'absolute', right: 0, top: 0 }}>
                                    <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#1A2244', letterSpacing: '1px', fontWeight: 700 }}>
                                        {viewData.type === 'invoice' ? 'INVOICE' : 'PROFORMA INVOICE'}
                                    </h1>
                                </div>
                            </div>

                            {/* Bill To & Meta */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                                <div style={{ maxWidth: '50%' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>Bill To</h3>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000' }}>{viewData.document.customer_name}</div>
                                    <div style={{ whiteSpace: 'pre-line', color: '#374151', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        {viewData.document.customer_address}
                                    </div>
                                    {viewData.document.customer_email && <div style={{ fontSize: '0.9rem' }}>{viewData.document.customer_email}</div>}
                                    {viewData.document.customer_phone && <div style={{ fontSize: '0.9rem' }}>{viewData.document.customer_phone}</div>}
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '200px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.9rem' }}>{viewData.type === 'invoice' ? 'Invoice' : 'Pro-Inv'} #:</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewData.type === 'invoice' ? viewData.document.invoice_no : viewData.document.quotation_no}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Date:</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(viewData.document.created_date).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Due Date:</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(viewData.document.due_date || viewData.document.validity_date).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Payment Type:</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{viewData.document.payment_type}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
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
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{item.quantity || item.qty}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>AED {Number(item.unit_price || item.cost).toFixed(0)}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>AED {Number(item.discount).toFixed(0)}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>AED {Number(item.total || (((item.quantity || item.qty) * (item.unit_price || item.cost)) - item.discount)).toFixed(0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Footer Section */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                {/* Left: Terms & Notes */}
                                <div style={{ maxWidth: '45%' }}>
                                    {(viewData.document.show_terms !== false) && (
                                        <>
                                            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.20rem', color: '#1A2244' }}>Terms and Conditions</h4>
                                            <p style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.20rem', whiteSpace: 'pre-line', lineHeight: '.9rem' }}>{viewData.document.terms_and_conditions}</p>

                                            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.20rem', color: '#1A2244' }}>Notes</h4>
                                            {viewData.document.notes && (
                                                <p style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.20rem', whiteSpace: 'pre-line', lineHeight: '.9rem' }}>{viewData.document.notes}</p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Right: Totals */}
                                <div style={{ width: '300px' }}>
                                    {(viewData.document.is_discountable || viewData.document.is_taxable) && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                            <span>Sub Total</span>
                                            <span>AED {Number(viewData.document.sub_total).toFixed(0)}</span>
                                        </div>
                                    )}

                                    {viewData.document.is_taxable && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                            <span>VAT (5%)</span>
                                            <span>AED {Number(viewData.document.tax_amount).toFixed(0)}</span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, color: '#ea580c', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                                        <span>Total Amount</span>
                                        <span>AED {Number(viewData.document.total_amount).toFixed(0)}</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                        <span>Advance Paid</span>
                                        <span>AED {Number(viewData.document.advance_received || 0).toFixed(0)}</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
                                        <span>Balance Due</span>
                                        <span>AED {(Number(viewData.document.total_amount) - Number(viewData.document.advance_received || 0)).toFixed(0)}</span>
                                    </div>

                                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'right', fontStyle: 'italic' }}>
                                        Amount in Words :  {toWords.convert(Number(viewData.document.total_amount))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '4rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-block', textAlign: 'center' }}>
                                    <div style={{ width: '150px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1A2244' }}>{staffName || 'Muhammed Rishad'}</h5>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{staffRole || 'Accountant'}</p>
                                </div>
                            </div>

                            {/* Bottom Branding */}
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

            {/* Payment Modal */}
            {showPaymentModal && selectedDocumentId && selectedDocumentType && (
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

                        {/* Document Info Context */}
                        {(() => {
                            const doc = documents.find(i => i.id === selectedDocumentId && i.documentType === selectedDocumentType);
                            const total = Number(doc?.total_amount || 0);
                            const paid = Number(doc?.advance_received || 0);
                            const balance = total - paid;

                            return (
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Amount</div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>AED {total.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Paid So Far</div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#16a34a' }}>AED {paid.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Balance Due</div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#dc2626' }}>AED {balance.toFixed(2)}</div>
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
                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', fontWeight: 500, textAlign: 'right' }}>AED {Number(pay.amount).toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <button title="Print Receipt" onClick={() => handlePrintReceipt(pay)} style={{ border: 'none', background: '#fff7ed', color: '#f97316', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-print"></i></button>
                                                    <button title="Download Receipt" onClick={() => handleDownload(pay, [], 'receipt')} style={{ border: 'none', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-download"></i></button>
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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
                confirmText={confirmModal.title.includes('Error') ? 'Close' : 'OK'}
            />
        </div>
    );
}
