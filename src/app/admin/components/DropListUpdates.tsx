"use client";

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

type ViewMode = 'overview' | 'Brand' | 'Series' | 'Model' | 'RAM' | 'Storage' | 'Graphics' | 'Processor' | 'Gen' | 'Screen Size' | 'Resolution' | 'Keyboard Type' | 'Keyboard Backlit' | 'Condition';

const DropListUpdates = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [listData, setListData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Edit/Delete States
    const [showEditModal, setShowEditModal] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);
    const [editForm, setEditForm] = useState({ brand: '', series: '', model: '', value: '' });
    const [isSaving, setIsSaving] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk Delete Selection
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Import Summary States
    const [importSummary, setImportSummary] = useState<{ created: any[], skipped: any[] } | null>(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [importCategory, setImportCategory] = useState<string>('Laptop');
    const [rawExcelData, setRawExcelData] = useState<any[]>([]);

    // Add Manual States
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ brand: '', series: '', model: '', value: '' });

    const laptopCategories = ['Brand', 'Series', 'Model'];
    const memoryCategories = ['RAM', 'Storage', 'Graphics'];
    const processorCategories = ['Processor', 'Gen'];
    const screenCategories = ['Screen Size', 'Resolution'];
    const keyboardCategories = ['Keyboard Type', 'Keyboard Backlit'];
    const otherCategories = ['Condition'];

    const singleValueCategories = [
        ...memoryCategories, ...processorCategories, ...screenCategories,
        ...keyboardCategories, ...otherCategories
    ];

    React.useEffect(() => {
        if (viewMode !== 'overview') {
            fetchData(viewMode);
        }
    }, [viewMode]);

    const fetchData = async (category?: string) => {
        setIsLoading(true);
        try {
            const url = category ? `/api/admin/inventory/droplists?category=${category}` : '/api/admin/inventory/droplists';
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setListData(result.data);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const laptopCards = [
        { title: 'Brand', icon: 'fas fa-copyright', description: 'Manage Laptop Brands' },
        { title: 'Series', icon: 'fas fa-layer-group', description: 'Manage Series' },
        { title: 'Model', icon: 'fas fa-laptop', description: 'Manage Models' }
    ];

    const memoryCards = [
        { title: 'RAM', icon: 'fas fa-memory', description: 'Manage RAM Options' },
        { title: 'Storage', icon: 'fas fa-hdd', description: 'Manage Storage Options' },
        { title: 'Graphics', icon: 'fas fa-microchip', description: 'Manage GPU Options' }
    ];

    const processorCards = [
        { title: 'Processor', icon: 'fas fa-microchip', description: 'Manage CPUs' },
        { title: 'Gen', icon: 'fas fa-clock', description: 'Manage Generations' }
    ];

    const screenCards = [
        { title: 'Screen Size', icon: 'fas fa-desktop', description: 'Manage Screen Sizes' },
        { title: 'Resolution', icon: 'fas fa-compress-arrows-alt', description: 'Manage Resolutions' }
    ];

    const keyboardCards = [
        { title: 'Keyboard Type', icon: 'fas fa-keyboard', description: 'Manage Layouts' },
        { title: 'Keyboard Backlit', icon: 'fas fa-lightbulb', description: 'Manage Backlight' }
    ];

    const otherCards = [
        { title: 'Condition', icon: 'fas fa-check-circle', description: 'Manage Conditions' }
    ];

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.error("No data found in the file.");
                    return;
                }

                // Initial recommendation
                if (memoryCategories.includes(viewMode)) {
                    setImportCategory(viewMode);
                } else {
                    setImportCategory('Laptop');
                }

                setRawExcelData(data);
                setShowConfirmModal(true);

            } catch (error) {
                console.error("File Read Error:", error);
                toast.error("Failed to process file.");
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleAddClick = () => {
        setAddForm({ brand: '', series: '', model: '', value: '' });
        setShowAddModal(true);
    };

    const executeAdd = async () => {
        const isMemory = memoryCategories.includes(viewMode);
        if (!isMemory && (!addForm.brand || !addForm.model)) {
            toast.error("Brand and Model are required");
            return;
        }
        if (isMemory && !addForm.value) {
            toast.error("Value is required");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/inventory/droplists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...addForm, category: viewMode })
            });

            if (res.ok) {
                toast.success("Added successfully!");
                setShowAddModal(false);
                fetchData(viewMode);
            } else {
                const err = await res.json();
                toast.error(`Failed to add: ${err.error}`);
            }
        } catch (error) {
            toast.error("Error adding item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (item: any) => {
        setItemToEdit(item);
        if (typeof item === 'string') {
            setEditForm({ brand: item, series: '', model: '', value: item });
        } else {
            setEditForm({
                brand: item.brand || '',
                series: item.series || '',
                model: item.model || '',
                value: item.value || ''
            });
        }
        setShowEditModal(true);
    };

    const executeEdit = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/inventory/droplists', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: itemToEdit.id,
                    category: viewMode,
                    ...editForm
                })
            });

            if (res.ok) {
                toast.success("Updated successfully!");
                setShowEditModal(false);
                await fetchData(viewMode);
            } else {
                const err = await res.json();
                toast.error(`Update failed: ${err.error}`);
            }
        } catch (error) {
            toast.error("Error updating item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (item: any) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const executeDelete = async () => {
        setIsDeleting(true);
        try {
            let url = `/api/admin/inventory/droplists?category=${viewMode}`;
            if (itemToDelete.id) {
                url += `&id=${itemToDelete.id}`;
            } else {
                const name = typeof itemToDelete === 'string' ? itemToDelete : (itemToDelete.value || itemToDelete.brand);
                url += `&name=${encodeURIComponent(name)}`;
            }

            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Deleted successfully!");
                setShowDeleteModal(false);
                fetchData(viewMode);
            } else {
                const err = await res.json();
                toast.error(`Delete failed: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error("Error deleting item.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSelectItem = (item: any) => {
        const itemKey = getItemKey(item);
        if (selectedItems.includes(itemKey)) {
            setSelectedItems(prev => prev.filter(i => i !== itemKey));
        } else {
            setSelectedItems(prev => [...prev, itemKey]);
        }
    };

    const handleSelectAll = (filteredItems: any[]) => {
        if (selectedItems.length === filteredItems.length && filteredItems.length > 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map(i => getItemKey(i)));
        }
    };

    const getItemKey = (item: any) => {
        if (typeof item === 'string') return item;
        if (viewMode === 'Series') return `${item.brand}|${item.series}`;
        return item.id;
    };

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            const payload: any = { category: viewMode };

            if (memoryCategories.includes(viewMode)) {
                payload.ids = selectedItems;
            } else if (viewMode === 'Model') {
                payload.ids = selectedItems;
            } else {
                if (viewMode === 'Series') {
                    payload.names = selectedItems.map(s => s.split('|')[1]);
                } else {
                    payload.names = selectedItems;
                }
            }

            const res = await fetch('/api/admin/inventory/droplists', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`Bulk delete successful!`);
                setSelectedItems([]);
                setShowBulkDeleteModal(false);
                fetchData(viewMode);
            } else {
                toast.error("Bulk delete failed.");
            }
        } catch (error) {
            toast.error("Error during bulk delete.");
        } finally {
            setIsDeleting(false);
        }
    };

    const executeImport = async () => {
        setIsImporting(true);
        try {
            // Format data based on selected category
            let formattedData = [];
            const isMemory = memoryCategories.includes(importCategory);

            if (isMemory) {
                const firstRow = rawExcelData[0];
                const valueKey = Object.keys(firstRow).find(h =>
                    ['value', 'ram', 'storage', 'graphics', importCategory.toLowerCase()].includes(h.toLowerCase())
                ) || Object.keys(firstRow)[0];

                formattedData = rawExcelData.map((row: any) => ({
                    value: row[valueKey]
                })).filter((item: any) => item.value);
            } else {
                formattedData = rawExcelData.map((row: any) => ({
                    brand: row['Brand'] || row['brand'] || row['BRAND'],
                    series: row['Series'] || row['series'] || row['SERIES'],
                    model: row['Model'] || row['model'] || row['MODEL']
                })).filter((item: any) => item.brand && item.model);
            }

            if (formattedData.length === 0) {
                toast.error("Format error: Could not find required columns for " + importCategory);
                setIsImporting(false);
                return;
            }

            const response = await fetch('/api/admin/inventory/droplists/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: formattedData, category: importCategory })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`Import Finished! Created: ${result.stats.modelsCreated}, Skipped: ${result.stats.skipped}`);
                setImportSummary(result.summary);
                setShowSummaryModal(true);
                setShowConfirmModal(false);
                setRawExcelData([]);
                fetchData(viewMode);
            } else {
                toast.error(`Import Failed: ${result.error || result.details}`);
            }
        } catch (error) {
            console.error("Import Error:", error);
            toast.error("An error occurred during import.");
        } finally {
            setIsImporting(false);
        }
    };

    const getCategoryData = () => {
        const parseSize = (val: string) => {
            const clean = (val || '').toLowerCase().trim();
            const num = parseFloat(clean);
            if (isNaN(num)) return 0;
            if (clean.includes('tb')) return num * 1024 * 1024;
            if (clean.includes('gb')) return num * 1024;
            if (clean.includes('mb')) return num;
            if (clean.includes('kb')) return num / 1024;
            return num;
        };

        const filtered = listData.filter(item => {
            const query = searchQuery.toLowerCase();
            if (viewMode === 'Brand') return (item.brand || '').toLowerCase().includes(query);
            if (viewMode === 'Series') return (item.series || '').toLowerCase().includes(query) || (item.brand || '').toLowerCase().includes(query);
            if (viewMode === 'Model') return (item.model || '').toLowerCase().includes(query) || (item.brand || '').toLowerCase().includes(query) || (item.series || '').toLowerCase().includes(query);
            if (singleValueCategories.includes(viewMode)) return (item.value || '').toLowerCase().includes(query);
            return false;
        });

        if (viewMode === 'Brand') {
            const brands = Array.from(new Set(filtered.map(i => i.brand))).filter(Boolean).sort();
            return brands;
        }
        if (viewMode === 'Series') {
            const seriesMap = new Map();
            filtered.forEach(i => {
                if (i.series) {
                    const key = `${i.brand}|${i.series}`;
                    seriesMap.set(key, { brand: i.brand, series: i.series });
                }
            });
            return Array.from(seriesMap.values()).sort((a, b) => {
                const brandComp = (a.brand || '').localeCompare(b.brand || '');
                if (brandComp !== 0) return brandComp;
                return (a.series || '').localeCompare(b.series || '');
            });
        }
        if (viewMode === 'Model') {
            return [...filtered].sort((a, b) => {
                const brandComp = (a.brand || '').localeCompare(b.brand || '');
                if (brandComp !== 0) return brandComp;
                const seriesComp = (a.series || '').localeCompare(b.series || '');
                if (seriesComp !== 0) return seriesComp;
                return (a.model || '').localeCompare(b.model || '');
            });
        }
        if (singleValueCategories.includes(viewMode)) {
            return [...filtered].sort((a, b) => {
                const valA = parseSize(a.value);
                const valB = parseSize(b.value);
                if (valA !== valB) return valA - valB;
                return (a.value || '').localeCompare(b.value || '');
            });
        }
        return filtered;
    };

    const renderSwitcher = () => {
        let categories = laptopCategories;
        if (memoryCategories.includes(viewMode)) categories = memoryCategories;
        else if (processorCategories.includes(viewMode)) categories = processorCategories;
        else if (screenCategories.includes(viewMode)) categories = screenCategories;
        else if (keyboardCategories.includes(viewMode)) categories = keyboardCategories;
        else if (otherCategories.includes(viewMode)) categories = otherCategories;
        return (
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {categories.map((mode) => (
                    <button
                        key={mode}
                        onClick={() => { setViewMode(mode as any); setSearchQuery(''); setSelectedItems([]); }}
                        style={{
                            padding: '0.4rem 1rem', borderRadius: '7px', border: 'none',
                            background: viewMode === mode ? 'white' : 'transparent',
                            color: viewMode === mode ? '#1e293b' : '#64748b',
                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                            boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {mode}
                    </button>
                ))}
            </div>
        );
    };

    const renderOverviewSection = (title: string, cards: any[]) => (
        <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#475569', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '4px', height: '1.2rem', background: '#3b82f6', borderRadius: '2px' }}></span>
                {title}
            </h3>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {cards.map((card, index) => (
                    <div
                        key={index}
                        style={{
                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                            padding: '1.5rem', minWidth: '240px', flex: 1, cursor: 'pointer',
                            transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex', flexDirection: 'column', gap: '0.5rem'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 12px -3px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                        onClick={() => setViewMode(card.title as any)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6'
                            }}>
                                <i className={card.icon} style={{ fontSize: '1.2rem' }}></i>
                            </div>
                            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>{card.title}</span>
                        </div>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{card.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                        Master Drop Lists
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
                        Manage master lists for Laptops, Memory, Processors, and more.
                    </p>
                </div>

                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls, .csv"
                    />
                    <button
                        onClick={handleImportClick}
                        disabled={isImporting}
                        style={{
                            padding: '0.6rem 1.2rem', background: '#0f172a', color: 'white',
                            border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', opacity: isImporting ? 0.7 : 1
                        }}
                    >
                        <i className={`fas ${isImporting ? 'fa-spinner fa-spin' : 'fa-file-import'}`}></i>
                        Bulk Import (Excel)
                    </button>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                        Supports Laptop Models, Memory, Processors, Screens, and Keyboard specs
                    </div>
                </div>
            </div>

            {viewMode === 'overview' ? (
                <>
                    {renderOverviewSection('Laptop Related Drop Lists', laptopCards)}
                    {renderOverviewSection('Size Related Drop Lists', memoryCards)}
                    {renderOverviewSection('Processor Related Drop Lists', processorCards)}
                    {renderOverviewSection('Screen Related Drop Lists', screenCards)}
                    {renderOverviewSection('Keyboard Related Drop Lists', keyboardCards)}
                    {renderOverviewSection('Other Drop Lists', otherCards)}
                </>
            ) : (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => { setViewMode('overview'); setSearchQuery(''); }}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    background: 'white', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            {renderSwitcher()}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
                            {selectedItems.length > 0 && (
                                <button
                                    onClick={() => setShowBulkDeleteModal(true)}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <i className="fas fa-trash-alt"></i>
                                    Delete Selected ({selectedItems.length})
                                </button>
                            )}

                            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}></i>
                                <input
                                    type="text"
                                    placeholder={`Search ${viewMode.toLowerCase()}s...`}
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setSelectedItems([]); }}
                                    style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', color: '#1e293b' }}
                                />
                            </div>

                            <button
                                onClick={handleAddClick}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                            >
                                <i className="fas fa-plus"></i> Add New
                            </button>
                        </div>

                        <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                            Total: {getCategoryData().length}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === getCategoryData().length && getCategoryData().length > 0}
                                            onChange={() => handleSelectAll(getCategoryData())}
                                        />
                                    </th>
                                    {viewMode === 'Brand' && <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Brand</th>}
                                    {viewMode === 'Series' && <>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Brand</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Series</th>
                                    </>}
                                    {viewMode === 'Model' && <>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Brand</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Series</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Model</th>
                                    </>}
                                    {singleValueCategories.includes(viewMode) && <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{viewMode} Value</th>}
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={10} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}></i>
                                            <p>Loading items...</p>
                                        </td>
                                    </tr>
                                ) : getCategoryData().length === 0 ? (
                                    <tr>
                                        <td colSpan={10} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                            <i className="fas fa-folder-open" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}></i>
                                            <p>No items found.</p>
                                        </td>
                                    </tr>
                                ) : getCategoryData().map((item, index) => (
                                    <tr key={getItemKey(item)} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#fcfdfe'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(getItemKey(item))}
                                                onChange={() => handleSelectItem(item)}
                                            />
                                        </td>
                                        {viewMode === 'Brand' && <td style={{ padding: '1rem 1.5rem', fontSize: '0.95rem', color: '#1e293b', fontWeight: 500 }}>{item}</td>}
                                        {viewMode === 'Series' && <>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#64748b' }}>{item.brand}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.95rem', color: '#1e293b', fontWeight: 500 }}>{item.series}</td>
                                        </>}
                                        {viewMode === 'Model' && <>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#64748b' }}>{item.brand}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#64748b' }}>{item.series || '-'}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>{item.model}</td>
                                        </>}
                                        {singleValueCategories.includes(viewMode) && <td style={{ padding: '1rem 1.5rem', fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>{item.value || '-'}</td>}
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', color: '#3b82f6', cursor: 'pointer' }}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item)}
                                                    style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer' }}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showConfirmModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', width: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#0f172a' }}>
                                <i className="fas fa-file-excel" style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Table Configuration</h3>
                            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Found <strong>{rawExcelData.length}</strong> rows. Select where to save this data:</p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Drop List</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                                {['Laptop', 'RAM', 'Storage', 'Graphics', 'Processor', 'Gen', 'Screen Size', 'Resolution', 'Keyboard Type', 'Keyboard Backlit', 'Condition'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setImportCategory(cat)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '10px',
                                            border: '2px solid',
                                            borderColor: importCategory === cat ? '#0f172a' : '#f1f5f9',
                                            background: importCategory === cat ? '#f8fafc' : 'white',
                                            color: importCategory === cat ? '#0f172a' : '#64748b',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <i className={`fas ${cat === 'Laptop' ? 'fa-laptop' : cat === 'RAM' ? 'fa-memory' : cat === 'Storage' ? 'fa-hdd' : 'fa-microchip'}`}></i>
                                        {cat === 'Laptop' ? 'Laptop Models' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={executeImport} disabled={isImporting} style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: isImporting ? 0.7 : 1 }}>
                                {isImporting ? <i className="fas fa-spinner fa-spin"></i> : 'Import Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Add New {viewMode}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {singleValueCategories.includes(viewMode) ? (
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>{viewMode} Value *</label>
                                    <input
                                        type="text"
                                        value={addForm.value}
                                        onChange={(e) => setAddForm({ ...addForm, value: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && executeAdd()}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        placeholder={`Enter ${viewMode} value`}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Brand *</label>
                                        <input
                                            type="text"
                                            value={addForm.brand}
                                            onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                            placeholder="Enter Brand Name"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Series (Optional)</label>
                                        <input
                                            type="text"
                                            value={addForm.series}
                                            onChange={(e) => setAddForm({ ...addForm, series: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                            placeholder="Enter Series Name"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Model *</label>
                                        <input
                                            type="text"
                                            value={addForm.model}
                                            onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && executeAdd()}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                            placeholder="Enter Model Number"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={executeAdd} disabled={isSaving} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Adding...' : 'Add Item'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Edit {viewMode}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {singleValueCategories.includes(viewMode) ? (
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>{viewMode} Value *</label>
                                    <input
                                        type="text"
                                        value={editForm.value}
                                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && executeEdit()}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        placeholder={`Enter ${viewMode} value`}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Brand *</label>
                                        <input
                                            type="text"
                                            value={editForm.brand}
                                            onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Series (Optional)</label>
                                        <input
                                            type="text"
                                            value={editForm.series}
                                            onChange={(e) => setEditForm({ ...editForm, series: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Model *</label>
                                        <input
                                            type="text"
                                            value={editForm.model}
                                            onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && executeEdit()}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={executeEdit} disabled={isSaving} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '400px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Delete Item?</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>This action cannot be undone. All associated data will be affected.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={executeDelete} disabled={isDeleting} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: isDeleting ? 0.7 : 1 }}>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {showBulkDeleteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '400px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Bulk Delete?</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Are you sure you want to delete <strong>{selectedItems.length}</strong> selected items? This cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowBulkDeleteModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleBulkDelete} disabled={isDeleting} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: isDeleting ? 0.7 : 1 }}>{isDeleting ? 'Deleting...' : 'Confirm Bulk Delete'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Summary Modal */}
            {showSummaryModal && importSummary && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '800px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Import Result Summary ({importCategory})</h3>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: '#f0fdf4', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>{importSummary.created.length} Successfully Created</span>
                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: '#fff7ed', color: '#ea580c', fontSize: '0.75rem', fontWeight: 600 }}>{importSummary.skipped.length} Skipped / Duplicates</span>
                                </div>
                            </div>
                            <button onClick={() => setShowSummaryModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, color: '#475569' }}>Close</button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                            {importSummary.created.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fas fa-check-circle"></i> Successfully Imported</h4>
                                    <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '40px' }}>#</th>
                                                    {singleValueCategories.includes(importCategory) ? (
                                                        <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Value</th>
                                                    ) : (
                                                        <>
                                                            <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Brand</th>
                                                            <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Series</th>
                                                            <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Model</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importSummary.created.map((item, idx) => (
                                                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '10px 16px', fontSize: '0.8rem', color: '#94a3b8', background: '#fcfdfe' }}>{idx + 1}</td>
                                                        {singleValueCategories.includes(importCategory) ? (
                                                            <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: 500 }}>{item.value}</td>
                                                        ) : (
                                                            <>
                                                                <td style={{ padding: '10px 16px', fontSize: '0.85rem' }}>{item.brand}</td>
                                                                <td style={{ padding: '10px 16px', fontSize: '0.85rem' }}>{item.series || '-'}</td>
                                                                <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: 500 }}>{item.model}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {importSummary.skipped.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ea580c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fas fa-exclamation-circle"></i> Skipped or Duplicates</h4>
                                    <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '40px' }}>#</th>
                                                    {singleValueCategories.includes(importCategory) ? (
                                                        <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Value</th>
                                                    ) : (
                                                        <>
                                                            <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Brand</th>
                                                            <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Series</th>
                                                            <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Model</th>
                                                        </>
                                                    )}
                                                    <th style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importSummary.skipped.map((item, idx) => (
                                                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '10px 16px', fontSize: '0.8rem', color: '#94a3b8', background: '#fcfdfe' }}>{idx + 1}</td>
                                                        {singleValueCategories.includes(importCategory) ? (
                                                            <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: 500 }}>{item.value}</td>
                                                        ) : (
                                                            <>
                                                                <td style={{ padding: '10px 16px', fontSize: '0.85rem' }}>{item.brand}</td>
                                                                <td style={{ padding: '10px 16px', fontSize: '0.85rem' }}>{item.series || '-'}</td>
                                                                <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: 500 }}>{item.model}</td>
                                                            </>
                                                        )}
                                                        <td style={{ padding: '10px 16px' }}><span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: '#fee2e2', color: '#991b1b' }}>{item.reason}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropListUpdates;
