"use client";

import React from "react";
import ReprintBarcode from "../../production/components/ReprintBarcode/ReprintBarcode";

export default function ReprintBarcodePage() {
    return (
        <div className="production-page-container" style={{ padding: '0.5rem' }}>
            <ReprintBarcode />
        </div>
    );
}
