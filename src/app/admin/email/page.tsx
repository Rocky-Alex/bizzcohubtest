"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../components/LoadingSpinner";

const ComingSoon = dynamic(() => import("../components/ComingSoon"));

export default function EmailPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <ComingSoon title="Email Inbox" description="Email management and integration is coming soon." />
        </div>
    );
}
