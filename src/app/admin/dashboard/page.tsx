"use client";

import React from "react";
import DashboardOverview from "./DashboardOverview";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();

    const handleSetActiveSection = (section: string) => {
        // Map old section IDs to new routes
        const routeMap: Record<string, string> = {
            'products-list': '/admin/inventory',
            'orders-all': '/admin/orders',
            'invoicing-all': '/admin/billing',
        };

        const targetRoute = routeMap[section] || `/admin/${section.replace(/-/g, '/')}`;
        router.push(targetRoute);
    };

    return <DashboardOverview setActiveSection={handleSetActiveSection} />;
}
