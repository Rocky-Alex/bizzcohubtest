"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useTheme } from "@/context/ThemeContext";

const InventoryDashboard = dynamic(() => import("./components/InventoryDashboard/InventoryDashboard"), { loading: () => <LoadingSpinner /> });
const ProductList = dynamic(() => import("./components/ProductList/ProductList"), { loading: () => <LoadingSpinner /> });
const AddProduct = dynamic(() => import("./components/AddProduct/AddProduct"), { loading: () => <LoadingSpinner /> });
const ImportProducts = dynamic(() => import('./components/ImportProducts/ImportProducts'), { loading: () => <LoadingSpinner /> });
const ImportPurchaseLot = dynamic(() => import('./components/ImportPurchaseLot/ImportPurchaseLot'), { loading: () => <LoadingSpinner /> });
const PurchaseLotList = dynamic(() => import('./components/PurchaseLotList/PurchaseLotList'), { loading: () => <LoadingSpinner /> });
const PurchaseLotDetails = dynamic(() => import('./components/PurchaseLotDetails/PurchaseLotDetails'), { loading: () => <LoadingSpinner /> });
const QCInventory = dynamic(() => import('./components/QCInventory/QCInventory'), { loading: () => <LoadingSpinner /> });
const DropListUpdates = dynamic(() => import('./components/DropListUpdates/DropListUpdates'), { loading: () => <LoadingSpinner /> });
const ComingSoon = dynamic(() => import("../shared/ComingSoon"), { loading: () => <LoadingSpinner /> });

export default function InventoryPage() {
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
        router.push(`/admin/inventory?section=${section}`);
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
            {section === 'purchase-lots-import' && <ImportPurchaseLot onCancel={() => setActiveSection('purchase-lots-list')} onSuccess={() => setActiveSection('purchase-lots-list')} />}
            {section === 'purchase-lots-list' && <PurchaseLotList onViewDetail={(id: number) => router.push(`/admin/inventory?section=purchase-lot-details&id=${id}`)} />}
            {section === 'purchase-lot-details' && <PurchaseLotDetails lotId={parseInt(searchParams.get('id') || '0')} onBack={() => setActiveSection('purchase-lots-list')} />}
            {section === 'inventory-qc' && <QCInventory />}
            {section === 'inventory-drops' && <DropListUpdates />}
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
