"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../../components/LoadingSpinner";

const ComingSoon = dynamic(() => import("../../components/ComingSoon"));

export default function SalesReportPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <ComingSoon title="Sales Report" description="Comprehensive sales analytics and reporting are coming soon." />
        </div>
    );
}
