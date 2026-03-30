"use client";

import React from "react";
import CombinedList from "../../invoicing/CombinedList";
import { useRouter } from "next/navigation";

export default function AllBillsPage() {
    const router = useRouter();

    const handleSetActiveSection = (section: string) => {
        const routeMap: Record<string, string> = {
            'combined-all': '/bch/billing/allbills',
            'receipts-all': '/bch/billing/allreceipts',
            'receipts-new': '/bch/billing/newreceipts',
            'invoicing-create': '/bch/billing/newinvoices',
            'quotations-create': '/bch/billing/newqoutations',
            'dashboard': '/bch/billing/dashboard'
        };
        const target = routeMap[section] || `/bch/billing/${section}`;
        router.push(target);
    };

    return (
        <CombinedList 
            setActiveSection={handleSetActiveSection}
            onEditInvoice={(inv) => {
                router.push(`/bch/billing/newinvoices?id=${inv.id}`);
            }}
            onEditQuotation={(q) => {
                router.push(`/bch/billing/newqoutations?id=${q.id}`);
            }}
            onConvertQuotation={(q, items) => {
                // For conversion, we might need a more complex state management, 
                // but for now we navigate with a flag.
                // Alternatively, use session storage for complex data.
                sessionStorage.setItem('conversion_data', JSON.stringify({ ...q, items, isConversion: true }));
                router.push(`/bch/billing/newinvoices?convert=true`);
            }}
        />
    );
}
