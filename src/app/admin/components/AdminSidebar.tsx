"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AutoRefreshSettings from "./AutoRefreshSettings";

interface AdminSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    onLogout: () => void;
    userRole?: string;
    username?: string;
    mobileOpen?: boolean;
}

export default function AdminSidebar({
    activeSection,
    setActiveSection,
    onLogout,
    userRole = 'accountant',
    username = 'Admin',
    mobileOpen = false
}: AdminSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const menuItems = [
        { id: "quick-actions", icon: "fa-rocket", label: "Quick Actions" },
        { id: "dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
        {
            id: "featured-manage",
            icon: "fa-star",
            label: "Featured Products"
        },
        //     id: "application",
        //     icon: "fa-th-large",
        //     label: "Application",
        //     subItems: [
        //         { id: "email-inbox", label: "Email" }
        //     ]
        // },
        {
            id: "inventory",
            icon: "fa-boxes",
            label: "Inventory Manage",
            subItems: [
                { id: "inventory-dashboard", label: "Inventory" },
                { id: "inventory-qc", label: "QC Inventory" },
                { id: "purchase-lots-list", label: "Purchase Lots" },
                { id: "purchase-lots-import", label: "Import Purchase Lot" }
            ]
        },
        {
            id: "production",
            icon: "fa-industry",
            label: "Production",
            subItems: [
                { id: "production-qc", label: "QC Checking" }
            ]
        },
        {
            id: "orders",
            icon: "fa-shopping-cart",
            label: "Orders Manage",
            subItems: [
                { id: "orders-all", label: "All Orders" },
                { id: "orders-create", label: "Create Order" },
                { id: "orders-returns", label: "Returns" }
            ]
        },
        {
            id: "customers",
            icon: "fa-users",
            label: "Customer Manage",
            subItems: [
                { id: "customers-all", label: "All Customers" },
                { id: "customers-groups", label: "Groups" }
            ]
        },
        {
            id: "accounts",
            icon: "fa-wallet",
            label: "Accounts",
            subItems: [
                { id: "accounts-dashboard", label: "Dashboard" },
                { id: "accounts-items", label: "Items" },
                { id: "accounts-sales", label: "Sales" },
                { id: "accounts-purchases", label: "Purchases" },
                { id: "accounts-reports", label: "Reports" }
            ]
        },
        {
            id: "reports",
            icon: "fa-chart-line",
            label: "Reports",
            subItems: [
                { id: "reports-sales", label: "Sales Report" }
            ]
        },
        {
            id: "invoicing",
            icon: "fa-file-invoice",
            label: "Billing",
            subItems: [
                { id: "invoicing-dashboard", label: "Dashboard" },
                { id: "invoicing-all", label: "All Invoice" },
                { id: "quotations-all", label: "All Quotations" },
                { id: "invoicing-new", label: "New Invoice" },
                { id: "quotations-new", label: "New Quotation" },
                { id: "payments-all", label: "Partial Payments" },
                { id: "invoices-return", label: "Invoice Return" }
            ]
        },
        {
            id: "users",
            icon: "fa-user-shield",
            label: "User Manage",
            subItems: [
                { id: "users-all", label: "All Users" },
                { id: "users-roles", label: "Roles and Permissions" }
            ]
        },
        {
            id: "user-passwords",
            icon: "fa-key",
            label: "User Password"
        },
        {
            id: "activity-log",
            icon: "fa-history",
            label: "Activity Log"
        },
        {
            id: "auto-refresh",
            icon: "fa-sync-alt",
            label: "Auto Refresh"
        },
    ];

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [showAutoRefreshSettings, setShowAutoRefreshSettings] = useState(false);

    // Load collapsed state from localStorage on mount
    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }
    }, []);

    // Save collapsed state to localStorage when it changes
    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState.toString());
        // Collapse all menus when sidebar is collapsed
        if (newState) {
            setExpandedMenus([]);
        }
    };

    // Determine if sidebar should appear expanded
    const isExpanded = !isCollapsed || (isCollapsed && isHovering);

    const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        if (isCollapsed) {
            setIsHovering(true);
        }
    };

    const handleMouseLeave = () => {
        if (isCollapsed) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsHovering(false);
                setExpandedMenus([]); // Collapse all sub-menus on hover leave
            }, 300);
        }
    };

    const toggleMenu = (id: string) => {
        setExpandedMenus(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleItemClick = (item: any) => {
        if (item.id === 'auto-refresh') {
            setShowAutoRefreshSettings(true);
        } else if (item.id === 'dashboard') {
            router.push('/admin/dashboard');
        } else if (item.id === 'featured-manage') {
            router.push('/admin/featured-products');
        } else if (item.id === 'user-passwords') {
            router.push('/admin/passwords');
        } else if (item.id === 'activity-log') {
            router.push('/admin/activity-log');
        } else if (item.id === 'quick-actions') {
            router.push('/admin/quick-actions');
        } else if (item.subItems) {
            toggleMenu(item.id);
        } else {
            router.push(`/admin/${item.id}`);
        }
    };

    const displayedItems = menuItems.filter(item => {
        // Accountant restriction
        if (userRole?.toLowerCase() === 'accountant') {
            return ['dashboard', 'orders', 'invoicing'].includes(item.id);
        }

        // Super Admin restriction for sensitive sections
        if (['user-passwords', 'activity-log'].includes(item.id)) {
            // Check if user is superadmin (either by role or username handle)
            const isSuperAdmin = userRole?.toLowerCase() === 'super admin' || username === 'superadmin';
            return isSuperAdmin;
        }

        return true;
    });

    return (
        <aside
            className={`modern-sidebar ${!isExpanded ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="sidebar-header">
                <Link href="/" className="brand-wrapper">
                    <div className="brand-logo">
                        <img src="/icon/nav-logo.png" alt="Bizzcohub" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    {isExpanded && <span className="brand-text">Bizzcohub</span>}
                </Link>
            </div>

            <nav className="sidebar-menu">
                <div className="menu-label">MAIN MENU</div>
                {displayedItems.map((item) => {
                    const isActive = activeSection === item.id || (item.subItems && item.subItems.some((sub: any) => sub.id === activeSection));
                    const isExpanded = expandedMenus.includes(item.id);

                    return (
                        <div key={item.id} className="nav-item-wrapper">
                            <button
                                className={`nav-item ${isActive ? "active" : ""}`}
                                onClick={() => handleItemClick(item)}
                            >
                                <i className={`${item.icon.includes('fab') ? '' : 'fas'} ${item.icon}`}></i>
                                <span className="nav-text">{item.label}</span>
                                {item.subItems && (
                                    <i className={`fas fa-chevron-right dropdown-arrow ${isExpanded ? 'rotated' : ''}`}></i>
                                )}
                            </button>

                            {item.subItems && (
                                <div className={`sub-menu ${isExpanded ? 'expanded' : ''}`}>
                                    {item.subItems.map((sub: any) => (
                                        <button
                                            key={sub.id}
                                            className={`sub-nav-item ${activeSection === sub.id ? "active" : ""}`}
                                            onClick={() => {
                                                const id = sub.id;
                                                if (id === 'email-inbox') {
                                                    router.push('/admin/email');
                                                } else if (id.startsWith('inventory-') || id.startsWith('products-') || id.startsWith('purchase-lots-')) {
                                                    router.push(`/admin/inventory?section=${id}`);
                                                } else if (id.startsWith('production-')) {
                                                    router.push(`/admin/production?section=${id}`);
                                                } else if (id === 'users-all') {
                                                    router.push('/admin/users');
                                                } else if (id === 'users-roles') {
                                                    router.push('/admin/users/roles');
                                                } else if (id === 'customers-all') {
                                                    router.push('/admin/customers');
                                                } else if (id === 'invoicing-dashboard') {
                                                    router.push('/admin/billing');
                                                } else if (id === 'invoicing-all') {
                                                    router.push('/admin/billing/invoices');
                                                } else if (id === 'quotations-all') {
                                                    router.push('/admin/billing/quotations');
                                                } else if (id === 'invoicing-new') {
                                                    router.push('/admin/billing/invoices/new');
                                                } else if (id === 'quotations-new') {
                                                    router.push('/admin/billing/quotations/new');
                                                } else if (id === 'payments-all') {
                                                    router.push('/admin/billing/payments');
                                                } else if (id === 'invoices-return') {
                                                    router.push('/admin/billing/returns');
                                                } else if (id === 'orders-all') {
                                                    router.push('/admin/orders');
                                                } else if (id === 'orders-create') {
                                                    router.push('/admin/orders/create');
                                                } else if (id === 'orders-returns') {
                                                    router.push('/admin/orders/returns');
                                                } else {
                                                    router.push(`/admin/${id.replace('-', '/')}`);
                                                }
                                            }}
                                        >
                                            <span className="sub-nav-text">{sub.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Sidebar Footer with Toggle Button */}
            <div className="sidebar-footer">
                <button
                    className="sidebar-toggle-btn"
                    onClick={toggleSidebar}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                    {isExpanded && <span className="toggle-text">{isCollapsed ? 'Expand' : 'Collapse'}</span>}
                </button>
            </div>

            {/* Auto Refresh Settings Modal */}
            <AutoRefreshSettings
                isOpen={showAutoRefreshSettings}
                onClose={() => setShowAutoRefreshSettings(false)}
            />
        </aside>
    );
}
