"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PurchaseDashboard from "../../purchase/components/PurchaseDashboard/PurchaseDashboard";

export default function PurchasesDashboardPage() {
    const router = useRouter();

    const handleSetActiveSection = (section: string) => {
        const routeMap: Record<string, string> = {
            'purchase-dashboard': '/bch/purchases/Dashboard',
            'purchase-lots-import': '/bch/purchases/purchaselot',
            'purchase-lots-list': '/bch/purchases/purchaselot',
            'suppliers': '/bch/purchases/suppliersmanage',
            'purchase-import-full': '/bch/purchase?section=purchase-import-full' // temporary redirection if needed
        };
        const target = routeMap[section] || `/bch/purchases/${section}`;
        router.push(target);
    };

    return (
        <div className="purchase-page-container" style={{ padding: '0.5rem' }}>
            <PurchaseDashboard setActiveSection={handleSetActiveSection} />
        </div>
    );
}
