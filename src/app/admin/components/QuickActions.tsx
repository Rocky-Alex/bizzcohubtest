import React from 'react';

interface QuickActionsProps {
    setActiveSection: (section: string) => void;
}

export default function QuickActions({ setActiveSection }: QuickActionsProps) {
    const actionGroups = [
        {
            title: "Quick Access",
            actions: [
                { id: "dashboard", label: "Dashboard", icon: "fa-tachometer-alt", color: "#4f46e5" },
                { id: "auto-refresh", label: "Auto Refresh", icon: "fa-sync-alt", color: "#6b7280" }
            ]
        },
        {
            title: "Inventory & Products",
            actions: [
                { id: "inventory-dashboard", label: "Inv. Dashboard", icon: "fa-boxes", color: "#10b981" },
                { id: "products-add", label: "Add Product", icon: "fa-plus-circle", color: "#3b82f6" },
                { id: "products-import", label: "Import Products", icon: "fa-file-import", color: "#8b5cf6" },
                { id: "production-pipeline", label: "Production Pipe", icon: "fa-industry", color: "#f97316" },
                { id: "production-history", label: "Prod. History", icon: "fa-history", color: "#ea580c" }
            ]
        },
        {
            title: "Order Management",
            actions: [
                { id: "orders-all", label: "All Orders", icon: "fa-list-ul", color: "#f59e0b" },
                { id: "orders-create", label: "Create Order", icon: "fa-cart-plus", color: "#ef4444" },
                { id: "orders-returns", label: "Returns", icon: "fa-undo-alt", color: "#dc2626" }
            ]
        },
        {
            title: "Customer & Billing",
            actions: [
                { id: "customers-all", label: "All Customers", icon: "fa-users", color: "#14b8a6" },
                { id: "customers-groups", label: "Cust. Groups", icon: "fa-layer-group", color: "#0d9488" },
                { id: "invoicing-dashboard", label: "Billing Dash", icon: "fa-file-invoice", color: "#6366f1" },
                { id: "invoicing-all", label: "All Invoices", icon: "fa-file-alt", color: "#4f46e5" },
                { id: "invoicing-new", label: "New Invoice", icon: "fa-plus-square", color: "#8b5cf6" },
                { id: "accounting-overview", label: "Accounting", icon: "fa-coins", color: "#d97706" },
                { id: "accounting-transactions", label: "Transactions", icon: "fa-exchange-alt", color: "#b45309" }
            ]
        },
        {
            title: "Marketplace Integration",
            actions: [
                { id: "amazon-dashboard", label: "Amazon Dash", icon: "fab fa-amazon", color: "#ff9900" },
                { id: "amazon-orders", label: "Amazon Orders", icon: "fa-shipping-fast", color: "#ff9900" },
                { id: "amazon-listings", label: "Amazon Listings", icon: "fa-list", color: "#ff9900" },
                { id: "noon-dashboard", label: "Noon Dash", icon: "fa-store", color: "#feee00", textColor: '#000' }, // Noon yellow
                { id: "noon-orders", label: "Noon Orders", icon: "fa-box-open", color: "#feee00", textColor: '#000' },
                { id: "noon-listings", label: "Noon Listings", icon: "fa-clipboard-list", color: "#feee00", textColor: '#000' }
            ]
        },
        {
            title: "Administration",
            actions: [
                { id: "users-all", label: "Manage Users", icon: "fa-user-shield", color: "#db2777" },
                { id: "users-roles", label: "Roles & Perms", icon: "fa-key", color: "#be185d" },
                { id: "reports-sales", label: "Sales Reports", icon: "fa-chart-line", color: "#ef4444" }
            ]
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', color: '#111827', fontWeight: 700 }}>
                <i className="fas fa-rocket" style={{ marginRight: '0.75rem', color: '#4f46e5' }}></i>
                Quick Actions
            </h2>

            {actionGroups.map((group, index) => (
                <div key={index} style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{
                        fontSize: '1.1rem',
                        color: '#6b7280',
                        marginBottom: '1rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <i className="fas fa-chevron-right" style={{ fontSize: '0.8em', marginRight: '0.5rem', color: '#d1d5db' }}></i>
                        {group.title}
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '1.25rem'
                    }}>
                        {group.actions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => setActiveSection(action.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '1.5rem 1rem',
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    height: '100%',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 8px 12px -3px rgba(0, 0, 0, 0.1)';
                                    e.currentTarget.style.borderColor = action.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                            >
                                <div style={{
                                    fontSize: '1.75rem',
                                    marginBottom: '0.75rem',
                                    color: action.textColor || action.color,
                                    background: action.color === '#feee00' ? '#feee00' : `${action.color}15`, // Handle yellow specifically
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: action.color === '#feee00' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}>
                                    <i className={`${action.icon.startsWith('fab') ? action.icon : 'fas ' + action.icon}`}></i>
                                </div>
                                <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: '#374151',
                                    textAlign: 'center',
                                    lineHeight: '1.3'
                                }}>
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
