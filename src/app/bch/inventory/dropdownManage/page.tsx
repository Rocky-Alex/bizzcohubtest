"use client";

import React from "react";
import DropListUpdates from "../../inventory/components/DropListUpdates/DropListUpdates";

export default function DropdownManagePage() {
    return (
        <div className="inventory-page-container" style={{ padding: '0.5rem' }}>
            <DropListUpdates />
        </div>
    );
}
