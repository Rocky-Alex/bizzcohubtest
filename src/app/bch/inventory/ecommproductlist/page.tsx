"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ProductList from "../../inventory/components/ProductList/ProductList";

export default function EcommProductListPage() {
    const router = useRouter();

    const handleSetActiveSection = (section: string) => {
        const routeMap: Record<string, string> = {
            'inventory-dashboard': '/bch/inventory/inventorydashboard',
            'products-list': '/bch/inventory/ecommproductlist',
            'add-product': '/bch/inventory/addecommproduct',
            'inventory-qc': '/bch/inventory/inventoryqclist'
        };
        const target = routeMap[section] || `/bch/inventory/inventorydashboard`;
        router.push(target);
    };

    const handleEditProduct = (product: any) => {
        // We'll navigate to add-product with an edit flag and ID
        router.push(`/bch/inventory/addecommproduct?edit=true&id=${product.id}`);
    };

    return (
        <div className="inventory-page-container" style={{ padding: '0.5rem' }}>
            <ProductList 
                setActiveSection={handleSetActiveSection}
                onEdit={handleEditProduct}
            />
        </div>
    );
}
