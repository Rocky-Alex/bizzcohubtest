"use client";

import React from 'react';
import ComingSoon from '../../shared/ComingSoon';

export default function PurchasesDashboardPage() {
    return (
        <div style={{ padding: '2rem' }}>
            <ComingSoon 
                title="Purchases & Supplier Lot Management" 
                description="We are developing the purchases portal. This will include supplier invoices recording, lot imports, currency adjustments, and lot costing sheets."
            />
        </div>
    );
}
