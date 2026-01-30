"use client";

import React, { useState } from "react";
import InventoryDashboard from "./InventoryDashboard";
import ProductList from "./ProductList";
import AddProduct from "./AddProduct";
import ImportProducts from "./ImportProducts";

export default function InventoryPage() {
    const [view, setView] = useState<'dashboard' | 'list' | 'add' | 'edit' | 'import'>('dashboard');
    const [productToEdit, setProductToEdit] = useState<any>(null);

    const handleSetActiveSection = (section: string) => {
        if (section === 'products-list') setView('list');
        else if (section === 'products-add') setView('add');
        else if (section === 'products-import') setView('import');
        else setView('dashboard');
    };

    const handleEdit = (product: any) => {
        setProductToEdit(product);
        setView('edit');
    };

    if (view === 'list') {
        return (
            <ProductList
                setActiveSection={handleSetActiveSection}
                onEdit={handleEdit}
            />
        );
    }

    if (view === 'add' || view === 'edit') {
        return (
            <AddProduct
                onCancel={() => { setView('list'); setProductToEdit(null); }}
                initialData={productToEdit}
                onSuccess={() => { setView('list'); setProductToEdit(null); }}
            />
        );
    }

    if (view === 'import') {
        return <ImportProducts onCancel={() => setView('list')} onSuccess={() => { setView('list'); }} />;
    }

    return <InventoryDashboard setActiveSection={handleSetActiveSection} />;
}
