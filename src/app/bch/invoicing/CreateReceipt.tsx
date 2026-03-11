"use client";

import React, { useState, useEffect } from "react";
import { Search, Receipt, ArrowLeft, Printer, Save, CheckCircle2, AlertCircle, Edit2, Mail, FileText, List } from "lucide-react";
import { ToWords } from 'to-words';
import { pdf } from '@react-pdf/renderer';
import ReceiptPDF from '../../../components/pdf/ReceiptPDF';

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
            },
        },
    },
});

interface CreateReceiptProps {
    setActiveSection: (section: string) => void;
}

export default function CreateReceipt({ setActiveSection }: CreateReceiptProps) {
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        method: "Cash",
        notes: ""
    });
    const [savedPayment, setSavedPayment] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [staffName, setStaffName] = useState("");
    const [staffRole, setStaffRole] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);

    // Load staff name from session
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
    }, []);

    // Fetch documents when searching
    useEffect(() => {
        const fetchDocs = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setSearching(true);
            try {
                // Fetch both invoices and quotations
                const [invRes, qtnRes] = await Promise.all([
                    fetch(`/api/bch/invoices?search=${searchQuery}`),
                    fetch(`/api/bch/quotations?search=${searchQuery}`)
                ]);

                let results: any[] = [];
                if (invRes.ok) {
                    const data = await invRes.json();
                    results = [...results, ...(data.invoices || []).map((i: any) => ({ ...i, type: 'invoice' }))];
                }
                if (qtnRes.ok) {
                    const data = await qtnRes.json();
                    results = [...results, ...(data.quotations || []).map((q: any) => ({ ...q, type: 'quotation' }))];
                }
                setSearchResults(results.slice(0, 5));
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchDocs, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSelectDoc = (doc: any) => {
        setSelectedDoc(doc);
        setSearchQuery("");
        setSearchResults([]);
        // Auto-fill remaining balance if possible
        const balance = (Number(doc.total_amount) - Number(doc.advance_received || 0));
        setPaymentForm(prev => ({ ...prev, amount: balance.toString() }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow submission if we have a selected doc OR if we have a search query (direct payment)
        if (!selectedDoc && !searchQuery) return;
        if (!paymentForm.amount) return;

        setLoading(true);
        setError(null);
        try {
            let endpoint = "";
            const method = isEditing ? 'PATCH' : 'POST';
            const body = {
                ...paymentForm,
                staff_name: staffName
            };

            if (selectedDoc) {
                const baseUrl = selectedDoc.type === 'invoice'
                    ? `/api/bch/invoices/${selectedDoc.id}/payments`
                    : `/api/bch/quotations/${selectedDoc.id}/payments`;
                endpoint = (isEditing && editingPaymentId) ? `${baseUrl}/${editingPaymentId}` : baseUrl;
            } else {
                const baseUrl = '/api/bch/payments';
                endpoint = (isEditing && editingPaymentId) ? `${baseUrl}/${editingPaymentId}` : baseUrl;
                // Add direct payment specific fields
                (body as any).customer_name = searchQuery || 'Direct Customer';
            }

            console.log("Submitting payment:", { isEditing, editingPaymentId, method, endpoint });
            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                setSavedPayment({
                    ...paymentForm,
                    id: isEditing ? (editingPaymentId as number) : data.paymentId,
                    doc_no: selectedDoc ? (selectedDoc.invoice_no || selectedDoc.quotation_no) : 'DIRECT',
                    customer_name: selectedDoc ? selectedDoc.customer_name : searchQuery,
                    payment_date: paymentForm.date,
                    method: paymentForm.method, // consistency
                    staff_name: staffName
                });
                setIsEditing(false);
                setEditingPaymentId(null);
                // Reset form but keep savedPayment for printing
            } else {
                const data = await res.json();
                setError(data.error || "Failed to record payment");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendReceipt = async () => {
        if (!savedPayment) return;
        setLoading(true);
        try {
            let endpoint = "";
            if (selectedDoc) {
                const baseUrl = selectedDoc.type === 'invoice'
                    ? `/api/bch/invoices/${selectedDoc.id}/payments`
                    : `/api/bch/quotations/${selectedDoc.id}/payments`;
                endpoint = `${baseUrl}/${savedPayment.id}/send`;
            } else {
                // Direct payments don't have emails by default in this schema
                setError("Email sending is only available for Invoice and Proforma payments.");
                setLoading(false);
                return;
            }

            const res = await fetch(endpoint, { method: 'POST' });
            if (res.ok) {
                // Success feedback - could use a toast or temporary state
                alert("Receipt sent successfully to customer email!");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to send receipt");
            }
        } catch (err) {
            console.error("Error sending receipt:", err);
            setError("An error occurred while sending. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!savedPayment) return;
        try {
            const blob = await pdf(
                <ReceiptPDF 
                    payment={savedPayment} 
                    staffName={staffName} 
                    logoUrl={window.location.origin + '/icon/nav-logo.png'} 
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Receipt-REC-${savedPayment.id.toString().padStart(4, '0')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error generating PDF:", err);
            setError("Failed to generate PDF. Please try again.");
        }
    };

    const handlePrint = () => {
        if (!savedPayment) return;
        const pay = savedPayment;
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
                        height: 98mm;
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
                    .sig-label { text-align: center; }
                    .received-by-wrap { display: flex; align-items: center; gap: 10px; justify-content: center; }
                    .received-by-text { font-size: 14px; font-weight: 400; text-align: left; white-space: nowrap; }
                    .sig-line { border-bottom: 1px dotted #000; width: 220px; padding-bottom: 4px; font-weight: 800; font-size: 16px; text-align: center; }
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
                                <div class="checkbox-item"><div class="checkbox">${pay.method === 'Cash' ? '✓' : ''}</div> Cash</div>
                                <div class="checkbox-item"><div class="checkbox">${pay.method === 'Cheque' ? '✓' : ''}</div> Cheque</div>
                                <div class="checkbox-item"><div class="checkbox">${pay.method === 'Bank' ? '✓' : ''}</div> Bank</div>
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

    // Style Constants
    const styles = {
        container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
        title: { fontSize: '1.8rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 },
        subtitle: { color: '#6b7280', marginTop: '0.25rem', fontSize: '1rem' },
        actionsBar: { display: 'flex', gap: '1rem', alignItems: 'center' },
        btnSave: (disabled: boolean) => ({
            background: disabled ? '#94a3b8' : '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: disabled ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
        }),
        btnCancel: {
            background: 'white',
            color: '#4b5563',
            border: '1px solid #d1d5db',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
        },

        // Success Card
        successCard: { background: 'white', borderRadius: '20px', padding: '3rem', textAlign: 'center' as const, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid #c6f6d5' },
        successIcon: { width: '80px', height: '80px', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' },
        successBtnGroup: { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' },
        printBtn: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#2563eb', color: 'white', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' },
        pdfBtn: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#4b5563', color: 'white', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' },
        emailBtn: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#7c3aed', color: 'white', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' },
        editBtn: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', color: '#4b5563', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #d1d5db', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' },
        anotherBtn: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#00a824', color: '#000000', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #00a824', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' },
        listBtn: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f3f4f6', color: '#374151', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' },

        input: { width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' as const },
        dropdown: { position: 'absolute' as const, top: '100%', left: 0, right: 0, marginTop: '0.5rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 100, overflow: 'hidden' },
        dropdownItem: { width: '100%', padding: '1rem', borderBottom: '1px solid #f3f4f6', textAlign: 'left' as const, background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' },

        // Selection Summary
        selectionBox: { marginTop: '1.5rem', padding: '1.25rem', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' },
        selectionHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' },
        selectionBadge: { fontSize: '0.65rem', fontWeight: 800, color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase' as const },
        selectionDataRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' },
        selectionLabel: { fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
        selectionValue: { fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        <Receipt style={{ width: '2rem', height: '2rem', color: '#2563eb' }} />
                        Money Receipt
                    </h1>
                    <p style={styles.subtitle}>Fill out and generate a professional money receipt</p>
                </div>
                <div style={styles.actionsBar}>
                    <button
                        style={styles.btnCancel}
                        onClick={() => setActiveSection('receipts-all')}
                    >
                        Cancel
                    </button>
                    {!savedPayment && (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || (!selectedDoc && !searchQuery) || !paymentForm.amount}
                            style={styles.btnSave(loading || (!selectedDoc && !searchQuery) || !paymentForm.amount)}
                        >
                            <Save style={{ width: '1.25rem', height: '1.25rem' }} />
                            {loading ? 'Processing...' : (isEditing ? 'UPDATE RECEIPT' : 'SAVE & GENERATE')}
                        </button>
                    )}
                </div>
            </div>

            {savedPayment ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                    {/* Success Header */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={styles.successIcon}>
                            <CheckCircle2 style={{ width: '3rem', height: '3rem' }} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>Payment Recorded!</h2>
                        <p style={{ color: '#4b5563', margin: 0 }}>Receipt REC-{savedPayment.id.toString().padStart(4, '0')} has been generated for {savedPayment.customer_name}.</p>
                    </div>

                    {/* Receipt Preview */}
                    <div style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        width: '100%',
                        maxWidth: '900px'
                    }}>
                        <div style={{ padding: '2rem 3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1A2244', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
                                <div className="company-branding">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <img src="/icon/nav-logo.png" alt="Bizzcohub" style={{ width: '40px', height: 'auto' }} />
                                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1A2244', fontWeight: 800, fontFamily: "'Square721 BT Roman', sans-serif" }}>BIZZ CO HUB LLC</h1>
                                    </div>
                                    <p style={{ color: '#1A2244', margin: 0, fontSize: '0.75rem', fontWeight: 500 }}>Premium Refurbished Electronics and Professional IT Services</p>
                                    <p style={{ color: '#1A2244', margin: 0, fontSize: '0.75rem' }}>Sharjah Media City, Sharjah, UAE</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#1A2244', letterSpacing: '2px', fontWeight: 800 }}>MONEY RECEIPT</h1>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#1A2244' }}>
                                        <div>Date: <strong style={{ fontWeight: 800 }}>{new Date(savedPayment.payment_date).toLocaleDateString('en-GB')}</strong></div>
                                        <div>Receipt No: <strong style={{ fontWeight: 800 }}>REC-{savedPayment.id.toString().padStart(4, '0')}</strong></div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
                                <span style={{ whiteSpace: 'nowrap', fontSize: '1rem', fontWeight: 500 }}>Received with thanks from</span>
                                <div style={{ flex: 1, borderBottom: '1px dotted #000', fontWeight: 700, fontSize: '1.3rem', paddingBottom: '2px', textAlign: 'center', textTransform: 'uppercase' }}>
                                    {savedPayment.customer_name}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', marginBottom: '1.2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 400 }}>Amount</span>
                                    <div style={{ border: '1px solid #000', padding: '6px 15px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.2rem', marginRight: '8px' }}>AED</span>
                                        <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{Number(savedPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                    <span style={{ fontWeight: 400, fontSize: '1.1rem' }}>By</span>
                                    {['Cash', 'Cheque', 'Bank'].map(method => (
                                        <div key={method} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '24px', height: '24px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', borderRadius: '2px' }}>
                                                {savedPayment.method === method ? '✓' : ''}
                                            </div>
                                            <span style={{ fontSize: '1.1rem' }}>{method}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '1.1rem', fontWeight: 400, whiteSpace: 'nowrap' }}>
                                    <span>Amount in a</span>
                                    <span>word</span>
                                </div>
                                <div style={{ flex: 1, borderBottom: '1px dotted #000', textAlign: 'center', fontStyle: 'italic', fontSize: '1.1rem', paddingBottom: '3px', fontWeight: 600 }}>
                                    {toWords.convert(Number(savedPayment.amount))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', marginBottom: '1.2rem' }}>
                                <span style={{ whiteSpace: 'nowrap', fontSize: '1.1rem' }}>For the purpose of</span>
                                <div style={{ flex: 1, borderBottom: '1px dotted #000', paddingBottom: '3px', fontSize: '1.1rem', textAlign: 'center', fontWeight: 500 }}>
                                    {savedPayment.notes || savedPayment.doc_no || 'Payment'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10rem', alignItems: 'flex-end', marginBottom: '0.5rem', marginTop: '2rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 400, whiteSpace: 'nowrap' }}>Received By</span>
                                        <div style={{ borderBottom: '1px dotted #000', width: '220px', textAlign: 'center', paddingBottom: '3px' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A2244' }}>{savedPayment.staff_name.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '5px' }}>Authorized Signature</div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#000', fontStyle: 'normal', opacity: 0.8 }}>
                                - This is a computer generated receipt, it does not need signature or stamp -
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ ...styles.successBtnGroup, display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        <button
                            onClick={handlePrint}
                            style={styles.printBtn}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Printer style={{ width: '1.5rem', height: '1.5rem' }} />
                            Print
                        </button>
                        <button
                            onClick={handleDownload}
                            style={styles.pdfBtn}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <FileText style={{ width: '1.4rem', height: '1.4rem' }} />
                            Create PDF
                        </button>
                        {selectedDoc && (
                            <button
                                onClick={handleSendReceipt}
                                style={styles.emailBtn}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Mail style={{ width: '1.4rem', height: '1.4rem' }} />
                                Send to Email
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setIsEditing(true);
                                setEditingPaymentId(savedPayment.id);
                                setSavedPayment(null);
                            }}
                            style={styles.editBtn}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                e.currentTarget.style.borderColor = '#9ca3af';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                        >
                            <Edit2 style={{ width: '1.2rem', height: '1.2rem' }} />
                            Edit
                        </button>
                        <button
                            onClick={() => {
                                setSavedPayment(null);
                                setSelectedDoc(null);
                                setIsEditing(false);
                                setEditingPaymentId(null);
                                setPaymentForm({ amount: "", date: new Date().toISOString().split('T')[0], method: "Cash", notes: "" });
                            }}
                            style={styles.anotherBtn}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2dd351'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00a824'}
                        >
                            Create Another
                        </button>
                        <button
                            onClick={() => setActiveSection('receipts-all')}
                            style={styles.listBtn}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        >
                            <List style={{ width: '1.2rem', height: '1.2rem' }} />
                            All Receipts
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ maxWidth: '100%', margin: '0 auto' }}>
                    {/* Live Receipt Preview */}
                    <div style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        minHeight: '280px'
                    }}>
                        <div style={{ padding: '2rem 3rem' }}>
                            {/* Invoice-Style Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end',
                                borderBottom: '2px solid #1A2244',
                                paddingBottom: '0.8rem',
                                marginBottom: '1.5rem',
                                position: 'relative'
                            }}>
                                <div className="company-branding">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <img src="/icon/nav-logo.png" alt="Bizzcohub" style={{ width: '40px', height: 'auto' }} />
                                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1A2244', fontWeight: 800, fontFamily: "'Square721 BT Roman', sans-serif" }}>BIZZ CO HUB LLC</h1>
                                    </div>
                                    <p style={{ color: '#1A2244', margin: 0, fontSize: '0.75rem', fontWeight: 500 }}>Premium Refurbished Electronics and Professional IT Services</p>
                                    <p style={{ color: '#1A2244', margin: 0, fontSize: '0.75rem' }}>Sharjah Media City, Sharjah, UAE</p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#1A2244', letterSpacing: '2px', fontWeight: 800 }}>MONEY RECEIPT</h1>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#1A2244' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span>Date:</span>
                                            <input
                                                type="date"
                                                value={paymentForm.date}
                                                onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                                                style={{ border: 'none', background: 'transparent', fontWeight: 800, color: '#1A2244', fontSize: '1.05rem', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', padding: 0, textAlign: 'center' }}
                                            />
                                        </div>
                                        <div>Receipt No: <strong style={{ fontWeight: 800 }}>REC-{savedPayment ? savedPayment.id.toString().padStart(4, '0') : '0001'}</strong></div>
                                    </div>
                                </div>
                            </div>

                            {/* Received From Section */}
                            <div style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
                                <span style={{ whiteSpace: 'nowrap', fontSize: '1rem', fontWeight: 500 }}>Received with thanks from</span>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder=""
                                        style={{
                                            width: '100%',
                                            border: 'none',
                                            borderBottom: '1px dotted #000',
                                            outline: 'none',
                                            fontWeight: 700,
                                            fontSize: '1.3rem',
                                            paddingBottom: '2px',
                                            paddingLeft: '10px',
                                            background: 'transparent',
                                            textTransform: 'uppercase',
                                            textAlign: 'center'
                                        }}
                                        value={selectedDoc ? (selectedDoc.customer_name) : searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            if (selectedDoc) setSelectedDoc(null);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                    />
                                    {searching && (
                                        <div style={{ position: 'absolute', right: '0', bottom: '5px' }}>
                                            <div style={{ width: '0.8rem', height: '0.8rem', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                                        </div>
                                    )}
                                    {searchQuery.length >= 2 && !selectedDoc && showDropdown && (
                                        <div style={{ ...styles.dropdown, width: '100%', top: '100%' }}>
                                            {searchResults.map(doc => (
                                                <button key={`${doc.type}-${doc.id}`} onClick={() => handleSelectDoc(doc)} style={styles.dropdownItem}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: 800 }}>{doc.invoice_no || doc.quotation_no}</span>
                                                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase', backgroundColor: doc.type === 'invoice' ? '#dbeafe' : '#fef3c7', color: doc.type === 'invoice' ? '#1d4ed8' : '#92400e' }}>{doc.type}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.customer_name}</div>
                                                </button>
                                            ))}
                                            <button onClick={() => setSearchResults([])} style={{ ...styles.dropdownItem, borderTop: '1px solid #f3f4f6', backgroundColor: '#fdf2f2' }}>
                                                <div style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.85rem' }}>No Bill Found? Record payment for "{searchQuery}"</div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Amount & Method Section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', marginBottom: '1.2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 400 }}>Amount</span>
                                    <div style={{ border: '1px solid #000', padding: '6px 15px', minWidth: '160px', display: 'flex', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.2rem', marginRight: '8px' }}>AED</span>
                                        <input
                                            type="number"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1.4rem', fontWeight: 700, background: 'transparent', textAlign: 'center' }}
                                            placeholder=""
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                    <span style={{ fontWeight: 400, fontSize: '1.1rem' }}>By</span>
                                    {['Cash', 'Cheque', 'Bank'].map(method => (
                                        <div key={method} onClick={() => setPaymentForm(prev => ({ ...prev, method }))} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <div style={{
                                                width: '24px', height: '24px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', borderRadius: '2px',
                                                backgroundColor: paymentForm.method === method ? '#fff' : 'transparent',
                                            }}>
                                                {paymentForm.method === method ? '✓' : ''}
                                            </div>
                                            <span style={{ fontSize: '1.1rem' }}>{method}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Amount In Words Section (Separate Line) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '1.1rem', fontWeight: 400, whiteSpace: 'nowrap' }}>
                                    <span>Amount in a</span>
                                    <span>word</span>
                                </div>
                                <div style={{ flex: 1, borderBottom: '1px dotted #000', textAlign: 'center', fontStyle: 'italic', fontSize: '1.1rem', paddingBottom: '3px' }}>
                                    {paymentForm.amount ? toWords.convert(Number(paymentForm.amount)) : ""}
                                </div>
                            </div>

                            {/* Purpose Section */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', marginBottom: '1.2rem' }}>
                                <span style={{ whiteSpace: 'nowrap', fontSize: '1.1rem' }}>For the purpose of</span>
                                <input
                                    type="text"
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder=""
                                    style={{ flex: 1, border: 'none', borderBottom: '1px dotted #000', outline: 'none', paddingBottom: '3px', background: 'transparent', fontSize: '1.1rem', textAlign: 'center' }}
                                />
                            </div>

                            {/* Signature Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10rem', alignItems: 'flex-end', marginBottom: '0.5rem', marginTop: '2rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 400, whiteSpace: 'nowrap' }}>Received By</span>
                                        <div style={{ borderBottom: '1px dotted #000', width: '220px', textAlign: 'center', paddingBottom: '3px' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A2244' }}>{staffName.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '5px' }}>Authorized Signature</div>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#000', fontStyle: 'normal', opacity: 0.8 }}>
                                - This is a computer generated receipt, it does not need signature or stamp -
                            </div>
                        </div>

                        {/* Selection Summary (Inline) */}
                        {selectedDoc && (
                            <div style={{
                                marginTop: '2rem',
                                padding: '1rem 1.5rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px dashed #cbd5e1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', gap: '2rem' }}>
                                    <div>
                                        <div style={styles.selectionLabel}>Document Total</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>AED {Number(selectedDoc.total_amount).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={styles.selectionLabel}>Remaining Balance</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ea580c' }}>AED {(Number(selectedDoc.total_amount) - Number(selectedDoc.advance_received || 0)).toLocaleString()}</div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDoc(null)} style={{ color: '#64748b', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Clear Selection</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            ` }} />
        </div>
    );
}
