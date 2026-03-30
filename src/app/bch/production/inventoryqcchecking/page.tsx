"use client";

import React from "react";
import InventoryQCChecking from "../../production/components/InventoryQCChecking/InventoryQCChecking";

export default function InventoryQCCheckingPage() {
    return (
        <div className="production-page-container" style={{ padding: '0.5rem' }}>
            <InventoryQCChecking />
        </div>
    );
}
