import React, { useState } from "react";

interface AdminTableProps {
    title: string;
    columns: string[];
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
    onAdd?: () => void;
    addLabel?: string;
}

export default function AdminTable({
    title,
    columns,
    data,
    onEdit,
    onDelete,
    onAdd,
    addLabel = "Add New"
}: AdminTableProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="admin-section active">
            <div className="section-header-row" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{title}</h2>
                {onAdd && (
                    <button
                        className="btn-primary"
                        style={{
                            background: '#7c3aed',
                            color: 'white',
                            border: 'none',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onClick={onAdd}
                    >
                        <i className="fas fa-plus"></i> {addLabel}
                    </button>
                )}
            </div>

            <div className="dashboard-invoices-section" style={{ marginTop: 0 }}>
                <div className="section-header-row" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div className="search-box" style={{ position: 'relative', width: '300px' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="invoices-table">
                        <thead>
                            <tr>
                                {columns.map((col, idx) => (
                                    <th key={idx}>{col}</th>
                                ))}
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? filteredData.map((item, idx) => (
                                <tr key={item.id || idx}>
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} style={{ verticalAlign: 'middle' }}>
                                            {/* Render simplified cell data. In real app, might need custom renderers */}
                                            {typeof item[col.toLowerCase().replace(/ /g, '_')] === 'object'
                                                ? JSON.stringify(item[col.toLowerCase().replace(/ /g, '_')])
                                                : item[col.toLowerCase().replace(/ /g, '_')] || item[Object.keys(item)[colIdx]]}
                                        </td>
                                    ))}
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => onEdit(item)}
                                                style={{
                                                    background: '#eff6ff',
                                                    color: '#3b82f6',
                                                    border: 'none',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Edit"
                                            >
                                                <i className="fas fa-pen"></i>
                                            </button>
                                            <button
                                                onClick={() => onDelete(item)}
                                                style={{
                                                    background: '#fef2f2',
                                                    color: '#ef4444',
                                                    border: 'none',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                        No data found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
