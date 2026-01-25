import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import ConfirmModal from './ConfirmModal';

interface ImportProductsProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function ImportProducts({ onCancel, onSuccess }: ImportProductsProps) {
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

    // Import State
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Export State
    const [exportLoading, setExportLoading] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
        singleButton?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    // --- Import Handlers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            setPreviewData(jsonData);
        };
        reader.readAsBinaryString(file);
    };

    const handleUpload = async () => {
        if (!previewData.length) return;
        setImportLoading(true);

        try {
            const products = previewData.map((row: any) => ({
                name: row.product_name || row.name || row.Name || row['Product Name'],
                sku: row.product_code || row.sku || row.SKU,
                category: row.category || row.Category,
                quantity: Number(row.stock_quantity || row.quantity || row.Quantity || 0),
                price: Number(row.base_price || row.price || row.Price || 0),
                description: row.features || row.description || row.Description || '',
                imageUrl: row.primary_image_url || row.imageUrl || row.image_url || row['Image URL'] || ''
            })).filter(p => p.name);

            if (products.length === 0) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'No valid products found in the file. Please ensure the file has a "Product Name" or "product_name" column.',
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                setImportLoading(false);
                return;
            }

            const response = await fetch('/api/admin/inventory/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products })
            });

            if (response.ok) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Success',
                    message: `Successfully imported ${products.length} products!`,
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => {
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        onSuccess();
                    }
                });
            } else {
                const text = await response.text();
                try {
                    const error = JSON.parse(text);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'Import failed: ' + error.error + (error.details ? `\n\nDetails: ${error.details}` : ''),
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                } catch {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: `Import failed (Status ${response.status}): ` + text.slice(0, 100),
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        } catch (error: any) {
            console.error('Error importing products:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'An error occurred during import: ' + (error.message || JSON.stringify(error)),
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setImportLoading(false);
        }
    };

    // --- Export Handlers ---
    const handleExport = async () => {
        setExportLoading(true);
        try {
            const response = await fetch('/api/admin/inventory/products');
            if (!response.ok) throw new Error('Failed to fetch products');

            const data = await response.json();

            if (!data || data.length === 0) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Info',
                    message: 'No products to export.',
                    type: 'info',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                setExportLoading(false);
                return;
            }

            // Process data for export (flatten objects if needed)
            const exportData = data.map((item: any) => {
                const row = { ...item };
                // Stringify complex objects for Excel compatibility
                if (row.ram_variants) row.ram_variants = JSON.stringify(row.ram_variants);
                if (row.storage_variants) row.storage_variants = JSON.stringify(row.storage_variants);
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

            // Generate filename with date
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `Inventory_Export_${dateStr}.xlsx`);

        } catch (error) {
            console.error('Error exporting products:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to export products.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0 }}>Import / Export Data</h2>
                <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setActiveTab('import')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: activeTab === 'import' ? 'white' : 'transparent',
                            color: activeTab === 'import' ? '#2563eb' : '#6b7280',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: activeTab === 'import' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Import
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: activeTab === 'export' ? 'white' : 'transparent',
                            color: activeTab === 'export' ? '#2563eb' : '#6b7280',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: activeTab === 'export' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Export
                    </button>
                </div>
            </div>

            {activeTab === 'import' ? (
                // --- Import View ---
                <div className="animate-fade-in">
                    <div style={{ marginBottom: '1.5rem', color: '#4b5563', fontSize: '0.95rem' }}>
                        Upload a CSV or Excel file to bulk import products into your inventory.
                    </div>

                    {!file ? (
                        <div
                            style={{
                                border: '2px dashed #d1d5db',
                                borderRadius: '8px',
                                padding: '3rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <i className="fas fa-file-excel" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}></i>
                            <p style={{ color: '#4b5563', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 500 }}>Click to upload file</p>
                            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Supported: .xlsx, .xls, .csv</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx, .xls, .csv"
                                style={{ display: 'none' }}
                            />
                        </div>
                    ) : (
                        <div>
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-file-alt"></i> {file.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#60a5fa', marginTop: '0.25rem', paddingLeft: '24px' }}>
                                        {previewData.length} records found
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setPreviewData([]); }}
                                    style={{ background: 'white', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 500, padding: '6px 12px', borderRadius: '6px' }}
                                >
                                    Change File
                                </button>
                            </div>

                            {previewData.length > 0 && (
                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 5 }}>
                                            <tr>
                                                {Object.keys(previewData[0] || {}).map(header => (
                                                    <th key={header} style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.slice(0, 10).map((row, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: 'white' }}>
                                                    {Object.values(row).map((val: any, j) => (
                                                        <td key={j} style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{val}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {previewData.length > 10 && (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                                            ...and {previewData.length - 10} more rows
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    onClick={onCancel}
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={importLoading}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: importLoading ? '#93c5fd' : '#10b981',
                                        color: 'white',
                                        cursor: importLoading ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        minWidth: '140px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {importLoading ? (
                                        <><i className="fas fa-spinner fa-spin"></i> Importing...</>
                                    ) : (
                                        <><i className="fas fa-check"></i> Complete Import</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // --- Export View ---
                <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
                    <div style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#0ea5e9',
                                fontSize: '1.5rem',
                                flexShrink: 0
                            }}>
                                <i className="fas fa-cloud-download-alt"></i>
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>Export Inventory Data</h3>
                                <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    Download all your product data including stock levels, prices, and specifications into a standard Excel (.xlsx) file.
                                    This file can be edited and re-imported if needed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', padding: '2rem', border: '1px solid #f3f4f6', borderRadius: '12px' }}>
                        <i className="fas fa-file-excel" style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1.5rem' }}></i>
                        <button
                            onClick={handleExport}
                            disabled={exportLoading}
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: exportLoading ? '#cbd5e1' : '#2563eb',
                                color: 'white',
                                cursor: exportLoading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                                transition: 'transform 0.1s'
                            }}
                            onMouseDown={e => !exportLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
                            onMouseUp={e => !exportLoading && (e.currentTarget.style.transform = 'scale(1)')}
                            onMouseLeave={e => !exportLoading && (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            {exportLoading ? (
                                <><i className="fas fa-circle-notch fa-spin"></i> Generating Export...</>
                            ) : (
                                <><i className="fas fa-download"></i> Download Inventory.xlsx</>
                            )}
                        </button>
                        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                            Depending on your inventory size, this may take a few seconds.
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2rem' }}>
                        <button
                            onClick={onCancel}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                        >
                            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />
        </div>
    );
}
