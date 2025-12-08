"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./styles/billing-styles.css";
import InvoiceForm from "./components/InvoiceForm";

// Types
interface BrandingSettings {
    logo: string;
    brandColor: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    companyTagline: string;
}

interface LineItem {
    description: string;
    details: string;
    unitPrice: number;
    quantity: number;
    total: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientWebsite?: string;
    clientEmail?: string;
    clientAddress?: string;
    issueDate: string;
    dueDate?: string;
    items: LineItem[];
    subtotal: number;
    vat: number;
    discount: number;
    total: number;
    status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "payment_pending" | "partial_payment";
    currency: string;
    paymentMethods?: string[];
    terms?: string;
}

interface Quote {
    id: string;
    quoteNumber: string;
    clientName: string;
    date: string;
    total: number;
    status: "pending" | "approved" | "rejected" | "converted";
    currency: string;
}

export default function BillingPage() {
    const router = useRouter();
    // State
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState("accountant");

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated) {
                        setIsAuthenticated(true);
                        setUserRole(data.role || 'accountant');
                    } else {
                        router.push('/admin/login');
                    }
                } else {
                    router.push('/admin/login');
                }
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/admin/login');
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [router]);



    // Branding State
    const [branding, setBranding] = useState<BrandingSettings>({
        logo: "",
        brandColor: "#667eea",
        companyName: "Bizz Co Hub",
        companyEmail: "billing@bizzcohub.com",
        companyPhone: "+1 (555) 123-4567",
        companyAddress: "123 Business Ave, Tech City, TC 90210",
        companyTagline: "Professional Solutions for Modern Business"
    });

    // Settings State
    const [paymentGateway, setPaymentGateway] = useState<"stripe" | "paypal" | "razorpay">("stripe");
    const [defaultCurrency, setDefaultCurrency] = useState("USD");

    // Mock Data
    const [invoices, setInvoices] = useState<Invoice[]>([
        {
            id: "1",
            invoiceNumber: "INV-001",
            clientName: "Acme Corp",
            issueDate: "2023-10-15",
            items: [
                { description: "Web Development", details: "Frontend work", unitPrice: 1500, quantity: 1, total: 1500 }
            ],
            subtotal: 1500,
            vat: 75,
            discount: 0,
            total: 1575,
            status: "paid",
            currency: "USD"
        },
        {
            id: "2",
            invoiceNumber: "INV-002",
            clientName: "Globex Inc",
            issueDate: "2023-10-20",
            items: [
                { description: "Consulting", details: "Strategy meeting", unitPrice: 200, quantity: 5, total: 1000 }
            ],
            subtotal: 1000,
            vat: 50,
            discount: 0,
            total: 1050,
            status: "sent",
            currency: "USD"
        }
    ]);

    const [quotes, setQuotes] = useState<Quote[]>([
        {
            id: "1",
            quoteNumber: "QT-001",
            clientName: "Stark Industries",
            date: "2023-10-25",
            total: 5000,
            status: "pending",
            currency: "USD"
        }
    ]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) return null;

    // Helpers
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBranding({ ...branding, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // Actions
    const createNewInvoice = () => {
        const newInvoice: Invoice = {
            id: Date.now().toString(),
            invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
            clientName: "",
            issueDate: new Date().toISOString().split('T')[0],
            items: [{ description: "", details: "", unitPrice: 0, quantity: 1, total: 0 }],
            subtotal: 0,
            vat: 0,
            discount: 0,
            total: 0,
            status: "draft",
            currency: defaultCurrency,
            paymentMethods: ["Bank Transfer", "Credit Card"],
            terms: "Payment due within 30 days."
        };
        setCurrentInvoice(newInvoice);
        setShowInvoiceForm(true);
    };

    const editInvoice = (invoice: Invoice) => {
        setCurrentInvoice({ ...invoice });
        setShowInvoiceForm(true);
    };

    const saveInvoice = () => {
        if (!currentInvoice) return;

        const existingIndex = invoices.findIndex(i => i.id === currentInvoice.id);
        if (existingIndex >= 0) {
            const updatedInvoices = [...invoices];
            updatedInvoices[existingIndex] = currentInvoice;
            setInvoices(updatedInvoices);
        } else {
            setInvoices([...invoices, currentInvoice]);
        }
        setShowInvoiceForm(false);
        setCurrentInvoice(null);
    };

    const deleteInvoice = (id: string) => {
        if (confirm("Are you sure you want to delete this invoice?")) {
            setInvoices(invoices.filter(i => i.id !== id));
        }
    };

    const updateInvoiceStatus = (id: string, newStatus: Invoice['status']) => {
        if (confirm(`Are you sure you want to change the status to ${newStatus.replace('_', ' ')}?`)) {
            setInvoices(invoices.map(inv =>
                inv.id === id ? { ...inv, status: newStatus } : inv
            ));
        }
    };

    const getInvoiceHTML = (invoice: Invoice) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoiceNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                    
                    body { 
                        font-family: 'Inter', sans-serif; 
                        margin: 0; 
                        padding: 0; 
                        background: #555;
                        display: flex;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    
                    .page {
                        background: white;
                        width: 210mm;
                        min-height: 297mm;
                        padding: 30px 25px;
                        box-sizing: border-box;
                        position: relative;
                        box-shadow: 0 0 20px rgba(0,0,0,0.5);
                        margin: 20px;
                    }

                    /* Header Layout */
                    .top-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                    }

                    .company-branding {
                        display: flex;
                        flex-direction: column;
                        gap: 3px;
                    }

                    .brand-logo-name {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .brand-logo-name img {
                        height: 40px;
                        width: auto;
                    }

                    .brand-logo-name h1 {
                        font-size: 24px;
                        font-weight: 700;
                        color: ${branding.brandColor};
                        margin: 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    .company-tagline {
                        font-size: 11px;
                        color: #6b7280;
                        margin-top: 2px;
                    }

                    .company-contact-info {
                        margin-top: 8px;
                        font-size: 10px;
                        color: #6b7280;
                        line-height: 1.5;
                    }

                    .company-contact-info p {
                        margin: 2px 0;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .invoice-main-info {
                        text-align: right;
                    }

                    .invoice-label {
                        font-size: 40px;
                        font-weight: 900;
                        color: #111827;
                        margin: 0 0 15px 0;
                        letter-spacing: -1px;
                        line-height: 1;
                    }

                    .invoice-meta-grid {
                        display: grid;
                        grid-template-columns: auto auto;
                        gap: 8px 20px;
                        text-align: right;
                    }

                    .meta-label {
                        font-size: 11px;
                        font-weight: 600;
                        color: #9ca3af;
                        text-transform: uppercase;
                    }

                    .meta-value {
                        font-size: 13px;
                        font-weight: 600;
                        color: #111827;
                    }

                    /* Bill To Section */
                    .bill-to-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                    }
                    
                    .bill-to-left {
                        flex: 1;
                    }

                    .bill-to-label {
                        font-size: 11px;
                        font-weight: 700;
                        color: #9ca3af;
                        text-transform: uppercase;
                        margin-bottom: 8px;
                        display: block;
                    }

                    .client-name {
                        font-size: 16px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0 0 5px 0;
                    }

                    .client-details {
                        font-size: 11px;
                        color: #6b7280;
                        line-height: 1.6;
                    }

                    .client-details p { 
                        margin: 2px 0;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                    
                    .payment-type-section {
                        text-align: right;
                    }
                    
                    .payment-type-label {
                        font-size: 11px;
                        font-weight: 600;
                        color: #9ca3af;
                        margin-bottom: 5px;
                    }
                    
                    .payment-type-value {
                        font-size: 13px;
                        font-weight: 600;
                        color: #111827;
                    }

                    /* Table */
                    .table-container {
                        margin-bottom: 30px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th {
                        background: #f3f4f6;
                        padding: 10px 12px;
                        text-align: left;
                        font-size: 10px;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #6b7280;
                        border: none;
                    }

                    td {
                        padding: 12px;
                        border-bottom: 1px solid #e5e7eb;
                        font-size: 13px;
                        color: #111827;
                        vertical-align: top;
                    }
                    
                    tbody tr:last-child td {
                        border-bottom: none;
                    }

                    th:last-child, td:last-child { text-align: right; }
                    
                    .item-name {
                        font-weight: 600;
                        display: block;
                        margin-bottom: 3px;
                        color: #111827;
                        font-size: 13px;
                    }

                    .item-desc {
                        font-size: 11px;
                        color: #9ca3af;
                    }

                    /* Footer & Totals */
                    .footer-layout {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 20px;
                    }

                    .notes-section {
                        width: 55%;
                    }

                    .totals-section {
                        width: 35%;
                    }

                    .section-header {
                        font-size: 13px;
                        font-weight: 700;
                        color: #111827;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                    }

                    .notes-text {
                        font-size: 13px;
                        color: #4b5563;
                        line-height: 1.6;
                        margin-bottom: 20px;
                    }

                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        font-size: 14px;
                        color: #4b5563;
                    }

                    .grand-total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 15px 0;
                        border-top: 2px solid #111827;
                        border-bottom: 2px solid #111827;
                        margin-top: 10px;
                        font-weight: 800;
                        font-size: 16px;
                        color: #111827;
                    }

                    .signature-area {
                        margin-top: 60px;
                        text-align: right;
                    }

                    .signature-line {
                        display: inline-block;
                        border-top: 1px solid #d1d5db;
                        padding-top: 10px;
                        width: 200px;
                        text-align: center;
                    }

                    @media print {
                        @page { size: A4; margin: 0; }
                        body { 
                            background: white; 
                            margin: 0;
                            padding: 0;
                        }
                        .page { 
                            margin: 0; 
                            box-shadow: none; 
                            width: 100%;
                            height: auto;
                            min-height: auto;
                            padding: 40px 50px;
                            border: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <!-- Top Header: Company Info Left, Invoice Info Right -->
                    <div class="top-header">
                        <div class="company-branding">
                            <div class="brand-logo-name">
                                ${branding.logo ? `<img src="${branding.logo}" />` : ''}
                                <h1>${branding.companyName}</h1>
                            </div>
                            <div class="company-tagline">${branding.companyTagline}</div>
                            <div class="company-contact-info">
                                <p>📍 ${branding.companyAddress}</p>
                                <p>📞 ${branding.companyPhone}</p>
                                <p>✉️ ${branding.companyEmail}</p>
                            </div>
                        </div>

                        <div class="invoice-main-info">
                            <h1 class="invoice-label">INVOICE</h1>
                            <div class="invoice-meta-grid">
                                <div class="meta-label">Invoice No</div>
                                <div class="meta-value">${invoice.invoiceNumber}</div>
                                <div class="meta-label">Date</div>
                                <div class="meta-value">${invoice.issueDate}</div>
                                ${invoice.dueDate ? `
                                <div class="meta-label">Due Date</div>
                                <div class="meta-value">${invoice.dueDate}</div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Bill To Section -->
                    <div class="bill-to-section">
                        <div class="bill-to-left">
                            <span class="bill-to-label">BILL TO:</span>
                            <h3 class="client-name">${invoice.clientName}</h3>
                            <div class="client-details">
                                ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ''}
                                ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ''}
                            </div>
                        </div>
                        <div class="payment-type-section">
                            <div class="payment-type-label">Payment Type :</div>
                            <div class="payment-type-value">${invoice.paymentMethods && invoice.paymentMethods.length > 0 ? invoice.paymentMethods[0] : 'Cash'}</div>
                        </div>
                    </div>

                    <!-- Table -->
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item Description</th>
                                    <th style="text-align: center;">Qty</th>
                                    <th style="text-align: right;">Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>
                                            <span class="item-name">${item.description}</span>
                                            <span class="item-desc">${item.details}</span>
                                        </td>
                                        <td style="text-align: center;">${item.quantity}</td>
                                        <td style="text-align: right;">${formatCurrency(item.unitPrice, invoice.currency)}</td>
                                        <td>${formatCurrency(item.total, invoice.currency)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Footer Layout -->
                    <div class="footer-layout">
                        <div class="notes-section">
                            <div class="payment-info">
                                <h4 class="section-header">Payment Info</h4>
                                <div class="notes-text">
                                    <p>Bank Transfer</p>
                                    <p>Account Name: ${branding.companyName}</p>
                                    <p>Account No: XXXX-XXXX-XXXX</p>
                                </div>
                            </div>

                            <div class="terms-info">
                                <h4 class="section-header">Terms & Notes</h4>
                                <div class="notes-text">
                                    <p>${invoice.terms || 'Payment is due within 30 days.'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="totals-section">
                            <div class="total-row">
                                <span>Subtotal</span>
                                <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
                            </div>
                            <div class="total-row">
                                <span>Tax (${invoice.subtotal > 0 ? ((invoice.vat / invoice.subtotal) * 100).toFixed(0) : 0}%)</span>
                                <span>${formatCurrency(invoice.vat, invoice.currency)}</span>
                            </div>
                            ${invoice.discount > 0 ? `
                            <div class="total-row" style="color: #ef4444;">
                                <span>Discount</span>
                                <span>-${formatCurrency(invoice.discount, invoice.currency)}</span>
                            </div>
                            ` : ''}
                            <div class="grand-total-row">
                                <span>Total Due</span>
                                <span>${formatCurrency(invoice.total, invoice.currency)}</span>
                            </div>

                            <div class="signature-area">
                                <div class="signature-line">
                                    <span style="display: block; font-family: cursive; font-size: 20px; margin-bottom: 5px;">Authorized Sign</span>
                                    <span style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Authorized Signature</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const viewInvoice = (invoice: Invoice) => {
        const invoiceHTML = getInvoiceHTML(invoice);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(invoiceHTML);
            printWindow.document.close();
        }
    };

    const downloadInvoice = (invoice: Invoice) => {
        let invoiceHTML = getInvoiceHTML(invoice);

        // Inject html2pdf script
        const script = `
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <script>
                window.onload = function() {
                    const element = document.querySelector('.page');
                    const opt = {
                        margin: 0,
                        filename: '${invoice.clientName}_${invoice.invoiceNumber}.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save();
                }
            </script>
        `;

        // Inject custom styles for PDF generation to prevent extra pages
        const pdfStyles = `
            <style>
                @page { size: A4; margin: 0; }
                body { background: white !important; margin: 0 !important; padding: 0 !important; min-height: auto !important; }
                .page { 
                    margin: 0 !important; 
                    box-shadow: none !important; 
                    width: 210mm !important;
                    min-height: auto !important;
                    height: auto !important;
                    padding: 30px 25px !important;
                    border: none !important;
                }
            </style>
        `;

        invoiceHTML = invoiceHTML.replace('</body>', `${pdfStyles}${script}</body>`);

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '-10000px';
        iframe.style.top = '0';
        iframe.style.width = '210mm';
        iframe.style.height = '297mm';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(invoiceHTML);
            iframeDoc.close();
        }

        // Clean up iframe after a delay
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 5000);
    };

    const convertQuoteToInvoice = (quote: Quote) => {
        const newInvoice: Invoice = {
            id: Date.now().toString(),
            invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
            clientName: quote.clientName,
            issueDate: new Date().toISOString().split('T')[0],
            items: [{ description: "Converted from Quote " + quote.quoteNumber, details: "", unitPrice: quote.total, quantity: 1, total: quote.total }],
            subtotal: quote.total,
            vat: 0,
            discount: 0,
            total: quote.total,
            status: "draft",
            currency: quote.currency,
            paymentMethods: ["Bank Transfer"],
            terms: "Converted from quote"
        };
        setCurrentInvoice(newInvoice);
        setShowInvoiceForm(true);
        setActiveTab("invoices");
    };

    const downloadQuote = (quote: Quote) => {
        const quoteHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quote ${quote.quoteNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                    
                    body { 
                        font-family: 'Inter', sans-serif; 
                        margin: 0; 
                        padding: 0; 
                        background: #555;
                        display: flex;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    
                    .page {
                        background: white;
                        width: 210mm;
                        min-height: 297mm;
                        padding: 30px 25px;
                        box-sizing: border-box;
                        position: relative;
                        box-shadow: 0 0 20px rgba(0,0,0,0.5);
                        margin: 20px;
                    }

                    .top-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                    }

                    .company-branding {
                        display: flex;
                        flex-direction: column;
                        gap: 3px;
                    }

                    .brand-logo-name h1 {
                        font-size: 24px;
                        font-weight: 700;
                        color: ${branding.brandColor};
                        margin: 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    .company-tagline {
                        font-size: 11px;
                        color: #6b7280;
                        margin-top: 2px;
                    }

                    .company-contact-info {
                        margin-top: 8px;
                        font-size: 10px;
                        color: #6b7280;
                        line-height: 1.5;
                    }

                    .company-contact-info p {
                        margin: 2px 0;
                    }

                    .quote-main-info {
                        text-align: right;
                    }

                    .quote-label {
                        font-size: 40px;
                        font-weight: 900;
                        color: #10b981;
                        margin: 0 0 15px 0;
                        letter-spacing: -1px;
                        line-height: 1;
                    }

                    .quote-meta-grid {
                        display: grid;
                        grid-template-columns: auto auto;
                        gap: 8px 20px;
                        text-align: right;
                    }

                    .meta-label {
                        font-size: 11px;
                        font-weight: 600;
                        color: #9ca3af;
                        text-transform: uppercase;
                    }

                    .meta-value {
                        font-size: 13px;
                        font-weight: 600;
                        color: #111827;
                    }

                    .bill-to-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                    }

                    .bill-to-label {
                        font-size: 11px;
                        font-weight: 700;
                        color: #111827;
                        text-transform: uppercase;
                        margin-bottom: 8px;
                        display: block;
                    }

                    .client-name {
                        font-size: 16px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0 0 5px 0;
                    }

                    .total-section {
                        margin-top: 40px;
                        text-align: right;
                    }

                    .total-label {
                        font-size: 14px;
                        font-weight: 600;
                        color: #6b7280;
                        margin-bottom: 8px;
                    }

                    .total-value {
                        font-size: 32px;
                        font-weight: 800;
                        color: #10b981;
                    }

                    .validity-section {
                        margin-top: 40px;
                        padding: 20px;
                        background: #111827;
                        border-radius: 12px;
                    }

                    .validity-label {
                        font-size: 12px;
                        font-weight: 700;
                        color: #6b7280;
                        text-transform: uppercase;
                        margin-bottom: 8px;
                    }

                    .validity-text {
                        font-size: 13px;
                        color: #4b5563;
                    }

                    @media print {
                        @page { size: A4; margin: 0; }
                        body { 
                            background: white; 
                            margin: 0;
                            padding: 0;
                        }
                        .page { 
                            margin: 0; 
                            box-shadow: none; 
                            width: 100%;
                            height: auto;
                            min-height: auto;
                            padding: 30px 25px;
                            border: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="top-header">
                        <div class="company-branding">
                            <div class="brand-logo-name">
                                <h1>${branding.companyName}</h1>
                            </div>
                            <div class="company-tagline">${branding.companyTagline}</div>
                            <div class="company-contact-info">
                                <p>${branding.companyAddress}</p>
                                <p>${branding.companyPhone}</p>
                                <p>${branding.companyEmail}</p>
                            </div>
                        </div>

                        <div class="quote-main-info">
                            <h1 class="quote-label">QUOTE</h1>
                            <div class="quote-meta-grid">
                                <div class="meta-label">Quote No</div>
                                <div class="meta-value">${quote.quoteNumber}</div>
                                <div class="meta-label">Date</div>
                                <div class="meta-value">${quote.date}</div>
                            </div>
                        </div>
                    </div>

                    <div class="bill-to-section">
                        <div>
                            <span class="bill-to-label">QUOTE FOR:</span>
                            <h3 class="client-name">${quote.clientName}</h3>
                        </div>
                    </div>

                    <div class="total-section">
                        <div class="total-label">Total Quote Amount</div>
                        <div class="total-value">${formatCurrency(quote.total, quote.currency)}</div>
                    </div>

                    <div class="validity-section">
                        <div class="validity-label">Quote Validity</div>
                        <div class="validity-text">This quote is valid for 30 days from the date of issue.</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Inject html2pdf script
        const script = `
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <script>
                window.onload = function() {
                    const element = document.querySelector('.page');
                    const opt = {
                        margin: 0,
                        filename: '${quote.clientName}_${quote.quoteNumber}.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save();
                }
            </script>
        `;

        const pdfStyles = `
            <style>
                @page { size: A4; margin: 0; }
                body { background: white !important; margin: 0 !important; padding: 0 !important; min-height: auto !important; }
                .page { 
                    margin: 0 !important; 
                    box-shadow: none !important; 
                    width: 210mm !important;
                    min-height: auto !important;
                    height: auto !important;
                    padding: 30px 25px !important;
                    border: none !important;
                }
            </style>
        `;

        const finalHTML = quoteHTML.replace('</body>', `${pdfStyles}${script}</body>`);

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '-10000px';
        iframe.style.top = '0';
        iframe.style.width = '210mm';
        iframe.style.height = '297mm';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(finalHTML);
            iframeDoc.close();
        }

        // Clean up iframe after a delay
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 5000);
    };

    return (
        <div className="billing-container">
            {/* Header */}
            <header className="billing-header">
                <div className="billing-header-content">
                    <h1>💼 Billing & Invoicing</h1>
                    <p>Manage invoices, quotes, expenses, and time tracking</p>
                </div>
                {userRole === 'admin' && (
                    <button
                        onClick={() => router.push('/admin')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <span>⬅️</span> Back to Admin
                    </button>
                )}
            </header>

            {/* Navigation */}
            <nav className="billing-nav">
                <button
                    className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                >
                    📊 Dashboard
                </button>
                <button
                    className={`nav-btn ${activeTab === "invoices" ? "active" : ""}`}
                    onClick={() => setActiveTab("invoices")}
                >
                    📄 Invoices
                </button>
                <button
                    className={`nav-btn ${activeTab === "quotes" ? "active" : ""}`}
                    onClick={() => setActiveTab("quotes")}
                >
                    📋 Quotes
                </button>
                <button
                    className={`nav-btn ${activeTab === "expenses" ? "active" : ""}`}
                    onClick={() => setActiveTab("expenses")}
                >
                    💰 Expenses
                </button>
                <button
                    className={`nav-btn ${activeTab === "time" ? "active" : ""}`}
                    onClick={() => setActiveTab("time")}
                >
                    ⏱️ Time Tracking
                </button>
                <button
                    className={`nav-btn ${activeTab === "settings" ? "active" : ""}`}
                    onClick={() => setActiveTab("settings")}
                >
                    ⚙️ Settings
                </button>
            </nav>

            {/* Main Content */}
            <main className="billing-main">

                {/* Dashboard Tab */}
                {activeTab === "dashboard" && (
                    <div className="dashboard">
                        <h2>Dashboard Overview</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📄</div>
                                <div className="stat-info">
                                    <h3>{invoices.length}</h3>
                                    <p>Total Invoices</p>
                                </div>
                            </div>
                            <div className="stat-card success">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <h3>{invoices.filter(i => i.status === "paid").length}</h3>
                                    <p>Paid Invoices</p>
                                </div>
                            </div>
                            <div className="stat-card warning">
                                <div className="stat-icon">📋</div>
                                <div className="stat-info">
                                    <h3>{quotes.length}</h3>
                                    <p>Active Quotes</p>
                                </div>
                            </div>
                            <div className="stat-card revenue">
                                <div className="stat-icon">💰</div>
                                <div className="stat-info">
                                    <h3>{formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0), defaultCurrency)}</h3>
                                    <p>Total Revenue</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ marginTop: "3rem" }}>
                            <h3 style={{ color: "Black", fontSize: "1.5rem", marginBottom: "1.5rem" }}>Quick Actions</h3>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                                gap: "1.5rem"
                            }}>
                                <button
                                    onClick={() => { setActiveTab("invoices"); createNewInvoice(); }}
                                    className="stat-card"
                                    style={{ cursor: "pointer", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}
                                >
                                    <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>➕ Create Invoice</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("quotes")}
                                    className="stat-card"
                                    style={{ cursor: "pointer", justifyContent: "center", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white" }}
                                >
                                    <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>➕ Create Quote</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoices Tab */}
                {activeTab === "invoices" && (
                    <div className="invoices-section">
                        {!showInvoiceForm ? (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                    <h2 style={{ margin: 0 }}>Invoices</h2>
                                    <button
                                        onClick={createNewInvoice}
                                        style={{
                                            padding: "0.875rem 2rem",
                                            background: `linear-gradient(135deg, ${branding.brandColor} 0%, #764ba2 100%)`,
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontWeight: "600",
                                            fontSize: "1rem",
                                            cursor: "pointer",
                                            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem"
                                        }}
                                    >
                                        <span style={{ fontSize: "1.2rem" }}>➕</span>
                                        Create Invoice
                                    </button>
                                </div>

                                <div className="invoice-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Invoice #</th>
                                                <th>Client</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>No invoices found. Create your first one!</td>
                                                </tr>
                                            ) : (
                                                invoices.map(invoice => (
                                                    <tr key={invoice.id}>
                                                        <td>{invoice.invoiceNumber}</td>
                                                        <td>{invoice.clientName || "Unknown Client"}</td>
                                                        <td>{invoice.issueDate}</td>
                                                        <td>{formatCurrency(invoice.total, invoice.currency)}</td>
                                                        <td>
                                                            <select
                                                                className={`status-select status-${invoice.status}`}
                                                                value={invoice.status}
                                                                onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value as Invoice['status'])}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <option value="draft">Draft</option>
                                                                <option value="sent">Sent</option>
                                                                <option value="payment_pending">Payment Pending</option>
                                                                <option value="partial_payment">Partial Payment</option>
                                                                <option value="paid">Paid</option>
                                                                <option value="overdue">Overdue</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </td>
                                                        <td style={{ display: "flex", gap: "0.5rem" }}>
                                                            <button className="btn-icon" title="View" onClick={() => viewInvoice(invoice)}>👁️</button>
                                                            <button className="btn-icon" title="Edit" onClick={() => editInvoice(invoice)}>✏️</button>
                                                            <button className="btn-icon" title="Download" onClick={() => downloadInvoice(invoice)}>📥</button>
                                                            <button className="btn-icon" title="Delete" onClick={() => deleteInvoice(invoice.id)} style={{ color: '#ef4444' }}>🗑️</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <InvoiceForm
                                invoice={currentInvoice}
                                onUpdate={setCurrentInvoice}
                                onSave={saveInvoice}
                                onCancel={() => setShowInvoiceForm(false)}
                                branding={branding}
                            />
                        )}
                    </div>
                )}

                {/* Quotes Tab */}
                {activeTab === "quotes" && (
                    <div className="invoices-section">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <h2 style={{ margin: 0 }}>Quotes</h2>
                            <button
                                style={{
                                    padding: "0.875rem 2rem",
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                    fontSize: "1rem",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)"
                                }}
                            >
                                ➕ Create Quote
                            </button>
                        </div>

                        <div className="invoice-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Quote #</th>
                                        <th>Client</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotes.map(quote => (
                                        <tr key={quote.id}>
                                            <td>{quote.quoteNumber}</td>
                                            <td>{quote.clientName}</td>
                                            <td>{quote.date}</td>
                                            <td>{formatCurrency(quote.total, quote.currency)}</td>
                                            <td>
                                                <span className={`status-badge status-${quote.status}`}>
                                                    {quote.status}
                                                </span>
                                            </td>
                                            <td style={{ display: "flex", gap: "0.5rem" }}>
                                                {quote.status === "pending" && (
                                                    <button className="btn-icon" title="Convert to Invoice" onClick={() => convertQuoteToInvoice(quote)}>🔄</button>
                                                )}
                                                <button className="btn-icon" title="View">👁️</button>
                                                <button className="btn-icon" title="Download" onClick={() => downloadQuote(quote)}>📥</button>
                                                <button className="btn-icon" title="Delete" style={{ color: '#ef4444' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Expenses Tab */}
                {activeTab === "expenses" && (
                    <div className="invoices-section">
                        <h2>Expense Tracking</h2>
                        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#6b7280" }}>
                            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💰</div>
                            <h3>Expense Tracking Coming Soon</h3>
                            <p>Track your business expenses and attach them to invoices automatically.</p>
                        </div>
                    </div>
                )}

                {/* Time Tracking Tab */}
                {activeTab === "time" && (
                    <div className="invoices-section">
                        <h2>Time Tracking</h2>
                        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#6b7280" }}>
                            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⏱️</div>
                            <h3>Time Tracking Coming Soon</h3>
                            <p>Log your time and convert billable hours directly into invoices.</p>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                    <div className="templates-section">
                        <h2>⚙️ Settings</h2>

                        <div className="template-editor">
                            {/* Branding Settings */}
                            <div className="template-settings">
                                <h3>🎨 Branding Customization</h3>

                                {/* Logo Upload */}
                                <div className="form-group">
                                    <label>Company Logo</label>
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} />
                                    {branding.logo && (
                                        <div className="logo-preview">
                                            <img src={branding.logo} alt="Logo" />
                                            <button
                                                className="btn-remove"
                                                onClick={() => setBranding({ ...branding, logo: "" })}
                                                style={{ marginTop: "0.5rem" }}
                                            >
                                                Remove Logo
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Brand Color */}
                                <div className="form-group" style={{ marginTop: "1.5rem" }}>
                                    <label>Brand Color</label>
                                    <input
                                        type="color"
                                        value={branding.brandColor}
                                        onChange={(e) => setBranding({ ...branding, brandColor: e.target.value })}
                                        style={{ width: "100%", height: "50px", cursor: "pointer" }}
                                    />
                                </div>

                                {/* Company Info */}
                                <div className="form-group" style={{ marginTop: "1.5rem" }}>
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        value={branding.companyName}
                                        onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: "1rem" }}>
                                    <label>Company Email</label>
                                    <input
                                        type="email"
                                        value={branding.companyEmail}
                                        onChange={(e) => setBranding({ ...branding, companyEmail: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: "1rem" }}>
                                    <label>Company Phone</label>
                                    <input
                                        type="tel"
                                        value={branding.companyPhone}
                                        onChange={(e) => setBranding({ ...branding, companyPhone: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: "1rem" }}>
                                    <label>Company Address</label>
                                    <textarea
                                        value={branding.companyAddress}
                                        onChange={(e) => setBranding({ ...branding, companyAddress: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                {/* Payment Gateway */}
                                <div className="form-group" style={{ marginTop: "2rem" }}>
                                    <label>💳 Payment Gateway</label>
                                    <select
                                        value={paymentGateway}
                                        onChange={(e) => setPaymentGateway(e.target.value as any)}
                                    >
                                        <option value="stripe">Stripe</option>
                                        <option value="paypal">PayPal</option>
                                        <option value="razorpay">Razorpay (India)</option>
                                    </select>
                                </div>

                                {/* Default Currency */}
                                <div className="form-group" style={{ marginTop: "1rem" }}>
                                    <label>🌍 Default Currency</label>
                                    <select
                                        value={defaultCurrency}
                                        onChange={(e) => setDefaultCurrency(e.target.value as any)}
                                    >
                                        <option value="INR">INR (₹) - Indian Rupee</option>
                                        <option value="AED">AED (د.إ) - UAE Dirham</option>
                                        <option value="USD">USD ($) - US Dollar</option>
                                    </select>
                                </div>

                                <div style={{
                                    marginTop: "1.5rem",
                                    padding: "1rem",
                                    background: "#f0fdf4",
                                    borderRadius: "8px",
                                    border: "1px solid #86efac"
                                }}>
                                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#166534" }}>
                                        ✅ Settings are automatically saved
                                    </p>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="template-preview">
                                <h3>📄 Invoice Preview</h3>
                                <div style={{
                                    padding: "2rem",
                                    background: "#f5f5f5",
                                    borderRadius: "12px",
                                    border: "2px solid #e5e7eb"
                                }}>
                                    <div style={{ background: "white", padding: "2rem", borderRadius: "8px" }}>
                                        {/* Header */}
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
                                            <div>
                                                {branding.logo && (
                                                    <img src={branding.logo} alt="Logo" style={{ maxWidth: "150px", maxHeight: "60px", marginBottom: "1rem" }} />
                                                )}
                                                <h3 style={{ margin: "0.5rem 0", color: branding.brandColor }}>{branding.companyName}</h3>
                                                <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#6b7280" }}>{branding.companyEmail}</p>
                                                <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#6b7280" }}>{branding.companyPhone}</p>
                                                <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#6b7280" }}>{branding.companyAddress}</p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <h1 style={{ margin: 0, fontSize: "2rem", color: branding.brandColor }}>INVOICE</h1>
                                                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>Issue Date: {new Date().toLocaleDateString()}</p>
                                                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>Invoice No: SAMPLE-001</p>
                                            </div>
                                        </div>

                                        {/* Sample Content */}
                                        <div style={{ padding: "1rem", background: "#f9fafb", borderRadius: "8px", marginTop: "1rem" }}>
                                            <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280", textAlign: "center" }}>
                                                Your branded invoice will appear here
                                            </p>
                                        </div>

                                        {/* Payment Info */}
                                        <div style={{ marginTop: "2rem", padding: "1rem", background: "#f0f9ff", borderRadius: "8px" }}>
                                            <p style={{ margin: 0, fontSize: "0.875rem", color: "#0369a1" }}>
                                                <strong>Payment Gateway:</strong> {paymentGateway.charAt(0).toUpperCase() + paymentGateway.slice(1)}
                                            </p>
                                            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "#0369a1" }}>
                                                <strong>Currency:</strong> {defaultCurrency}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
