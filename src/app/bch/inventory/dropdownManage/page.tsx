"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import '../../styles/laptop-inventory.css';
import * as XLSX from 'xlsx';

interface DropdownItem {
    id: number;
    category: string;
    value: string;
    parent: string | null;
    created_at: string;
}

export default function DropdownManagePage() {
    const categories = [
        { id: 'Brand', label: 'Brand', hasParent: false },
        { id: 'Series', label: 'Series', hasParent: true, parentCategory: 'Brand' },
        { id: 'Model', label: 'Model', hasParent: true, parentCategory: 'Series' },
        { id: 'Core', label: 'Core', hasParent: false },
        { id: 'Gen', label: 'Gen', hasParent: true, parentCategory: 'Core' },
        { id: 'RAM', label: 'RAM', hasParent: false },
        { id: 'SSD', label: 'SSD', hasParent: false },
        { id: 'GraphicsModel', label: 'Graphics Model', hasParent: false },
        { id: 'GraphicsSize', label: 'Graphics Size', hasParent: false },
        { id: 'Condition', label: 'Condition', hasParent: false },
        { id: 'ScreenSize', label: 'Screen Size', hasParent: false },
        { id: 'ScreenResolution', label: 'Screen Resolution', hasParent: false },
    ];

    const [activeCategory, setActiveCategory] = useState('Brand');
    const [items, setItems] = useState<DropdownItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Parent loading states
    const [parentOptions, setParentOptions] = useState<string[]>([]);
    const [selectedParent, setSelectedParent] = useState('');

    // Modal & Form States
    const [newValue, setNewValue] = useState('');
    const [editItem, setEditItem] = useState<DropdownItem | null>(null);
    const [editValue, setEditValue] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // CSV Import drag-and-drop state
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importPreview, setImportPreview] = useState<any[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Fetch parent options if category has parent (e.g. Brands for Series, Series for Model)
    const fetchParentOptions = useCallback(async (parentCat: string) => {
        try {
            const res = await fetch(`/api/bch/inventory/droplists?category=${parentCat}`);
            if (res.ok) {
                const result = await res.json();
                if (result.success && Array.isArray(result.data)) {
                    const values = result.data.map((item: any) => item.value);
                    setParentOptions(values);
                    if (values.length > 0) {
                        setSelectedParent(values[0]);
                    } else {
                        setSelectedParent('');
                    }
                }
            }
        } catch (error) {
            console.error('Error loading parent options:', error);
        }
    }, []);

    // Load active category options
    const fetchDropdownOptions = useCallback(async () => {
        setLoading(true);
        try {
            const catInfo = categories.find(c => c.id === activeCategory);
            let url = `/api/bch/inventory/droplists?category=${activeCategory}`;
            
            if (catInfo?.hasParent && selectedParent) {
                url += `&parent=${encodeURIComponent(selectedParent)}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setItems(result.data || []);
                }
            }
        } catch (error) {
            console.error('Error loading dropdown options:', error);
            toast.error('Failed to load dropdown options');
        } finally {
            setLoading(false);
        }
    }, [activeCategory, selectedParent]);

    // Handle Active Category Switch
    useEffect(() => {
        const catInfo = categories.find(c => c.id === activeCategory);
        if (catInfo?.hasParent && catInfo.parentCategory) {
            fetchParentOptions(catInfo.parentCategory);
        } else {
            setParentOptions([]);
            setSelectedParent('');
        }
        setSearch('');
    }, [activeCategory, fetchParentOptions]);

    // Reload options on parent or category change
    useEffect(() => {
        fetchDropdownOptions();
    }, [activeCategory, selectedParent, fetchDropdownOptions]);

    // Handle Add New Value
    const handleAddOption = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newValue.trim()) return;

        const catInfo = categories.find(c => c.id === activeCategory);
        if (catInfo?.hasParent && !selectedParent) {
            toast.error(`Please select a parent ${catInfo.parentCategory} first`);
            return;
        }

        setSubmitting(true);
        const username = localStorage.getItem('admin_user')
            ? JSON.parse(localStorage.getItem('admin_user')!).username
            : 'Admin';

        try {
            const res = await fetch('/api/bch/inventory/droplists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: activeCategory,
                    value: newValue.trim(),
                    parent: selectedParent || null,
                    createdBy: username
                })
            });

            const result = await res.json();
            if (res.ok && result.success) {
                toast.success('Option added successfully');
                setNewValue('');
                fetchDropdownOptions();
            } else {
                toast.error(result.error || 'Failed to add option');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Update Option
    const handleUpdateOption = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem || !editValue.trim()) return;

        setSubmitting(true);
        const username = localStorage.getItem('admin_user')
            ? JSON.parse(localStorage.getItem('admin_user')!).username
            : 'Admin';

        try {
            const res = await fetch('/api/bch/inventory/droplists', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editItem.id,
                    value: editValue.trim(),
                    parent: editItem.parent,
                    updatedBy: username
                })
            });

            const result = await res.json();
            if (res.ok && result.success) {
                toast.success('Option updated successfully');
                setEditItem(null);
                setEditValue('');
                fetchDropdownOptions();
            } else {
                toast.error(result.error || 'Failed to update option');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete Option
    const handleDeleteOption = async (id: number) => {
        const confirmed = window.confirm('Are you sure you want to delete this dropdown option? Warning: This might affect items referencing it.');
        if (!confirmed) return;

        const username = localStorage.getItem('admin_user')
            ? JSON.parse(localStorage.getItem('admin_user')!).username
            : 'Admin';

        try {
            const res = await fetch(`/api/bch/inventory/droplists?id=${id}&deletedBy=${encodeURIComponent(username)}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Option deleted successfully');
                fetchDropdownOptions();
            } else {
                const result = await res.json();
                toast.error(result.error || 'Failed to delete option');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    // Handle File Selection (CSV / Excel)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    toast.error("The uploaded file is empty");
                    return;
                }
                setImportPreview(jsonData);
            } catch (err) {
                console.error("Parse error:", err);
                toast.error("Failed to parse Excel or CSV file");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Download Excel Template
    const downloadExcelTemplate = () => {
        const headers = ["Brand", "series", "model", "core", "gen", "ram", "ssd", "graphics", "condition", "Screen Size", "Screen Resolution"];
        const sampleRow = ["Dell", "Latitude", "E3379", "Intel Core i5", "8th Gen", "16GB", "256GB SSD", "Intel UHD 620", "Excellent", "14 inch", "1920x1080"];
        
        const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dropdown_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Submit bulk import
    const handleBulkImport = async () => {
        if (importPreview.length === 0) {
            toast.error("Please load a CSV file first");
            return;
        }

        setImportLoading(true);
        const username = localStorage.getItem('admin_user')
            ? JSON.parse(localStorage.getItem('admin_user')!).username
            : 'Admin';

        try {
            const res = await fetch('/api/bch/inventory/droplists/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rows: importPreview,
                    importedBy: username
                })
            });

            const result = await res.json();
            if (res.ok && result.success) {
                toast.success(`Imported ${result.importedCount} dropdown options successfully`);
                setIsImportModalOpen(false);
                setImportPreview([]);
                fetchDropdownOptions();
            } else {
                toast.error(result.error || "Failed to complete bulk import");
            }
        } catch (error) {
            console.error("Bulk import error:", error);
            toast.error("An error occurred during import");
        } finally {
            setImportLoading(false);
        }
    };

    // Filter items based on search
    const filteredItems = items.filter(item => 
        item.value.toLowerCase().includes(search.toLowerCase())
    );

    const activeCatInfo = categories.find(c => c.id === activeCategory);

    return (
        <div className="inventory-container">
            {/* Header */}
            <div className="section-header">
                <h2>
                    <i className="fas fa-list-ul" style={{ color: '#10b981' }}></i>
                    Dropdown Menu Options Manager
                </h2>
                <p>Manage list options displayed in checkout specs selections and invoice creator templates.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Categories Navigation Drawer */}
                <div className="table-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem', fontWeight: 600 }}>Categories</h4>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            className={`btn-inventory outline`}
                            style={{
                                width: '100%',
                                justifyContent: 'flex-start',
                                border: 'none',
                                background: activeCategory === cat.id ? 'var(--secondary)' : 'transparent',
                                color: activeCategory === cat.id ? 'white' : 'var(--text-primary)',
                                textAlign: 'left',
                                padding: '0.75rem 1rem'
                            }}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Values Managing Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="inventory-controls-panel">
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Search bar inside active list */}
                            <div className="search-input-wrapper" style={{ flex: 1 }}>
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder={`Search options in ${activeCatInfo?.label}...`}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Parent selector check */}
                            {activeCatInfo?.hasParent && parentOptions.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Parent {activeCatInfo.parentCategory}:
                                    </label>
                                    <select
                                        value={selectedParent}
                                        onChange={e => setSelectedParent(e.target.value)}
                                        style={{
                                            padding: '0.6rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            fontWeight: 500
                                        }}
                                    >
                                        {parentOptions.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button 
                                type="button" 
                                className="btn-inventory outline"
                                onClick={() => setIsImportModalOpen(true)}
                                style={{ height: '42px' }}
                            >
                                <i className="fas fa-file-import"></i> Import Options CSV
                            </button>
                        </div>

                        {/* Add Option Form */}
                        <form onSubmit={handleAddOption} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                                <label>Add Value to {activeCatInfo?.label}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={`e.g. new value...`}
                                    value={newValue}
                                    onChange={e => setNewValue(e.target.value)}
                                />
                            </div>
                            {activeCatInfo?.hasParent && (
                                <div className="form-group" style={{ width: '220px' }}>
                                    <label>Parent {activeCatInfo.parentCategory}</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={selectedParent}
                                    />
                                </div>
                            )}
                            <button
                                type="submit"
                                className="btn-inventory primary"
                                disabled={submitting || !newValue.trim()}
                                style={{ height: '42px', padding: '0.7rem 1.5rem' }}
                            >
                                {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>} Add Option
                            </button>
                        </form>
                    </div>

                    {/* Table display list */}
                    <div className="table-card">
                        <div className="inventory-table-wrapper">
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th>Value</th>
                                        {activeCatInfo?.hasParent && <th>Parent {activeCatInfo.parentCategory}</th>}
                                        <th>Created Date</th>
                                        <th style={{ width: '100px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={activeCatInfo?.hasParent ? 4 : 3} style={{ textAlign: 'center', padding: '3rem' }}>
                                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}></i>
                                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading dropdown values...</p>
                                            </td>
                                        </tr>
                                    ) : filteredItems.length > 0 ? (
                                        filteredItems.map(item => (
                                            <tr key={item.id}>
                                                <td><span style={{ fontWeight: 600 }}>{item.value}</span></td>
                                                {activeCatInfo?.hasParent && <td><span className="code-badge barcode">{item.parent || 'N/A'}</span></td>}
                                                <td><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(item.created_at).toLocaleDateString()}</span></td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            className="btn-action edit"
                                                            title="Edit Option"
                                                            onClick={() => { setEditItem(item); setEditValue(item.value); }}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action delete"
                                                            title="Delete Option"
                                                            onClick={() => handleDeleteOption(item.id)}
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={activeCatInfo?.hasParent ? 4 : 3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                                                No dropdown options found under this category.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline Edit Modal */}
            {editItem && (
                <div className="modal-overlay" onClick={() => { setEditItem(null); setEditValue(''); }}>
                    <form
                        className="modal-card"
                        style={{ maxWidth: '450px' }}
                        onClick={e => e.stopPropagation()}
                        onSubmit={handleUpdateOption}
                    >
                        <div className="modal-header">
                            <h3>Edit Dropdown Value</h3>
                            <button className="btn-close-modal" type="button" onClick={() => { setEditItem(null); setEditValue(''); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-content-scroll">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Option Value</label>
                                <input
                                    type="text"
                                    required
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                />
                            </div>
                            {editItem.parent && (
                                <div className="form-group">
                                    <label>Parent</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={editItem.parent}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-inventory outline"
                                disabled={submitting}
                                onClick={() => { setEditItem(null); setEditValue(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-inventory primary"
                                disabled={submitting || !editValue.trim() || editValue.trim() === editItem.value}
                            >
                                {submitting ? <i className="fas fa-spinner fa-spin"></i> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* CSV/Excel Import Modal */}
            {isImportModalOpen && (
                <div className="modal-overlay" onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }}>
                    <div className="modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Bulk Excel/CSV Import Dropdown Options</h3>
                            <button className="btn-close-modal" type="button" onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-content-scroll">
                            <div 
                                className="csv-drag-box" 
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <i className={`fas ${importPreview.length > 0 ? 'fa-file-excel success' : 'fa-cloud-upload-alt'}`}></i>
                                {importPreview.length > 0 ? (
                                    <div>
                                        <strong>Loaded: {importPreview.length} items ready to import</strong>
                                        <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click or drag a different file to replace.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <strong>Click to select an Excel or CSV file</strong>
                                        <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File must have headers like Brand, series, model.</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    accept=".csv, .xlsx, .xls" 
                                    style={{ display: 'none' }} 
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Header columns: <strong>Brand, series, model, core, gen, ram, ssd, graphics, condition, Screen Size, Screen Resolution</strong></span>
                                <button className="btn-inventory outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={downloadExcelTemplate}>
                                    <i className="fas fa-download"></i> Download Template Excel
                                </button>
                            </div>

                            {/* Preview table */}
                            {importPreview.length > 0 && (
                                <div className="import-preview-table-wrapper" style={{ maxHeight: '200px', marginTop: '1rem', overflowX: 'auto' }}>
                                    <table className="inventory-table">
                                        <thead>
                                            <tr>
                                                <th>Brand</th>
                                                <th>Series</th>
                                                <th>Model</th>
                                                <th>Core</th>
                                                <th>Gen</th>
                                                <th>RAM</th>
                                                <th>SSD</th>
                                                <th>Graphics</th>
                                                <th>Condition</th>
                                                <th>Screen Size</th>
                                                <th>Screen Resolution</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importPreview.slice(0, 5).map((row, idx) => (
                                                <tr key={idx}>
                                                    <td>{row.Brand || row.brand || 'N/A'}</td>
                                                    <td>{row.series || row.Series || 'N/A'}</td>
                                                    <td>{row.model || row.Model || 'N/A'}</td>
                                                    <td>{row.core || row.Core || row.processor || row.Processor || 'N/A'}</td>
                                                    <td>{row.gen || row.Gen || row.generation || row.Generation || 'N/A'}</td>
                                                    <td>{row.ram || row.RAM || 'N/A'}</td>
                                                    <td>{row.ssd || row.SSD || row.storage || row.Storage || 'N/A'}</td>
                                                    <td>{row.graphics || row.Graphics || row.ghraphics || row.Ghraphics || 'N/A'}</td>
                                                    <td>{row.condition || row.Condition || 'N/A'}</td>
                                                    <td>{row["Screen Size"] || row["screen size"] || row.screensize || row.ScreenSize || 'N/A'}</td>
                                                    <td>{row["Screen Resolution"] || row["screen resolution"] || row.screenresolution || row.ScreenResolution || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {importPreview.length > 5 && (
                                        <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>
                                            ... and {importPreview.length - 5} more rows.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn-inventory outline" 
                                onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }}
                                disabled={importLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn-inventory primary" 
                                disabled={importLoading || importPreview.length === 0}
                                onClick={handleBulkImport}
                            >
                                {importLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} Import Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
