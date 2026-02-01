"use client";

import React from "react";
import QuickActions from "../shared/QuickActions";
import { useRouter } from "next/navigation";

export default function QuickActionsPage() {
    const router = useRouter();

    const handleSetActiveSection = (section: string) => {
        // Map section to route
        const routeMap: Record<string, string> = {

            'orders-create': '/admin/orders',
            'invoicing-new': '/admin/billing',
            'customers-add': '/admin/customers',
            'users-all': '/admin/users'
        };
        const target = routeMap[section] || `/admin/${section.replace(/-/g, '/')}`;
        router.push(target);
    };

    return <QuickActions setActiveSection={handleSetActiveSection} />;
}
