"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTheme } from "@/context/ThemeContext";

const InventoryDashboard = dynamic(() => import("../components/InventoryDashboard"), { loading: () => <LoadingSpinner /> });
const ProductList = dynamic(() => import("../components/ProductList"), { loading: () => <LoadingSpinner /> });
const AddProduct = dynamic(() => import("../components/AddProduct"), { loading: () => <LoadingSpinner /> });
const ImportProducts = dynamic(() => import('../components/ImportProducts'), { loading: () => <LoadingSpinner /> });
const ImportPurchaseLot = dynamic(() => import('../components/ImportPurchaseLot'), { loading: () => <LoadingSpinner /> });
const PurchaseLotList = dynamic(() => import('../components/PurchaseLotList'), { loading: () => <LoadingSpinner /> });
const PurchaseLotDetails = dynamic(() => import('../components/PurchaseLotDetails'), { loading: () => <LoadingSpinner /> });
const QCInventory = dynamic(() => import('../components/QCInventory'), { loading: () => <LoadingSpinner /> });
const DropListUpdates = dynamic(() => import('../components/DropListUpdates'), { loading: () => <LoadingSpinner /> });
const ComingSoon = dynamic(() => import("../components/ComingSoon"));

export default function InventoryPage() {
    const { theme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeSection, setActiveSection] = useState(searchParams.get('section') || "inventory-dashboard");
    const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
    const [productToEdit, setProductToEdit] = useState<any>(null);

    useEffect(() => {
        const section = searchParams.get('section');
        if (section) {
            setActiveSection(section);
        }
        if (section !== 'products-edit' && section !== 'products-list') {
            setProductToEdit(null);
        }
        const lotId = searchParams.get('lotId');
        if (lotId) {
            setSelectedLotId(parseInt(lotId));
        }
    }, [searchParams]);

    const handleActiveSectionChange = (section: string) => {
        if (section.startsWith('inventory-') || section.startsWith('products-') || section.startsWith('purchase-lots-') || section.startsWith('droplist-')) {
            setActiveSection(section);
            router.push(`/admin/inventory?section=${section}${selectedLotId ? `&lotId=${selectedLotId}` : ''}`);
        } else {
            router.push(`/admin?section=${section}`);
        }
    };

    const breadcrumbs = ['Home', 'Inventory'];
    const mapping: Record<string, string> = {
        'inventory-dashboard': 'Dashboard',
        'inventory-qc': 'QC Inventory',
        'products-list': 'Product List',
        'products-add': 'Add Product',
        'products-edit': 'Edit Product',
        'products-import': 'Import Products',
        'purchase-lots-import': 'Import Purchase Lot',
        'purchase-lots-list': 'Purchase Lots',
        'purchase-lots-details': 'Lot Details',
        'droplist-updates': 'DropList Updates',
    };
    if (mapping[activeSection]) {
        breadcrumbs.push(mapping[activeSection]);
    }

    const renderContent = () => {
        if (activeSection === 'inventory-dashboard') return <InventoryDashboard setActiveSection={handleActiveSectionChange} />;
        if (activeSection === 'inventory-qc') return <QCInventory />;
        if (activeSection === 'products-list') return <ProductList setActiveSection={handleActiveSectionChange} onEdit={(product) => { setProductToEdit(product); handleActiveSectionChange('products-edit'); }} />;
        if (activeSection === 'products-add') return <AddProduct onCancel={() => handleActiveSectionChange('products-list')} onSuccess={() => handleActiveSectionChange('products-list')} />;
        if (activeSection === 'products-edit') return <AddProduct initialData={productToEdit} onCancel={() => { setProductToEdit(null); handleActiveSectionChange('products-list'); }} onSuccess={() => { setProductToEdit(null); handleActiveSectionChange('products-list'); }} />;
        if (activeSection === 'products-import') return <ImportProducts onCancel={() => handleActiveSectionChange('inventory-dashboard')} onSuccess={() => handleActiveSectionChange('products-list')} />;
        if (activeSection === 'purchase-lots-import') return <ImportPurchaseLot onCancel={() => handleActiveSectionChange('inventory-dashboard')} onSuccess={() => handleActiveSectionChange('purchase-lots-list')} />;
        if (activeSection === 'purchase-lots-list') return <PurchaseLotList onViewDetail={(id) => { setSelectedLotId(id); handleActiveSectionChange('purchase-lots-details'); }} />;
        if (activeSection === 'purchase-lots-details' && selectedLotId) return <PurchaseLotDetails lotId={selectedLotId} onBack={() => handleActiveSectionChange('purchase-lots-list')} />;
        if (activeSection === 'droplist-updates') return <DropListUpdates />;

        return <ComingSoon title="Inventory Management" description="This section is under development." />;
    };

    return (
        <div style={{ padding: '0.5rem' }}>
            {renderContent()}
        </div>
    );
}
