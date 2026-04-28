"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/app/components/LoadingSpinner";
// Force rebuild
import { useTheme } from "@/context/ThemeContext";

const InventoryDashboard = dynamic(() => import("./components/InventoryDashboard/InventoryDashboard"), { loading: () => <LoadingSpinner /> });
const ProductList = dynamic(() => import("./components/ProductList/ProductList"), { loading: () => <LoadingSpinner /> });
const AddProduct = dynamic(() => import("./components/AddProduct/AddProduct"), { loading: () => <LoadingSpinner /> });
const ImportProducts = dynamic(() => import('./components/ImportProducts/ImportProducts'), { loading: () => <LoadingSpinner /> });
const QCInventory = dynamic(() => import('./components/QCInventory/QCInventory'), { loading: () => <LoadingSpinner /> });
const DropListUpdates = dynamic(() => import('./components/DropListUpdates/DropListUpdates'), { loading: () => <LoadingSpinner /> });
const ComingSoon = dynamic(() => import("../shared/ComingSoon"), { loading: () => <LoadingSpinner /> });

export default function InventoryPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <InventoryPageContent />
        </Suspense>
    );
}

function InventoryPageContent() {
    const { theme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const section = searchParams.get('section') || 'inventory-dashboard';
    const [editingProduct, setEditingProduct] = useState<any>(null);

    const setActiveSection = (section: string) => {
        // Clear editing product when switching sections unless it's the edit section
        if (section !== 'edit-product' && section !== 'add-product') {
            setEditingProduct(null);
        }
        router.push(`/bch/inventory?section=${section}`);
    };

    const handleEditProduct = (product: any) => {
        setEditingProduct(product);
        setActiveSection('edit-product');
    };

    return (
        <div className="inventory-page-container" style={{ padding: '0.5rem' }}>
            {section === 'inventory-dashboard' && <InventoryDashboard setActiveSection={setActiveSection} />}
            {section === 'products-list' && (
                <ProductList
                    setActiveSection={setActiveSection}
                    onEdit={handleEditProduct}
                />
            )}
            {(section === 'add-product' || section === 'edit-product') && (
                <AddProduct
                    onCancel={() => setActiveSection('products-list')}
                    onSuccess={() => setActiveSection('products-list')}
                    initialData={section === 'edit-product' ? editingProduct : null}
                />
            )}
            {section === 'import-products' && <ImportProducts onCancel={() => setActiveSection('products-list')} onSuccess={() => setActiveSection('products-list')} />}
            {section === 'inventory-qc' && <QCInventory />}
            {section === 'inventory-drops' && <DropListUpdates />}
            {section === 'suppliers' && (
                <ComingSoon
                    title="Supplier Management"
                    description="View and manage your product suppliers."
                />
            )}
            {section === 'inventory-stock' && (
                <ComingSoon
                    title="Stock Management"
                    description="Detailed stock tracking and adjustment features."
                />
            )}
            {section === 'inventory-categories' && (
                <ComingSoon
                    title="Categories"
                    description="Manage product categories and sub-categories."
                />
            )}
        </div>
    );
}
