"use client";

import React from "react";
import { useRouter } from "next/navigation";
import InventoryDashboard from "../../inventory/components/InventoryDashboard/InventoryDashboard";

export default function InventoryDashboardPage() {
    const router = useRouter();

    const handleSetActiveSection = (section: string) => {
        const routeMap: Record<string, string> = {
            'inventory-dashboard': '/bch/inventory/inventorydashboard',
            'products-list': '/bch/inventory/ecommproductlist',
            'add-product': '/bch/inventory/addecommproduct',
            'inventory-qc': '/bch/inventory/inventoryqclist',
            'inventory-drops': '/bch/inventory/dropdownManage',
            'sale-out': '/bch/inventory/soldout'
        };
        const target = routeMap[section] || `/bch/inventory/inventorydashboard`;
        router.push(target);
    };

    return (
        <div className="inventory-page-container" style={{ padding: '0.5rem' }}>
            <InventoryDashboard setActiveSection={handleSetActiveSection} />
        </div>
    );
}
