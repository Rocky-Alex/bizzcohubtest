"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../components/LoadingSpinner";

const QuotationList = dynamic(() => import("../../components/QuotationList"), { loading: () => <LoadingSpinner /> });

export default function QuotationsListPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <QuotationList setActiveSection={() => { }} onEdit={() => { }} />
        </div>
    );
}
