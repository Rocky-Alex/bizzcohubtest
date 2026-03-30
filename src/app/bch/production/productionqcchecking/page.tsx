"use client";

import React from "react";
import QCChecking from "../../production/components/QCChecking/QCChecking";

export default function ProductionQCCheckingPage() {
    return (
        <div className="production-page-container" style={{ padding: '0.5rem' }}>
            <QCChecking />
        </div>
    );
}
