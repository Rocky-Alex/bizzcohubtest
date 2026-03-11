"use client";

import React, { useState } from "react";
import AccountsDashboard from "./AccountsDashboard";
import ComingSoon from "../shared/ComingSoon";

export default function AccountsPage() {
    const [view, setView] = useState<'dashboard' | 'items' | 'sales' | 'purchases' | 'reports'>('dashboard');

    const handleSetActiveSection = (section: string) => {
        if (section === 'accounts-items') setView('items');
        else if (section === 'accounts-sales') setView('sales');
        else if (section === 'accounts-purchases') setView('purchases');
        else if (section === 'accounts-reports') setView('reports');
        else setView('dashboard');
    };

    if (view === 'items') return <ComingSoon title="Accounts Items" description="Item management for accounts is coming soon." />;
    if (view === 'sales') return <ComingSoon title="Accounts Sales" description="Sales tracking for accounts is coming soon." />;
    if (view === 'purchases') return <ComingSoon title="Accounts Purchases" description="Purchase orders management is coming soon." />;
    if (view === 'reports') return <ComingSoon title="Accounts Reports" description="Financial reporting is coming soon." />;

    return <AccountsDashboard setActiveSection={handleSetActiveSection} />;
}
