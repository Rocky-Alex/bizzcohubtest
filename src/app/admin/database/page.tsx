"use client";

import React, { useState } from "react";
import { toast } from "sonner";

export default function DatabasePage() {
    type Section = "Inventory" | "Sales" | "People" | "Billing" | "System" | "Purchases";

    interface TableInfo {
        name: string;
        description: string;
        tableName: string;
    }

    const SECTIONS: Record<Section, TableInfo[]> = {
        Inventory: [
            { name: "Products", description: "All product inventory and details", tableName: "products" },
            { name: "Featured Products", description: "Configuration for featured products on homepage", tableName: "featured_products_config" },
            { name: "Inventory QC", description: "Quality control records", tableName: "inventory_qc" }
        ],
        Purchases: [
            { name: "Purchase Lots", description: "Batch purchase records", tableName: "purchase_lots" },
            { name: "Purchase Items", description: "Individual items in purchase lots", tableName: "purchase_lot_items" }
        ],
        Sales: [
            { name: "Orders", description: "Customer orders and transactions", tableName: "orders" }
        ],
        People: [
            { name: "Customers", description: "Registered customer profiles", tableName: "customers" },
            { name: "Users", description: "Admin and staff user accounts", tableName: "users" },
            { name: "Roles", description: "User roles and permissions", tableName: "roles" },
            { name: "Wishlist", description: "Customer product wishlists", tableName: "wishlist" }
        ],
        Billing: [
            { name: "Invoices", description: "All generated invoice records", tableName: "invoices" },
            { name: "Invoice Items", description: "Line items for invoices", tableName: "invoice_items" },
            { name: "Quotations", description: "All quotation records", tableName: "quotations" },
            { name: "Quotation Items", description: "Line items for quotations", tableName: "quotation_items" },
            { name: "Payments", description: "Recorded invoice payments", tableName: "invoice_payments" }
        ],
        System: [
            { name: "Activity Logs", description: "System usage history", tableName: "activity_logs" },
            { name: "Admin Emails", description: "Sent email records", tableName: "admin_emails" },
            { name: "Settings", description: "System configuration settings", tableName: "settings" }
        ]
    };

    const [activeSection, setActiveSection] = useState<Section>("Inventory");
    const [clearingTable, setClearingTable] = useState<string | null>(null);

    const handleClearDatabase = async (tableName: string, displayName: string) => {
        if (!confirm(`Are you sure you want to clear ALL data from ${displayName}? This action cannot be undone.`)) {
            return;
        }

        if (tableName === 'users') {
            if (!confirm(`WARNING: Clearing 'Users' will remove all admin accounts. Are you absolutely sure?`)) {
                return;
            }
        }

        setClearingTable(tableName);
        try {
            const response = await fetch('/api/admin/database/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableName })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`${displayName} cleared successfully`);
            } else {
                toast.error(data.error || `Failed to clear ${displayName}`);
            }
        } catch (error) {
            console.error('Error clearing database:', error);
            toast.error("An unexpected error occurred");
        } finally {
            setClearingTable(null);
        }
    };

    return (
        <div className="database-management-page" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem', color: '#333' }}>Database Management</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 250px) 1fr', gap: '2rem', minHeight: '500px' }}>
                {/* Left Column - Sections */}
                <div className="sections-sidebar" style={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '1.5rem',
                    height: 'fit-content'
                }}>
                    <h3 style={{
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#6b7280',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}>
                        Collections
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(Object.keys(SECTIONS) as Section[]).map((section) => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                style={{
                                    textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    background: activeSection === section ? '#eff6ff' : 'transparent',
                                    color: activeSection === section ? '#2563eb' : '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: activeSection === section ? '600' : '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s ease',
                                    fontSize: '1rem'
                                }}
                            >
                                <span style={{ width: '20px', textAlign: 'center' }}>
                                    {section === 'Inventory' && <i className="fas fa-boxes"></i>}
                                    {section === 'Sales' && <i className="fas fa-shopping-cart"></i>}
                                    {section === 'People' && <i className="fas fa-users"></i>}
                                    {section === 'Billing' && <i className="fas fa-file-invoice-dollar"></i>}
                                    {section === 'System' && <i className="fas fa-cog"></i>}
                                    {section === 'Purchases' && <i className="fas fa-truck-loading"></i>}
                                </span>
                                {section}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column - Tables */}
                <div className="tables-content" style={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '2rem'
                }}>
                    <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                            {activeSection}
                        </h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            Manage data tables for {activeSection.toLowerCase()}. Irreversible actions below.
                        </p>
                    </div>

                    <div className="tables-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {SECTIONS[activeSection].map((table) => (
                            <div key={table.tableName} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#f9fafb',
                                transition: 'border-color 0.2s'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>{table.name}</h3>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            background: '#e5e7eb',
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: '9999px',
                                            color: '#4b5563',
                                            fontFamily: 'monospace'
                                        }}>
                                            {table.tableName}
                                        </span>
                                    </div>
                                    <p style={{ color: '#6b7280', fontSize: '0.925rem' }}>{table.description}</p>
                                </div>

                                <button
                                    onClick={() => handleClearDatabase(table.tableName, table.name)}
                                    disabled={!!clearingTable}
                                    style={{
                                        background: clearingTable === table.tableName ? '#fee2e2' : '#fff',
                                        color: clearingTable === table.tableName ? '#b91c1c' : '#dc2626',
                                        border: '1px solid #fecaca',
                                        padding: '0.625rem 1.25rem',
                                        borderRadius: '6px',
                                        cursor: !!clearingTable ? 'not-allowed' : 'pointer',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        fontSize: '0.9rem',
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!clearingTable) {
                                            e.currentTarget.style.background = '#dc2626';
                                            e.currentTarget.style.color = '#ffffff';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!clearingTable) {
                                            e.currentTarget.style.background = '#ffffff';
                                            e.currentTarget.style.color = '#dc2626';
                                        }
                                    }}
                                >
                                    {clearingTable === table.tableName ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i> Clearing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-trash-alt"></i> Clear Data
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
