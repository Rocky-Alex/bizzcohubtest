"use client";

import React from "react";
import ComingSoon from "../../shared/ComingSoon";

export default function SuppliersManagePage() {
    return (
        <div className="purchase-page-container" style={{ padding: '0.5rem' }}>
            <ComingSoon
                title="Supplier Management"
                description="View and manage your product suppliers."
            />
        </div>
    );
}
