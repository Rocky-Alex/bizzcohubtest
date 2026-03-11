"use client";

import React from "react";
import DashboardOverview from "./DashboardOverview";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();

    const handleSetActiveSection = (section: string) => {
        // Map old section IDs to new routes
        const routeMap: Record<string, string> = {
            'products-list': '/bch/inventory',
            'orders-all': '/bch/orders',
            'invoicing-all': '/bch/billing',
        };

        const targetRoute = routeMap[section] || `/bch/${section.replace(/-/g, '/')}`;
        router.push(targetRoute);
    };

    return <DashboardOverview setActiveSection={handleSetActiveSection} />;
}
