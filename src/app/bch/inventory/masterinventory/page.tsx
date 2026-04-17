"use client";

import React from "react";
import QCInventory from "../../inventory/components/QCInventory/QCInventory";

export default function MasterInventoryPage() {
    return (
        <div className="inventory-page-container" style={{ padding: '0.5rem' }}>
            <QCInventory />
        </div>
    );
}
