"use client";

import React from "react";
import ComingSoon from "../../shared/ComingSoon";

export default function PackingDashboardPage() {
    return (
        <div className="packing-page-container" style={{ padding: '0.5rem' }}>
            <ComingSoon
                title="Packing Dashboard"
                description="Overview of packing operations."
            />
        </div>
    );
}
