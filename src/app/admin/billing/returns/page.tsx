"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../../components/LoadingSpinner";

const InvoiceReturn = dynamic(() => import("../../components/InvoiceReturn"), { loading: () => <LoadingSpinner /> });

export default function InvoiceReturnPage() {
    const handleSetActiveSection = (section: string) => {
        // Handle navigation if needed by the component
        console.log("Navigate to", section);
    };

    return (
        <div style={{ padding: '1rem' }}>
            <InvoiceReturn setActiveSection={handleSetActiveSection} />
        </div>
    );
}
