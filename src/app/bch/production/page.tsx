"use client";

import React from 'react';
import ComingSoon from '../shared/ComingSoon';

export default function ProductionDashboardPage() {
    return (
        <div style={{ padding: '2rem' }}>
            <ComingSoon 
                title="Production & Quality Control" 
                description="We are developing the quality control and staging module. This will include staging listings, automated model verification, and barcode print controls."
            />
        </div>
    );
}
