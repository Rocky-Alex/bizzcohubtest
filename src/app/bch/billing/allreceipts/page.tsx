"use client";

import React from "react";
import ReceiptList from "../../invoicing/ReceiptList";
import { useRouter } from "next/navigation";

export default function AllReceiptsPage() {
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

    return <ReceiptList setActiveSection={handleSetActiveSection} />;
}
