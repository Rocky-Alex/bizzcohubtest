"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import ConfirmModal from "../shared/ConfirmModal";
import DatabaseTransferTool from "./components/DatabaseTransferTool";

export default function DatabasePage() {
    type Section = "Inventory" | "Sales" | "People" | "Billing" | "System" | "Purchases";

    interface TableInfo {
        name: string;
        description: string;
        tableName: string;
    }

    interface Subsection {
        id: string;
        label: string;
        tables: TableInfo[];
    }

    // New Schema Structure
    const SCHEMA: Record<Section, Subsection[]> = {
        Inventory: [
            {
                id: 'products', label: 'Products', tables: [
                    { name: 'Products', tableName: 'products', description: 'Main product catalog' },
                    { name: 'Featured Config', tableName: 'featured_products_config', description: 'Homepage featured items' },
                    { name: 'Inventory QC', tableName: 'inventory_qc', description: 'Quality control records' }
                ]
            }
        ],
        Purchases: [
            {
                id: 'purchase_management', label: 'Purchase Management', tables: [
                    { name: 'Purchase Lots', tableName: 'purchase_lots', description: 'Batch purchase records' },
                    { name: 'Lot Items', tableName: 'purchase_lot_items', description: 'Individual items in purchase lots' }
                ]
            }
        ],
        Sales: [
            {
                id: 'orders', label: 'Orders', tables: [
                    { name: 'Orders', tableName: 'orders', description: 'Customer orders and transactions' }
                ]
            }
        ],
        People: [
            {
                id: 'customers', label: 'Customers', tables: [
                    { name: 'Customers', tableName: 'customers', description: 'Registered customer profiles' },
                    { name: 'Wishlist', tableName: 'wishlist', description: 'Customer wishlists' }
                ]
            },
            {
                id: 'users', label: 'Users', tables: [
                    { name: 'Users', tableName: 'users', description: 'Admin and staff user accounts' },
                    { name: 'Roles', tableName: 'roles', description: 'User roles and permissions' }
                ]
            }
        ],
        Billing: [
            {
                id: 'invoices', label: 'Invoices', tables: [
                    { name: 'Invoices', tableName: 'invoices', description: 'Generated invoices' },
                    { name: 'Invoice Items', tableName: 'invoice_items', description: 'Invoice line items' },
                    { name: 'Payments', tableName: 'invoice_payments', description: 'Recorded payments' }
                ]
            },
            {
                id: 'quotations', label: 'Quotations', tables: [
                    { name: 'Quotations', tableName: 'quotations', description: 'Quotation records' },
                    { name: 'Quotation Items', tableName: 'quotation_items', description: 'Quotation line items' }
                ]
            }
        ],
        System: [
            {
                id: 'logs', label: 'Logs', tables: [
                    { name: 'Activity Logs', tableName: 'activity_logs', description: 'System usage history' },
                    { name: 'Admin Emails', tableName: 'admin_emails', description: 'Sent email records' }
                ]
            },
            {
                id: 'config', label: 'Configuration', tables: [
                    { name: 'Settings', tableName: 'settings', description: 'System settings' }
                ]
            }
        ]
    };

    const [activeSection, setActiveSection] = useState<Section | null>(null);
    const [activeSubsectionId, setActiveSubsectionId] = useState<string | null>(null);
    const [activeTable, setActiveTable] = useState<TableInfo | null>(null);

    // Navigation History State
    const [history, setHistory] = useState<any[]>([{ type: 'collections' }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const currentNav = history[historyIndex];

    // Data View State
    const [tableData, setTableData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

    // Actions State
    const [clearingTable, setClearingTable] = useState<string | null>(null);
    const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    const navigateTo = (nav: any) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(nav);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // Update local state for rendering
        if (nav.section) setActiveSection(nav.section);
        if (nav.subsectionId) setActiveSubsectionId(nav.subsectionId);
        if (nav.table) setActiveTable(nav.table);
        if (nav.type === 'collections') {
            setActiveSection(null);
            setActiveSubsectionId(null);
            setActiveTable(null);
        }
    };

    // Sync state whenever history index changes
    useEffect(() => {
        const current = history[historyIndex];
        if (current) {
            if (current.type === 'collections') {
                setActiveSection(null);
                setActiveSubsectionId(null);
                setActiveTable(null);
            } else {
                setActiveSection(current.section || null);
                setActiveSubsectionId(current.subsectionId || null);
                setActiveTable(current.table || null);
            }
        }
    }, [historyIndex, history]);

    const goBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const goForward = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    const setNavIndex = (index: number) => {
        setHistoryIndex(index);
    };

    const getLevel = () => {
        if (currentNav.type === 'transfer-tool') return 'transfer-tool';
        if (currentNav.type === 'collections') return 'sections';
        if (currentNav.table) return 'data';
        if (currentNav.subsectionId) return 'tables';
        if (currentNav.section) return 'subsections';
        return 'sections';
    };

    const currentLevel = getLevel();

    // Fetch Table Data when activeTable changes
    useEffect(() => {
        if (activeTable) {
            fetchTableData(activeTable.tableName, 1);
        } else {
            setTableData([]);
            setColumns([]);
        }
    }, [activeTable]);

    const fetchTableData = async (tableName: string, page: number) => {
        setLoadingData(true);
        try {
            const limit = 50;
            const offset = (page - 1) * limit;
            const res = await fetch(`/api/admin/database/data?table=${tableName}&limit=${limit}&offset=${offset}`);
            const json = await res.json();

            if (res.ok) {
                setTableData(json.data || []);
                setColumns(json.columns || []);
                setPagination({
                    page: json.page,
                    total: json.total,
                    totalPages: json.totalPages
                });
            } else {
                toast.error(json.error || 'Failed to fetch table data');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Error loading data');
        } finally {
            setLoadingData(false);
        }
    };

    const handleDeleteRow = async (id: any) => {
        if (!activeTable) return;

        setConfirmModal({
            isOpen: true,
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete this record from "${activeTable.name}"? This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setDeletingRowId(String(id));
                try {
                    const response = await fetch('/api/admin/database/delete-row', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tableName: activeTable.tableName, id })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        toast.success('Record deleted successfully');
                        fetchTableData(activeTable.tableName, pagination.page);
                    } else {
                        toast.error(data.error || 'Failed to delete record');
                    }
                } catch (error) {
                    console.error('Error deleting row:', error);
                    toast.error('An unexpected error occurred');
                } finally {
                    setDeletingRowId(null);
                }
            }
        });
    };

    const handleClearDatabase = (tableNames: string[], displayName: string) => {
        const isMultiple = tableNames.length > 1;
        const message = isMultiple
            ? `Are you sure you want to clear ALL data from all tables in "${displayName}"? This will wipe ${tableNames.length} tables. This action cannot be undone.`
            : `Are you sure you want to clear ALL data from "${displayName}"? This action cannot be undone.`;

        setConfirmModal({
            isOpen: true,
            title: isMultiple ? 'Wipe Collection' : 'Clear Table',
            message: message,
            type: 'danger',
            onConfirm: () => {
                if (tableNames.includes('users')) {
                    setConfirmModal({
                        isOpen: true,
                        title: 'CRITICAL WARNING',
                        message: 'One of the selected tables is "Users". Clearing it will remove all admin accounts. Are you absolutely sure you want to proceed?',
                        type: 'danger',
                        onConfirm: () => {
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            executeClear(tableNames, displayName);
                        }
                    });
                } else {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    executeClear(tableNames, displayName);
                }
            }
        });
    };

    const executeClear = async (tableNames: string[], displayName: string) => {
        setClearingTable(tableNames.join(','));
        try {
            const response = await fetch('/api/admin/database/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tables: tableNames })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`${displayName} cleared successfully`);
                // Refresh data if looking at one of these tables
                if (activeTable && tableNames.includes(activeTable.tableName)) {
                    fetchTableData(activeTable.tableName, 1);
                }
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

    const handleTransfer = async (direction: 'main-to-local' | 'local-to-main') => {
        const title = direction === 'main-to-local' ? 'Transfer Main to Local' : 'Transfer Local to Main';
        const message = `This will copy all data from the ${direction === 'main-to-local' ? 'Main' : 'Local'} database to the ${direction === 'main-to-local' ? 'Local' : 'Main'} database. ALL EXISTING DATA in the destination database will be WIPED and replaced. This cannot be undone. Do you want to proceed?`;

        setConfirmModal({
            isOpen: true,
            title,
            message,
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsTransferring(true);
                const toastId = toast.loading('Initializing database transfer...');
                try {
                    const response = await fetch('/api/admin/database/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ direction })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        toast.success('Database transfer completed successfully!', { id: toastId });
                        if (activeTable) fetchTableData(activeTable.tableName, 1);
                    } else {
                        toast.error(data.error || 'Transfer failed', { id: toastId });
                    }
                } catch (error) {
                    console.error('Transfer error:', error);
                    toast.error('An unexpected error occurred during transfer', { id: toastId });
                } finally {
                    setIsTransferring(false);
                }
            }
        });
    };

    const currentSubsections = activeSection ? SCHEMA[activeSection] : [];
    const activeSubsection = currentSubsections.find(sub => sub.id === activeSubsectionId);

    const renderBreadcrumbs = () => {
        const crumbs = [
            { label: 'All Collections', action: () => setNavIndex(0) }
        ];

        // Only show breadcrumbs up to what's in the CURRENT history item
        if (currentNav.section) {
            const sectionIdx = history.findIndex(h => h.section === currentNav.section && !h.subsectionId);
            crumbs.push({ label: currentNav.section, action: () => setNavIndex(sectionIdx !== -1 ? sectionIdx : 0) });
        }

        if (currentNav.subsectionId) {
            const subIdx = history.findIndex(h => h.subsectionId === currentNav.subsectionId && !h.table);
            const subLabel = SCHEMA[activeSection!]?.find(s => s.id === currentNav.subsectionId)?.label || 'Category';
            crumbs.push({ label: subLabel, action: () => setNavIndex(subIdx !== -1 ? subIdx : 0) });
        }

        if (currentNav.table) {
            crumbs.push({ label: currentNav.table.name, action: () => { } });
        }

        if (currentNav.type === 'transfer-tool') {
            crumbs.push({ label: 'Data Sync Tool', action: () => { } });
        }

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#64748b', fontSize: '0.9rem' }}>
                {crumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                        <span
                            onClick={crumb.action}
                            style={{
                                fontWeight: idx === crumbs.length - 1 ? '700' : '500',
                                color: idx === crumbs.length - 1 ? '#0f172a' : '#94a3b8',
                                cursor: idx < crumbs.length - 1 ? 'pointer' : 'default',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => { if (idx < crumbs.length - 1) e.currentTarget.style.color = '#2563eb'; }}
                            onMouseLeave={(e) => { if (idx < crumbs.length - 1) e.currentTarget.style.color = '#94a3b8'; }}
                        >
                            {crumb.label}
                        </span>
                        {idx < crumbs.length - 1 && <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem', opacity: 0.4 }}></i>}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="database-page" style={{
            height: 'calc(100vh - 140px)', // Precise height to fit within AdminLayout content area
            display: 'flex',
            flexDirection: 'column',
            background: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden'
        }}>
            {/* NEW PREMIUM HEADER */}
            <header style={{
                padding: '1rem 2rem',
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            disabled={historyIndex === 0}
                            onClick={goBack}
                            style={{
                                width: '38px', height: '38px', borderRadius: '12px',
                                border: '1px solid #e2e8f0', background: 'white',
                                cursor: 'pointer', color: historyIndex === 0 ? '#cbd5e1' : '#475569',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                boxShadow: historyIndex === 0 ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <button
                            disabled={historyIndex >= history.length - 1}
                            onClick={goForward}
                            style={{
                                width: '38px', height: '38px', borderRadius: '12px',
                                border: '1px solid #e2e8f0', background: 'white',
                                cursor: 'pointer', color: historyIndex >= history.length - 1 ? '#cbd5e1' : '#475569',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                boxShadow: historyIndex >= history.length - 1 ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }}></div>

                    {renderBreadcrumbs()}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => {
                            if (activeTable) {
                                fetchTableData(activeTable.tableName, pagination.page);
                            } else {
                                // No dynamic data on higher levels, but provide feedback and refresh UI
                                toast.success('Refreshing views...');
                                setTimeout(() => window.location.reload(), 500);
                            }
                        }}
                        style={{
                            padding: '0 1.25rem', height: '38px', borderRadius: '12px',
                            border: '1px solid #e2e8f0', background: 'white',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '0.9rem', fontWeight: '600', color: '#475569',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                        <i className={`fas fa-sync ${loadingData ? 'fa-spin' : ''}`}></i> Refresh
                    </button>
                    <button
                        onClick={() => {
                            const current = history[historyIndex];
                            let targets: string[] = [];
                            let label = "";

                            if (activeTable) {
                                targets = [activeTable.tableName];
                                label = activeTable.name;
                            } else if (activeSubsection) {
                                targets = activeSubsection.tables.map(t => t.tableName);
                                label = activeSubsection.label;
                            } else if (activeSection) {
                                targets = SCHEMA[activeSection].flatMap(sub => sub.tables.map(t => t.tableName));
                                label = activeSection;
                            } else {
                                // Root Level: Clear Business Data Only (Exclude People)
                                targets = (Object.keys(SCHEMA) as Section[])
                                    .filter(key => key !== 'People')
                                    .flatMap(key => SCHEMA[key].flatMap(sub => sub.tables.map(t => t.tableName)));
                                label = "Business Data (Everything except People)";
                            }

                            if (targets.length > 0) {
                                handleClearDatabase(targets, label);
                            } else {
                                toast.error("No tables found to clear.");
                            }
                        }}
                        disabled={!!clearingTable}
                        style={{
                            padding: '0 1.25rem', height: '38px', borderRadius: '12px',
                            background: '#ef4444',
                            border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '0.9rem', fontWeight: '600', color: 'white',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
                            opacity: clearingTable ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                        }}
                    >
                        <i className="fas fa-trash-alt"></i>
                        {activeTable ? 'Clear Table' : (activeSubsection ? `Clear Category` : (activeSection ? `Clear ${activeSection}` : 'Clear Business Data'))}
                    </button>
                </div>
            </header>

            {/* CONTENT AREA - Transitions Level by Level */}
            <main style={{
                flex: 1,
                padding: currentLevel === 'data' ? '0.75rem 1rem' : '2rem',
                overflowY: currentLevel === 'data' ? 'hidden' : 'auto',
                position: 'relative',
                transition: 'padding 0.3s',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    maxWidth: currentLevel === 'data' ? '1800px' : '1800px',
                    margin: '0 auto',
                    width: '100%',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'max-width 0.3s',
                    minHeight: 0
                }}>

                    {/* LEVEL 0: ALL COLLECTIONS */}
                    {currentLevel === 'sections' && (
                        <div>
                            <div style={{ marginBottom: '2rem' }}>
                                <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.04em' }}>Database Manager</h1>
                                <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem' }}>Select a collection to begin exploring structures.</p>
                            </div>


                            {/* BUSINESS OPERATIONS GROUP */}
                            <div style={{ marginBottom: '3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '4px', height: '24px', background: '#2563eb', borderRadius: '2px' }}></div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
                                        Business Operations
                                    </h2>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {['Inventory', 'Purchases', 'Sales', 'Billing', 'System'].map((sectionKey) => {
                                        const section = sectionKey as Section;
                                        return (
                                            <button
                                                key={section}
                                                onClick={() => navigateTo({ section })}
                                                style={{
                                                    padding: '2rem 2rem', background: 'white', borderRadius: '24px',
                                                    border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    display: 'flex', flexDirection: 'column', gap: '1.5rem',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                    position: 'relative', overflow: 'hidden'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                                    e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                                                    e.currentTarget.style.borderColor = '#2563eb';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                                }}
                                            >
                                                <div style={{
                                                    width: '56px', height: '56px', borderRadius: '18px',
                                                    background: '#eff6ff', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: '1.5rem', color: '#2563eb'
                                                }}>
                                                    {section === 'Inventory' && <i className="fas fa-boxes"></i>}
                                                    {section === 'Sales' && <i className="fas fa-shopping-cart"></i>}
                                                    {section === 'Billing' && <i className="fas fa-file-invoice-dollar"></i>}
                                                    {section === 'System' && <i className="fas fa-cog"></i>}
                                                    {section === 'Purchases' && <i className="fas fa-truck-loading"></i>}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>{section}</h3>
                                                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.5' }}>
                                                        {SCHEMA[section].length} categories
                                                    </p>
                                                </div>
                                                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', fontWeight: '700', fontSize: '0.8rem' }}>
                                                    View <i className="fas fa-arrow-right"></i>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PEOPLE & CRM GROUP */}
                            <div style={{ marginBottom: '3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '4px', height: '24px', background: '#ec4899', borderRadius: '2px' }}></div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
                                        People & CRM
                                    </h2>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {['People'].map((sectionKey) => {
                                        const section = sectionKey as Section;
                                        return (
                                            <button
                                                key={section}
                                                onClick={() => navigateTo({ section })}
                                                style={{
                                                    padding: '2rem 2rem', background: 'white', borderRadius: '24px',
                                                    border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    display: 'flex', flexDirection: 'column', gap: '1.5rem',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                    position: 'relative', overflow: 'hidden'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                                    e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                                                    e.currentTarget.style.borderColor = '#ec4899';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                                }}
                                            >
                                                <div style={{
                                                    width: '56px', height: '56px', borderRadius: '18px',
                                                    background: '#fdf2f8', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: '1.5rem', color: '#db2777'
                                                }}>
                                                    <i className="fas fa-users"></i>
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>{section}</h3>
                                                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.5' }}>
                                                        {SCHEMA[section].length} categories
                                                    </p>
                                                </div>
                                                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#db2777', fontWeight: '700', fontSize: '0.8rem' }}>
                                                    View <i className="fas fa-arrow-right"></i>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TOOLS GROUP */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '4px', height: '24px', background: '#0891b2', borderRadius: '2px' }}></div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
                                        Utilities
                                    </h2>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    <button
                                        onClick={() => navigateTo({ type: 'transfer-tool' })}
                                        style={{
                                            padding: '2rem 2rem', background: '#ecfeff', borderRadius: '24px',
                                            border: '1px solid #cffafe', textAlign: 'left', cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex', flexDirection: 'column', gap: '1.5rem',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-6px)';
                                            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                                            e.currentTarget.style.borderColor = '#0891b2';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                            e.currentTarget.style.borderColor = '#cffafe';
                                        }}
                                    >
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '18px',
                                            background: '#cffafe', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '1.5rem', color: '#0891b2'
                                        }}>
                                            <i className="fas fa-exchange-alt"></i>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#164e63', letterSpacing: '-0.02em' }}>Database Transfer</h3>
                                            <p style={{ fontSize: '0.9rem', color: '#0e7490', marginTop: '0.4rem', lineHeight: '1.5' }}>
                                                Sync Local & Main DB
                                            </p>
                                        </div>
                                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0891b2', fontWeight: '700', fontSize: '0.8rem' }}>
                                            Open Tool <i className="fas fa-arrow-right"></i>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LEVEL: TRANSFER TOOL */}
                    {currentLevel === 'transfer-tool' && (
                        <DatabaseTransferTool onBack={goBack} />
                    )}

                    {/* LEVEL 1: CATEGORIES */}
                    {currentLevel === 'subsections' && activeSection && (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.04em' }}>
                                    {activeSection} Categories
                                </h2>
                                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Select a functional area to view specific data tables.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {SCHEMA[activeSection].map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => navigateTo({ section: activeSection, subsectionId: sub.id })}
                                        style={{
                                            padding: '1.5rem 2rem', background: 'white', borderRadius: '20px',
                                            border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.transform = 'translateX(8px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                                                <i className="fas fa-folder"></i>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b' }}>{sub.label}</span>
                                                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.125rem' }}>{sub.tables.length} structured tables available</p>
                                            </div>
                                        </div>
                                        <i className="fas fa-chevron-right" style={{ color: '#cbd5e1' }}></i>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LEVEL 2: TABLES */}
                    {currentLevel === 'tables' && activeSubsection && (
                        <div>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.04em' }}>
                                    {activeSubsection.label} Tables
                                </h2>
                                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Detailed storage structures for {activeSubsection.label.toLowerCase()}.</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                {activeSubsection.tables.map(table => (
                                    <button
                                        key={table.tableName}
                                        onClick={() => navigateTo({ section: activeSection, subsectionId: activeSubsectionId, table })}
                                        style={{
                                            padding: '2rem', background: 'white', borderRadius: '24px',
                                            border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex', flexDirection: 'column', gap: '1rem',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#2563eb';
                                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                                            e.currentTarget.style.background = '#f0f7ff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                            e.currentTarget.style.background = 'white';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#2563eb' }}>
                                                <i className="fas fa-table"></i>
                                            </div>
                                            <code style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                                {table.tableName}
                                            </code>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{table.name}</h3>
                                            <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.5rem', lineHeight: '1.5' }}>{table.description}</p>
                                        </div>
                                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.03)', color: '#2563eb', fontWeight: '700', fontSize: '0.875rem' }}>
                                            View Data <i className="fas fa-arrow-right" style={{ marginLeft: '0.25rem' }}></i>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LEVEL 3: DATA VIEW */}
                    {currentLevel === 'data' && activeTable && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <div style={{
                                background: 'white', borderRadius: '24px',
                                border: '1px solid #e2e8f0', display: 'flex',
                                flexDirection: 'column', flex: 1,
                                overflow: 'hidden',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                minHeight: 0
                            }}>
                                <div style={{ flex: 1, overflow: 'auto' }}>
                                    {loadingData ? (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                            <div className="loader" style={{
                                                width: '48px', height: '48px', border: '4px solid #f1f5f9',
                                                borderTopColor: '#2563eb', borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            <p style={{ marginTop: '1.5rem', fontWeight: '600', fontSize: '1.1rem' }}>Streaming records...</p>
                                        </div>
                                    ) : tableData.length === 0 ? (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '4rem' }}>
                                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                                                <i className="fas fa-folder-open fa-4x" style={{ opacity: 0.2 }}></i>
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Empty Collection</h3>
                                            <p style={{ fontSize: '1.1rem', marginTop: '0.5rem', maxWidth: '400px', textAlign: 'center' }}>No records were found in <strong>{activeTable.tableName}</strong>.</p>
                                        </div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.9rem' }}>
                                            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                                <tr>
                                                    {columns.map(col => (
                                                        <th key={col} style={{
                                                            textAlign: 'left', padding: '1.25rem 1.5rem',
                                                            borderBottom: '2px solid #e2e8f0', color: '#475569',
                                                            fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {col}
                                                        </th>
                                                    ))}
                                                    <th style={{
                                                        textAlign: 'center', padding: '1.25rem 1.5rem',
                                                        borderBottom: '2px solid #e2e8f0', color: '#475569',
                                                        fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem',
                                                        letterSpacing: '0.05em', width: '100px'
                                                    }}>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tableData.map((row, idx) => (
                                                    <tr key={idx} style={{
                                                        background: idx % 2 === 0 ? 'white' : '#fcfcfd',
                                                        transition: 'background 0.1s'
                                                    }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fcfcfd'}>
                                                        {columns.map(col => (
                                                            <td key={col} style={{
                                                                padding: '1.125rem 1.5rem', color: '#1e293b',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                whiteSpace: 'nowrap', maxWidth: '350px',
                                                                overflow: 'hidden', textOverflow: 'ellipsis',
                                                                fontFamily: col.toLowerCase().includes('id') || col.toLowerCase().includes('price') ? 'monospace' : 'inherit'
                                                            }}>
                                                                {typeof row[col] === 'object' ? (
                                                                    <span style={{ fontSize: '0.75rem', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                                                        JSON Object
                                                                    </span>
                                                                ) : String(row[col])}
                                                            </td>
                                                        ))}
                                                        <td style={{ textAlign: 'center', padding: '0.75rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const id = row.id || row.ID || row.Id;
                                                                    if (id !== undefined) {
                                                                        handleDeleteRow(id);
                                                                    } else {
                                                                        toast.error("No unique ID found for this row");
                                                                    }
                                                                }}
                                                                disabled={deletingRowId === String(row.id || row.ID || row.Id)}
                                                                style={{
                                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                                    background: '#fff1f2', border: '1px solid #fecaca',
                                                                    color: '#ef4444', cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = '#ef4444';
                                                                    e.currentTarget.style.color = 'white';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = '#fff1f2';
                                                                    e.currentTarget.style.color = '#ef4444';
                                                                }}
                                                            >
                                                                {deletingRowId === String(row.id || row.ID || row.Id) ? (
                                                                    <i className="fas fa-spinner fa-spin"></i>
                                                                ) : (
                                                                    <i className="fas fa-trash-alt"></i>
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <footer style={{
                                    padding: '0.875rem 1.5rem',
                                    background: 'white',
                                    borderTop: '1px solid #e2e8f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: '500'
                                }}>
                                    <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <span>Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong></span>
                                        <span style={{ height: '16px', width: '1px', background: '#e2e8f0' }}></span>
                                        <span>Total <strong>{pagination.total}</strong> records</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            disabled={pagination.page <= 1}
                                            onClick={() => fetchTableData(activeTable.tableName, pagination.page - 1)}
                                            style={{
                                                padding: '0.625rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white',
                                                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                                                color: pagination.page <= 1 ? '#cbd5e1' : '#1e293b',
                                                fontWeight: '600', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { if (pagination.page > 1) e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                        >
                                            <i className="fas fa-chevron-left" style={{ marginRight: '0.5rem' }}></i> Previous
                                        </button>
                                        <button
                                            disabled={pagination.page >= pagination.totalPages}
                                            onClick={() => fetchTableData(activeTable.tableName, pagination.page + 1)}
                                            style={{
                                                padding: '0.625rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white',
                                                cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                                                color: pagination.page >= pagination.totalPages ? '#cbd5e1' : '#1e293b',
                                                fontWeight: '600', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { if (pagination.page < pagination.totalPages) e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                        >
                                            Next <i className="fas fa-chevron-right" style={{ marginLeft: '0.5rem' }}></i>
                                        </button>
                                    </div>
                                </footer>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        </div>
                    )}
                </div>
            </main >

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
            />
        </div >
    );
}

