"use client";

import React, { useRef, useState } from 'react';
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
    const [editForm, setEditForm] = useState<{ brand: string, series: string, model: string, value: string, parent: string[] }>({ brand: '', series: '', model: '', value: '', parent: [] });
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
    const [addForm, setAddForm] = useState<{ brand: string, series: string, model: string, value: string, parent: string[] }>({ brand: '', series: '', model: '', value: '', parent: [] });
    const [processorList, setProcessorList] = useState<any[]>([]);

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
            const currentCategory = category || viewMode;
            const url = category ? `/api/bch/inventory/droplists?category=${category}` : '/api/bch/inventory/droplists';
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setListData(result.data);
            }

            // If we are in 'Gen' view, we also need to fetch the list of Processors for the dropdown
            if (currentCategory === 'Gen') {
                const procResponse = await fetch('/api/bch/inventory/droplists?category=Processor');
                const procResult = await procResponse.json();
                if (procResult.success) {
                    setProcessorList(procResult.data);
                }
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
                const XLSX = await import('xlsx');
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

    const downloadTemplate = async (category: string) => {
        const XLSX = await import('xlsx');
        let headers: string[] = [];
        let fileName = '';

        if (category === 'Laptop' || category === 'Laptop Related' || ['Brand', 'Series', 'Model'].includes(category)) {
            headers = ['Brand', 'Series', 'Model'];
            fileName = 'Laptop_Models_Template.xlsx';
        } else {
            headers = ['Value'];
            fileName = `${category.replace(/\s+/g, '_')}_Template.xlsx`;
        }

        const data = [headers];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");

        // Auto-size columns
        const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, fileName);
        toast.success(`Template for ${category === 'Laptop' || ['Brand', 'Series', 'Model'].includes(category) ? 'Laptop Models' : category} downloaded!`);
    };

    const handleAddClick = () => {
        setAddForm({ brand: '', series: '', model: '', value: '', parent: [] });
        setShowAddModal(true);
    };

    const executeAdd = async () => {
        const isSingleValue = singleValueCategories.includes(viewMode);
        if (!isSingleValue && (!addForm.brand || !addForm.model)) {
            toast.error("Brand and Model are required");
            return;
        }
        if (isSingleValue && !addForm.value) {
            toast.error("Value is required");
            return;
        }
        if (viewMode === 'Gen' && addForm.parent.length === 0) {
            toast.error("At least one Processor must be selected");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/bch/inventory/droplists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...addForm, category: viewMode, parent: JSON.stringify(addForm.parent) })
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
            setEditForm({ brand: item, series: '', model: '', value: item, parent: [] });
        } else {
            let initialParent: string[] = [];
            try {
                if (item.parent) {
                    if (item.parent.startsWith('[')) {
                        initialParent = JSON.parse(item.parent);
                    } else {
                        initialParent = [item.parent];
                    }
                }
            } catch (e) {
                initialParent = item.parent ? [item.parent] : [];
            }

            setEditForm({
                brand: item.brand || '',
                series: item.series || '',
                model: item.model || '',
                value: item.value || '',
                parent: initialParent
            });
        }
        setShowEditModal(true);
    };

    const executeEdit = async () => {
        setIsSaving(true);
        try {
            // Determine if we are updating an existing master record or adding a derived one to master
            const hasId = itemToEdit && typeof itemToEdit === 'object' && itemToEdit.id;

            const res = await fetch('/api/bch/inventory/droplists', {
                method: hasId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: hasId ? itemToEdit.id : undefined,
                    category: viewMode,
                    ...editForm,
                    parent: JSON.stringify(editForm.parent)
                })
            });

            if (res.ok) {
                toast.success(hasId ? "Updated successfully!" : "Added to Master List!");
                setShowEditModal(false);
                await fetchData(viewMode);
            } else {
                const err = await res.json();
                toast.error(`Operation failed: ${err.error}`);
            }
        } catch (error) {
            toast.error("Error saving changes.");
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
            let url = `/api/bch/inventory/droplists?category=${viewMode}`;
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
        if (item.id) return item.id;
        if (viewMode === 'Series') return `series-${item.brand}-${item.series}`;
        if (viewMode === 'Model') return `model-${item.brand}-${item.series || 'none'}-${item.model}`;
        if (singleValueCategories.includes(viewMode)) return `val-${viewMode}-${item.value}`;
        return Math.random().toString(); // Fallback to avoid key collision
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

            const res = await fetch('/api/bch/inventory/droplists', {
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

            const findKey = (row: any, possibleNames: string[]) => {
                const keys = Object.keys(row);
                return keys.find(k =>
                    possibleNames.some(p => p.toLowerCase() === k.toLowerCase().trim())
                );
            };

            if (['Laptop', 'Brand', 'Series', 'Model'].includes(importCategory)) {
                formattedData = rawExcelData.map((row: any) => {
                    const brandKey = findKey(row, ['Brand', 'Make', 'Manufacturer']);
                    const seriesKey = findKey(row, ['Series', 'Brand Series', 'Line']);
                    const modelKey = findKey(row, ['Model', 'Product Model', 'Model Name']);

                    return {
                        brand: brandKey ? row[brandKey] : '',
                        series: seriesKey ? row[seriesKey] : '',
                        model: modelKey ? row[modelKey] : ''
                    };
                }).filter((item: any) => item.brand && item.model);
            } else {
                // Single value categories (RAM, Storage, Processor, etc.)
                const possibleValueKeys = [
                    'value', 'val', 'name',
                    importCategory.toLowerCase(),
                    importCategory.toLowerCase().replace(' ', '_'),
                    importCategory.toLowerCase().replace(' ', '')
                ];

                // Add specific variations
                if (importCategory === 'RAM') possibleValueKeys.push('memory', 'size');
                if (importCategory === 'Storage') possibleValueKeys.push('hdd', 'ssd', 'capacity');
                if (importCategory === 'Graphics') possibleValueKeys.push('gpu', 'video card', 'graphic card');
                if (importCategory === 'Processor') possibleValueKeys.push('cpu', 'chip');
                if (importCategory === 'Gen') possibleValueKeys.push('generation', 'processor_gen');

                formattedData = rawExcelData.map((row: any) => {
                    const valueKey = findKey(row, possibleValueKeys);
                    return {
                        value: valueKey ? row[valueKey] : ''
                    };
                }).filter((item: any) => item.value);
            }

            if (formattedData.length === 0) {
                toast.error("Format error: Could not find required columns for " + importCategory);
                setIsImporting(false);
                return;
            }

            const response = await fetch('/api/bch/inventory/droplists/import', {
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
        <div style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '6px', height: '24px', background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', borderRadius: '4px' }}></div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                    {title}
                </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {cards.map((card, index) => (
                    <div
                        key={index}
                        style={{
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '24px',
                            padding: '2rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                            e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                        onClick={() => setViewMode(card.title as any)}
                    >
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '100px',
                            height: '100px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                            borderRadius: '50%',
                            zIndex: 0
                        }}></div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: '54px',
                                height: '54px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2563eb',
                                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                            }}>
                                <i className={card.icon} style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: '1.2rem', letterSpacing: '-0.01em' }}>{card.title}</h4>
                                <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</span>
                            </div>
                        </div>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', position: 'relative', zIndex: 1, minHeight: '3rem' }}>{card.description}</p>

                        <div style={{
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#3b82f6',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            position: 'relative',
                            zIndex: 1,
                            paddingTop: '0.5rem',
                            transition: 'gap 0.2s'
                        }}>
                            Open Collection <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
                        </div>
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

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => downloadTemplate(viewMode === 'overview' ? 'Laptop' : viewMode)}
                        style={{
                            padding: '0.65rem 1.25rem',
                            background: 'rgba(255, 255, 255, 0.8)',
                            color: '#1e293b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                        }}
                    >
                        <i className="fas fa-file-download" style={{ color: '#3b82f6' }}></i>
                        Template
                    </button>

                    <div style={{ position: 'relative' }}>
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
                                padding: '0.7rem 1.5rem',
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '0.9rem',
                                opacity: isImporting ? 0.7 : 1,
                                transition: 'all 0.3s ease',
                                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)'
                            }}
                            onMouseOver={(e) => {
                                if (!isImporting) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 15px 20px -5px rgba(15, 23, 42, 0.4)';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(15, 23, 42, 0.3)';
                            }}
                        >
                            <i className={`fas ${isImporting ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
                            {isImporting ? 'Processing...' : 'Bulk Import'}
                        </button>
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
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', background: '#fcfdfe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <button
                                onClick={() => { setViewMode('overview'); setSearchQuery(''); }}
                                style={{
                                    width: '42px', height: '42px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                    background: 'white', cursor: 'pointer', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'none'; }}
                            >
                                <i className="fas fa-chevron-left" style={{ fontSize: '0.9rem' }}></i>
                            </button>
                            {renderSwitcher()}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
                            {selectedItems.length > 0 && (
                                <button
                                    onClick={() => setShowBulkDeleteModal(true)}
                                    style={{ padding: '0.65rem 1.25rem', borderRadius: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)' }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = '#fecaca'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                                >
                                    <i className="fas fa-trash-alt"></i>
                                    Delete ({selectedItems.length})
                                </button>
                            )}

                            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }}></i>
                                <input
                                    type="text"
                                    placeholder={`Search in ${viewMode}...`}
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setSelectedItems([]); }}
                                    style={{ width: '100%', padding: '0.75rem 1.25rem 0.75rem 3rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: 'white', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <button
                                onClick={handleAddClick}
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s' }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)'; }}
                            >
                                <i className="fas fa-plus-circle"></i> Add {viewMode}
                            </button>
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
                                    {viewMode === 'Gen' && <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Processor</th>}
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
                                        {viewMode === 'Gen' && <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {(() => {
                                                try {
                                                    const parsed = JSON.parse(item.parent || '[]');
                                                    return Array.isArray(parsed) ? parsed.join(', ') : (item.parent || '-');
                                                } catch (e) {
                                                    return item.parent || '-';
                                                }
                                            })()}
                                        </td>}
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(12px)' }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        width: '600px',
                        maxWidth: '90vw',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        animation: 'modalFadeIn 0.3s ease-out'
                    }}>
                        <style>{`
                            @keyframes modalFadeIn {
                                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                                to { opacity: 1; transform: scale(1) translateY(0); }
                            }
                        `}</style>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.25rem',
                                color: '#3b82f6',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #e2e8f0'
                            }}>
                                <i className="fas fa-file-invoice" style={{ fontSize: '1.75rem' }}></i>
                            </div>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Import Configuration</h3>
                            <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                                We found <strong style={{ color: '#0f172a' }}>{rawExcelData.length}</strong> valid rows in your file.
                            </p>
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Select Target Collection
                                </label>
                                <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, padding: '0.2rem 0.6rem', background: '#eff6ff', borderRadius: '6px' }}>
                                    Required
                                </span>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: '0.75rem',
                                padding: '1.25rem',
                                background: '#f8fafc',
                                borderRadius: '18px',
                                border: '1px solid #f1f5f9',
                                maxHeight: '280px',
                                overflowY: 'auto'
                            }}>
                                {[
                                    { id: 'Laptop', label: 'Laptop Models', icon: 'fa-laptop' },
                                    { id: 'RAM', label: 'RAM', icon: 'fa-memory' },
                                    { id: 'Storage', label: 'Storage', icon: 'fa-hdd' },
                                    { id: 'Graphics', label: 'Graphics', icon: 'fa-microchip' },
                                    { id: 'Processor', label: 'Processor', icon: 'fa-cpu' },
                                    { id: 'Gen', label: 'Generation', icon: 'fa-clock' },
                                    { id: 'Screen Size', label: 'Screen Size', icon: 'fa-expand' },
                                    { id: 'Resolution', label: 'Resolution', icon: 'fa-desktop' },
                                    { id: 'Keyboard Type', label: 'Keyboard Type', icon: 'fa-keyboard' },
                                    { id: 'Keyboard Backlit', label: 'Backlit', icon: 'fa-lightbulb' },
                                    { id: 'Condition', label: 'Condition', icon: 'fa-star' }
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setImportCategory(cat.id)}
                                        style={{
                                            padding: '1rem 0.5rem',
                                            borderRadius: '14px',
                                            border: '2px solid',
                                            borderColor: importCategory === cat.id ? '#3b82f6' : 'white',
                                            background: importCategory === cat.id ? 'white' : 'white',
                                            color: importCategory === cat.id ? '#1e293b' : '#64748b',
                                            fontWeight: importCategory === cat.id ? 800 : 600,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: importCategory === cat.id ? '0 10px 15px -3px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseOver={(e) => {
                                            if (importCategory !== cat.id) {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (importCategory !== cat.id) {
                                                e.currentTarget.style.borderColor = 'white';
                                                e.currentTarget.style.transform = 'none';
                                            }
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: importCategory === cat.id ? '#eff6ff' : '#f8fafc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: importCategory === cat.id ? '#3b82f6' : '#94a3b8',
                                            transition: 'all 0.2s'
                                        }}>
                                            <i className={`fas ${cat.icon}`}></i>
                                        </div>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    borderRadius: '14px',
                                    border: '1.5px solid #e2e8f0',
                                    background: 'white',
                                    color: '#475569',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeImport}
                                disabled={isImporting}
                                style={{
                                    flex: 1.5,
                                    padding: '1rem',
                                    borderRadius: '14px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    opacity: isImporting ? 0.7 : 1,
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    if (!isImporting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 15px 25px -5px rgba(37, 99, 235, 0.5)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(37, 99, 235, 0.4)';
                                }}
                            >
                                {isImporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-double"></i>}
                                {isImporting ? 'Processing...' : 'Confirm & Start Import'}
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
                                    {viewMode === 'Gen' && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Related Processor(s) *</label>
                                            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', background: '#f8fafc' }}>
                                                {processorList.length === 0 ? (
                                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>No processors found.</p>
                                                ) : (
                                                    processorList.map((proc: any) => (
                                                        <label key={proc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', cursor: 'pointer', borderBottom: '1px dashed #f1f5f9' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={addForm.parent.includes(proc.value)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setAddForm({ ...addForm, parent: [...addForm.parent, proc.value] });
                                                                    } else {
                                                                        setAddForm({ ...addForm, parent: addForm.parent.filter(p => p !== proc.value) });
                                                                    }
                                                                }}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                                                            />
                                                            <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>{proc.value}</span>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Select all processors compatible with this generation.</p>
                                        </div>
                                    )}
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
                                    {viewMode === 'Gen' && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Related Processor(s) *</label>
                                            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', background: '#f8fafc' }}>
                                                {processorList.length === 0 ? (
                                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>No processors found.</p>
                                                ) : (
                                                    processorList.map((proc: any) => (
                                                        <label key={proc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', cursor: 'pointer', borderBottom: '1px dashed #f1f5f9' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={editForm.parent.includes(proc.value)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setEditForm({ ...editForm, parent: [...editForm.parent, proc.value] });
                                                                    } else {
                                                                        setEditForm({ ...editForm, parent: editForm.parent.filter(p => p !== proc.value) });
                                                                    }
                                                                }}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                                                            />
                                                            <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>{proc.value}</span>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(12px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '850px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.2)', animation: 'modalFadeIn 0.3s ease-out' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfdfe', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Import Result Summary</h3>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.4rem 0.8rem', borderRadius: '10px', background: '#dcfce7', color: '#166534', fontSize: '0.85rem', fontWeight: 700 }}>
                                        <i className="fas fa-check-circle"></i> {importSummary.created.length} Created
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.4rem 0.8rem', borderRadius: '10px', background: '#fef3c7', color: '#92400e', fontSize: '0.85rem', fontWeight: 700 }}>
                                        <i className="fas fa-exclamation-triangle"></i> {importSummary.skipped.length} Skipped
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.4rem 0.8rem', borderRadius: '10px', background: '#eff6ff', color: '#1e40af', fontSize: '0.85rem', fontWeight: 700 }}>
                                        <i className="fas fa-folder"></i> {importCategory}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                style={{ background: '#0f172a', border: 'none', cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }}
                            >
                                Done
                            </button>
                        </div>
                        <div style={{ padding: '2rem', overflowY: 'auto', background: 'white', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                            {importSummary.created.length > 0 && (
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
                                            <i className="fas fa-plus"></i>
                                        </div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Successfully Imported Items</h4>
                                    </div>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: '60px' }}>#</th>
                                                    {singleValueCategories.includes(importCategory) ? (
                                                        <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Value</th>
                                                    ) : (
                                                        <>
                                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Brand</th>
                                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Series</th>
                                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Model</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importSummary.created.map((item, idx) => (
                                                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                                        <td style={{ padding: '12px 20px', fontSize: '0.85rem', color: '#94a3b8', background: '#fcfdfe' }}>{idx + 1}</td>
                                                        {singleValueCategories.includes(importCategory) ? (
                                                            <td style={{ padding: '12px 20px', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{item.value}</td>
                                                        ) : (
                                                            <>
                                                                <td style={{ padding: '12px 20px', fontSize: '0.9rem', color: '#444' }}>{item.brand}</td>
                                                                <td style={{ padding: '12px 20px', fontSize: '0.9rem', color: '#444' }}>{item.series || <span style={{ color: '#cbd5e1' }}>N/A</span>}</td>
                                                                <td style={{ padding: '12px 20px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{item.model}</td>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400e' }}>
                                            <i className="fas fa-exclamation-triangle"></i>
                                        </div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Skipped or Duplicate Items</h4>
                                    </div>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: '60px' }}>#</th>
                                                    {singleValueCategories.includes(importCategory) ? (
                                                        <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Value</th>
                                                    ) : (
                                                        <>
                                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Brand</th>
                                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Series</th>
                                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Model</th>
                                                        </>
                                                    )}
                                                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importSummary.skipped.map((item, idx) => (
                                                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 20px', fontSize: '0.85rem', color: '#94a3b8', background: '#fcfdfe' }}>{idx + 1}</td>
                                                        {singleValueCategories.includes(importCategory) ? (
                                                            <td style={{ padding: '12px 20px', fontSize: '0.9rem', color: '#64748b' }}>{item.value}</td>
                                                        ) : (
                                                            <>
                                                                <td style={{ padding: '12px 20px', fontSize: '0.9rem', color: '#64748b' }}>{item.brand}</td>
                                                                <td style={{ padding: '12px 20px', fontSize: '0.9rem', color: '#64748b' }}>{item.series || <span style={{ color: '#cbd5e1' }}>N/A</span>}</td>
                                                                <td style={{ padding: '12px 20px', fontSize: '0.9rem', color: '#64748b' }}>{item.model}</td>
                                                            </>
                                                        )}
                                                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                {item.reason || 'Duplicate'}
                                                            </span>
                                                        </td>
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
