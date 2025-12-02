"use client";

import { useState, useEffect } from "react";
import "./billing-styles.css";
import InvoiceForm from "./InvoiceForm";

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
    clientEmail: string;
    clientAddress: string;
    issueDate: string;
    items: LineItem[];
    subtotal: number;
    vat: number;
    discount: number;
    total: number;
    currency: "INR" | "AED" | "USD";
    status: "draft" | "sent" | "paid" | "overdue";
    paymentMethods: string[];
    terms: string;
}

interface Quote {
    id: string;
    quoteNumber: string;
    clientName: string;
    clientEmail: string;
    date: string;
    validUntil: string;
    items: LineItem[];
    subtotal: number;
    vat: number;
    total: number;
    currency: "INR" | "AED" | "USD";
    status: "draft" | "sent" | "approved" | "rejected" | "converted";
}

interface Expense {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    currency: "INR" | "AED" | "USD";
    invoiceId?: string;
}

interface TimeEntry {
    id: string;
    date: string;
    project: string;
    task: string;
    hours: number;
    rate: number;
    amount: number;
    currency: "INR" | "AED" | "USD";
    invoiceId?: string;
}

export default function BillingPage() {
    const [activeTab, setActiveTab] = useState<"dashboard" | "invoices" | "quotes" | "expenses" | "time" | "settings">("dashboard");

    // Branding Settings
    const [branding, setBranding] = useState<BrandingSettings>({
        logo: "",
        brandColor: "#677ce4ff",
        companyName: "BIZZ CO HUB",
        companyEmail: "info@bizzcohub.com",
        companyPhone: "+990-2545-9809-000",
        companyAddress: "Mumbai, Maharashtra, India",
        companyTagline: "Your Business Partner",
    });

    // Payment Integration
    const [paymentGateway, setPaymentGateway] = useState<"stripe" | "paypal" | "razorpay">("stripe");

    // Currency
    const [defaultCurrency, setDefaultCurrency] = useState<"INR" | "AED" | "USD">("INR");

    // Show/Hide Invoice Form
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);

    // View Invoice Details
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

    // Current Invoice Being Created
    const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
        clientName: "",
        clientWebsite: "",
        clientEmail: "",
        clientAddress: "",
        issueDate: new Date().toISOString().split('T')[0],
        items: [
            { description: "", details: "", unitPrice: 0, quantity: 1, total: 0 }
        ],
        subtotal: 0,
        vat: 0,
        discount: 0,
        total: 0,
        currency: defaultCurrency,
        status: "draft",
        paymentMethods: [
            "PayPal: payments@bizzcohub.com",
            "Credit Card: Visa, MasterCard, Amex",
            "Bank Transfer: Available"
        ],
        terms: "Payment is due within 30 days. Late payments may incur additional charges."
    });

    // Sample Data
    const [invoices, setInvoices] = useState<Invoice[]>([
        {
            id: "1",
            invoiceNumber: "A-0090-8876-00976",
            clientName: "Sunlite Software Firm",
            clientWebsite: "+1 (310) 555-0123",
            clientEmail: "client@sunlite.com",
            clientAddress: "3559 Brannan Street, Los Angeles, CA 90017",
            issueDate: "2024-12-12",
            items: [
                {
                    description: "Web Development",
                    details: "Full-stack web application development",
                    unitPrice: 550,
                    quantity: 2,
                    total: 1100
                },
                {
                    description: "Graphics Design Template",
                    details: "Custom graphic design templates",
                    unitPrice: 750,
                    quantity: 3,
                    total: 2250
                }
            ],
            subtotal: 8250,
            vat: 990,
            discount: 250,
            total: 7250,
            currency: "USD",
            status: "sent",
            paymentMethods: [
                "PayPal: payments@bizzcohub.com",
                "Credit Card: Visa, MasterCard, Amex",
                "Bank Transfer: Available"
            ],
            terms: "Payment is due within 30 days. Late payments may incur additional charges."
        }
    ]);

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

    // Load settings from localStorage
    useEffect(() => {
        const savedBranding = localStorage.getItem("billingBranding");
        if (savedBranding) {
            setBranding(JSON.parse(savedBranding));
        }
        const savedGateway = localStorage.getItem("paymentGateway");
        if (savedGateway) {
            setPaymentGateway(savedGateway as any);
        }
        const savedCurrency = localStorage.getItem("defaultCurrency");
        if (savedCurrency) {
            setDefaultCurrency(savedCurrency as any);
        }
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem("billingBranding", JSON.stringify(branding));
    }, [branding]);

    useEffect(() => {
        localStorage.setItem("paymentGateway", paymentGateway);
    }, [paymentGateway]);

    useEffect(() => {
        localStorage.setItem("defaultCurrency", defaultCurrency);
    }, [defaultCurrency]);

    // Currency formatting
    const formatCurrency = (amount: number, currency: "INR" | "AED" | "USD") => {
        const symbols = {
            INR: "₹",
            AED: "د.إ",
            USD: "$"
        };
        return `${symbols[currency]} ${amount.toLocaleString()}`;
    };

    // Logo upload handler
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

    // Convert quote to invoice
    const convertQuoteToInvoice = (quote: Quote) => {
        const newInvoice: Invoice = {
            id: Date.now().toString(),
            invoiceNumber: `INV-${Date.now()}`,
            clientName: quote.clientName,
            clientEmail: quote.clientEmail,
            clientAddress: "",
            issueDate: new Date().toISOString().split('T')[0],
            items: quote.items,
            subtotal: quote.subtotal,
            vat: quote.vat,
            discount: 0,
            total: quote.total,
            currency: quote.currency,
            status: "draft",
            paymentMethods: [],
            terms: ""
        };
        setInvoices([...invoices, newInvoice]);
        // Update quote status
        setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status: "converted" as const } : q));
        setActiveTab("invoices");
    };

    // Save Invoice
    const saveInvoice = () => {
        if (!currentInvoice.clientName) {
            alert("Please fill in the required field: Client Name");
            return;
        }

        const newInvoice: Invoice = {
            id: Date.now().toString(),
            invoiceNumber: `A-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 100000)}`,
            clientName: currentInvoice.clientName!,
            clientWebsite: currentInvoice.clientWebsite,
            clientEmail: currentInvoice.clientEmail!,
            clientAddress: currentInvoice.clientAddress!,
            issueDate: currentInvoice.issueDate!,
            items: currentInvoice.items!,
            subtotal: currentInvoice.subtotal!,
            vat: currentInvoice.vat!,
            discount: currentInvoice.discount!,
            total: currentInvoice.total!,
            currency: currentInvoice.currency!,
            status: "draft",
            paymentMethods: currentInvoice.paymentMethods!,
            terms: currentInvoice.terms!
        };

        setInvoices([...invoices, newInvoice]);
        setShowInvoiceForm(false);

        // Reset form
        setCurrentInvoice({
            clientName: "",
            clientWebsite: "",
            clientEmail: "",
            clientAddress: "",
            issueDate: new Date().toISOString().split('T')[0],
            items: [
                { description: "", details: "", unitPrice: 0, quantity: 1, total: 0 }
            ],
            subtotal: 0,
            vat: 0,
            discount: 0,
            total: 0,
            currency: defaultCurrency,
            status: "draft",
            paymentMethods: [
                "PayPal: payments@bizzcohub.com",
                "Credit Card: Visa, MasterCard, Amex",
                "Bank Transfer: Available"
            ],
            terms: "Payment is due within 30 days. Late payments may incur additional charges."
        });
    };

    // Delete Invoice
    const deleteInvoice = (invoiceId: string) => {
        if (confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
            setInvoices(invoices.filter(inv => inv.id !== invoiceId));
        }
    };

    // View Invoice
    const viewInvoice = (invoice: Invoice) => {
        setViewingInvoice(invoice);
    };

    // Download Invoice as PDF (simplified version - generates HTML and triggers print)
    const downloadInvoice = (invoice: Invoice) => {
        const invoiceHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoiceNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .company-info { font-size: 14px; }
                    .invoice-title { font-size: 32px; font-weight: bold; color: ${branding.brandColor}; }
                    .client-info { margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: ${branding.brandColor}; color: white; }
                    .totals { margin-top: 20px; text-align: right; }
                    .total-row { display: flex; justify-content: flex-end; gap: 100px; margin: 10px 0; }
                    .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-info">
                        <h2>${branding.companyName}</h2>
                        <p>${branding.companyEmail}</p>
                        <p>${branding.companyPhone}</p>
                        <p>${branding.companyAddress}</p>
                    </div>
                    <div>
                        <div class="invoice-title">INVOICE</div>
                        <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                        <p><strong>Date:</strong> ${invoice.issueDate}</p>
                    </div>
                </div>
                
                <div class="client-info">
                    <h3>Invoice To:</h3>
                    <p><strong>${invoice.clientName}</strong></p>
                    ${invoice.clientEmail ? `<p>Email: ${invoice.clientEmail}</p>` : ''}
                    ${invoice.clientWebsite ? `<p>Phone: ${invoice.clientWebsite}</p>` : ''}
                    ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ''}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Details</th>
                            <th>Unit Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.details}</td>
                                <td>${formatCurrency(item.unitPrice, invoice.currency)}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.total, invoice.currency)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <strong>${formatCurrency(invoice.subtotal, invoice.currency)}</strong>
                    </div>
                    <div class="total-row">
                        <span>VAT:</span>
                        <strong>${formatCurrency(invoice.vat, invoice.currency)}</strong>
                    </div>
                    <div class="total-row">
                        <span>Discount:</span>
                        <strong>- ${formatCurrency(invoice.discount, invoice.currency)}</strong>
                    </div>
                    <div class="total-row grand-total">
                        <span>Grand Total:</span>
                        <strong>${formatCurrency(invoice.total, invoice.currency)}</strong>
                    </div>
                </div>
                
                ${invoice.paymentMethods && invoice.paymentMethods.length > 0 ? `
                    <div style="margin-top: 30px;">
                        <h4>Payment Methods:</h4>
                        ${invoice.paymentMethods.map(method => `<p>• ${method}</p>`).join('')}
                    </div>
                ` : ''}
                
                ${invoice.terms ? `
                    <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid ${branding.brandColor};">
                        <h4>Terms & Conditions:</h4>
                        <p>${invoice.terms}</p>
                    </div>
                ` : ''}
            </body>
            </html>
        `;

        // Create a new window and print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(invoiceHTML);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    return (
        <div className="billing-container">
            {/* Header */}
            <header className="billing-header">
                <div className="billing-header-content">
                    <h1>💼 Billing & Invoicing</h1>
                    <p>Manage invoices, quotes, expenses, and time tracking</p>
                </div>
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
                            <h3 style={{ color: "white", fontSize: "1.5rem", marginBottom: "1.5rem" }}>Quick Actions</h3>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                                gap: "1.5rem"
                            }}>
                                <button
                                    onClick={() => setActiveTab("invoices")}
                                    style={{
                                        padding: "1.5rem",
                                        background: "linear-gradient(135deg, hsla(229, 76%, 66%, 1.00) 0%, #764ba2 100%)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "12px",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                                        transition: "all 0.3s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.75rem"
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                                    }}
                                >
                                    <span style={{ fontSize: "1.5rem" }}>➕</span>
                                    Add Invoice
                                </button>

                                <button
                                    onClick={() => setActiveTab("quotes")}
                                    style={{
                                        padding: "1.5rem",
                                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "12px",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                                        transition: "all 0.3s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.75rem"
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.6)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
                                    }}
                                >
                                    <span style={{ fontSize: "1.5rem" }}>➕</span>
                                    Add Quote
                                </button>

                                <button
                                    onClick={() => setActiveTab("invoices")}
                                    style={{
                                        padding: "1.5rem",
                                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "12px",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                                        transition: "all 0.3s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.75rem"
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(245, 158, 11, 0.6)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
                                    }}
                                >
                                    <span style={{ fontSize: "1.5rem" }}>🔄</span>
                                    Update Invoice
                                </button>

                                <button
                                    onClick={() => setActiveTab("quotes")}
                                    style={{
                                        padding: "1.5rem",
                                        background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "12px",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
                                        transition: "all 0.3s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.75rem"
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.6)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
                                    }}
                                >
                                    <span style={{ fontSize: "1.5rem" }}>🔄</span>
                                    Update Quote
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
                                        onClick={() => setShowInvoiceForm(true)}
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
                                            {invoices.map(invoice => (
                                                <tr key={invoice.id}>
                                                    <td>{invoice.invoiceNumber}</td>
                                                    <td>{invoice.clientName}</td>
                                                    <td>{invoice.issueDate}</td>
                                                    <td>{formatCurrency(invoice.total, invoice.currency)}</td>
                                                    <td>
                                                        <span className={`status-badge status-${invoice.status}`}>
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn-icon" onClick={() => viewInvoice(invoice)}>👁️</button>
                                                        <button className="btn-icon" onClick={() => deleteInvoice(invoice.id)}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <InvoiceForm
                                invoice={currentInvoice as Invoice}
                                onUpdate={(inv) => setCurrentInvoice(inv)}
                                onSave={saveInvoice}
                                onCancel={() => setShowInvoiceForm(false)}
                                branding={branding}
                            />
                        )}
                    </div>
                )
                }

                {/* Quotes Tab */}
                {
                    activeTab === "quotes" && (
                        <div className="invoices-section">
                            <h2>Quotes</h2>
                            <p>Quote management coming soon...</p>
                        </div>
                    )
                }

                {/* Expenses Tab */}
                {
                    activeTab === "expenses" && (
                        <div className="invoices-section">
                            <h2>Expenses</h2>
                            <p>Expense tracking coming soon...</p>
                        </div>
                    )
                }

                {/* Time Tab */}
                {
                    activeTab === "time" && (
                        <div className="invoices-section">
                            <h2>Time Tracking</h2>
                            <p>Time tracking coming soon...</p>
                        </div>
                    )
                }

                {/* Settings Tab */}
                {
                    activeTab === "settings" && (
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
                    )
                }
            </main >
        </div >
    );
}
