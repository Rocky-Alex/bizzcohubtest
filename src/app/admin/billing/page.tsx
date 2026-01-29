"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../components/LoadingSpinner";
import { useRouter } from "next/navigation";

const InvoicingDashboard = dynamic(() => import("../components/InvoicingDashboard"), { loading: () => <LoadingSpinner /> });

export default function BillingDashboardPage() {
    const router = useRouter();

    const handleSectionChange = (section: string) => {
        if (section === 'invoicing-new') router.push('/admin/billing/invoices/new');
        else if (section === 'create-quotation') router.push('/admin/billing/quotations/new');
        else router.push(`/admin/billing?section=${section}`);
    };

    return (
        <div style={{ padding: '1rem' }}>
            <InvoicingDashboard setActiveSection={handleSectionChange} />
        </div>
    );
}
