"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../components/LoadingSpinner";

const InvoiceList = dynamic(() => import("../../components/InvoiceList"), { loading: () => <LoadingSpinner /> });

export default function InvoicesListPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <InvoiceList setActiveSection={() => { }} onEdit={() => { }} />
        </div>
    );
}
