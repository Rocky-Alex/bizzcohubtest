"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import InvoicingDashboard from "../invoicing/InvoicingDashboard";
import InvoiceList from "../invoicing/InvoiceList";
import CreateInvoice from "../invoicing/CreateInvoice";
import QuotationList from "../invoicing/QuotationList";
import CreateQuotation from "../invoicing/CreateQuotation";
import CombinedList from "../invoicing/CombinedList";
import PartialPaymentsList from "../accounts/PartialPaymentsList";
import InvoiceReturn from "../invoicing/InvoiceReturn";
import ReceiptList from "../invoicing/ReceiptList";
import CreateReceipt from "../invoicing/CreateReceipt";

export default function BillingPage() {
    const searchParams = useSearchParams();
    const viewParam = searchParams.get('view');
    const [view, setView] = useState<'dashboard' | 'combined-all' | 'invoices-all' | 'invoices-new' | 'invoices-edit' | 'quotations-all' | 'quotations-new' | 'quotations-edit' | 'payments' | 'receipts-all' | 'receipts-new' | 'returns'>((viewParam as any) || 'dashboard');

    useEffect(() => {
        if (viewParam) setView(viewParam as any);
    }, [viewParam]);
    const [dataToEdit, setDataToEdit] = useState<any>(null);

    const handleSetActiveSection = (section: string) => {
        if (section === 'combined-all') setView('combined-all');
        else if (section === 'invoicing-all') setView('invoices-all');
        else if (section === 'invoicing-new') setView('invoices-new');
        else if (section === 'quotations-all') setView('quotations-all');
        else if (section === 'quotations-new') setView('quotations-new');
        else if (section === 'payments-all') setView('payments');
        else if (section === 'receipts-all') setView('receipts-all');
        else if (section === 'receipts-new') setView('receipts-new');
        else if (section === 'invoices-return') setView('returns');
        else setView('dashboard');
    };

    if (view === 'combined-all') return <CombinedList 
        setActiveSection={handleSetActiveSection}
        onEditInvoice={(inv) => { setDataToEdit(inv); setView('invoices-edit'); }}
        onEditQuotation={(q) => { setDataToEdit(q); setView('quotations-edit'); }}
        onConvertQuotation={(q, items) => {
            setDataToEdit({ ...q, items, isConversion: true });
            setView('invoices-new');
        }}
    />;
    if (view === 'invoices-all') return <InvoiceList setActiveSection={handleSetActiveSection} onEdit={(inv) => { setDataToEdit(inv); setView('invoices-edit'); }} />;
    if (view === 'invoices-new' || view === 'invoices-edit') return <CreateInvoice setActiveSection={handleSetActiveSection} initialData={dataToEdit} />;

    if (view === 'quotations-all') return <QuotationList 
        setActiveSection={handleSetActiveSection} 
        onEdit={(q) => { setDataToEdit(q); setView('quotations-edit'); }} 
        onConvert={(q, items) => {
            setDataToEdit({ ...q, items, isConversion: true });
            setView('invoices-new');
        }}
    />;
    if (view === 'quotations-new' || view === 'quotations-edit') return <CreateQuotation setActiveSection={handleSetActiveSection} initialData={dataToEdit} />;

    if (view === 'payments') return <PartialPaymentsList setActiveSection={handleSetActiveSection} />;
    if (view === 'receipts-all') return <ReceiptList setActiveSection={handleSetActiveSection} />;
    if (view === 'receipts-new') return <CreateReceipt setActiveSection={handleSetActiveSection} />;
    if (view === 'returns') return <InvoiceReturn setActiveSection={handleSetActiveSection} />;

    return <InvoicingDashboard setActiveSection={handleSetActiveSection} />;
}
