import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface ImportProductsProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function ImportProducts({ onCancel, onSuccess }: ImportProductsProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setLoading(true);

        try {
            // Map Excel columns to database fields if necessary, or assume headers match
            // Expected headers: name, sku, category, quantity, price, description, imageUrl

            const products = previewData.map((row: any) => ({
                name: row.name || row.Name || row['Product Name'],
                sku: row.sku || row.SKU,
                category: row.category || row.Category,
                quantity: Number(row.quantity || row.Quantity || 0),
                price: Number(row.price || row.Price || 0),
                description: row.description || row.Description || '',
                imageUrl: row.imageUrl || row.image_url || row['Image URL'] || ''
            })).filter(p => p.name); // basic validation

            const response = await fetch('/api/admin/inventory/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products })
            });

            if (response.ok) {
                alert(`Successfully imported ${products.length} products!`);
                onSuccess();
            } else {
                const text = await response.text();
                try {
                    const error = JSON.parse(text);
                    alert('Import failed: ' + error.error + (error.details ? `\n\nDetails: ${error.details}` : ''));
                } catch {
                    alert(`Import failed (Status ${response.status}): ` + text.slice(0, 100));
                }
            }
        } catch (error: any) {
            console.error('Error importing products:', error);
            alert('An error occurred during import: ' + (error.message || JSON.stringify(error)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>Import Products</h2>

            {!file ? (
                <div
                    style={{
                        border: '2px dashed #d1d5db',
                        borderRadius: '8px',
                        padding: '3rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#f9fafb'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <i className="fas fa-file-excel" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}></i>
                    <p style={{ color: '#4b5563', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Click to upload Excel or CSV file</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Supported formats: .xlsx, .xls, .csv</p>
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
                            <span style={{ fontWeight: 600, color: '#1e40af' }}>Selected File:</span> {file.name}
                            <div style={{ fontSize: '0.85rem', color: '#60a5fa', marginTop: '0.25rem' }}>{previewData.length} rows found</div>
                        </div>
                        <button
                            onClick={() => { setFile(null); setPreviewData([]); }}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}
                        >
                            Change
                        </button>
                    </div>

                    {previewData.length > 0 && (
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '1.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#f3f4f6' }}>
                                    <tr>
                                        {Object.keys(previewData[0] || {}).map(header => (
                                            <th key={header} style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            {Object.values(row).map((val: any, j) => (
                                                <td key={j} style={{ padding: '0.75rem', color: '#111827' }}>{val}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 10 && (
                                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', background: '#f9fafb' }}>
                                    ...and {previewData.length - 10} more rows
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            onClick={onCancel}
                            style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: loading ? '#93c5fd' : '#2563eb',
                                color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 500,
                                minWidth: '120px'
                            }}
                        >
                            {loading ? 'Importing...' : 'Start Import'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
