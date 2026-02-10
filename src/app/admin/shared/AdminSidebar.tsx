"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AutoRefreshSettings from "./AutoRefreshSettings";

interface AdminSidebarProps {
    onLogout: () => void;
    userRole?: string;
    username?: string;
    mobileOpen?: boolean;
}

export default function AdminSidebar({
    onLogout,
    userRole = 'accountant',
    username = 'Admin',
    mobileOpen = false
}: AdminSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const menuItems = [
        { id: "dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
        {
            id: "featured-manage",
            icon: "fa-star",
            label: "Featured Products"
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
            id: "production",
            icon: "fa-tools",
            label: "Production",
            subItems: [
                // { id: "production-dashboard", label: "Dashboard" },
                { id: "production-qc", label: "QC Checking" },
                { id: "production-packing", label: "Packing" },
                // { id: "production-projects", label: "Projects" },
                // { id: "production-tasks", label: "Tasks" }
            ]
        },
        {
            id: "purchase",
            icon: "fa-shopping-bag",
            label: "Purchase",
            subItems: [
                { id: "purchase-dashboard", label: "Dashboard" },
                { id: "purchase-history", label: "Purchase History" },
                { id: "purchase-import", label: "Import Shipment" },
                { id: "suppliers", label: "Suppliers" }
            ]
        },
        {
            id: "inventory",
            icon: "fa-boxes",
            label: "Inventory",
            subItems: [
                { id: "inventory-dashboard", label: "Dashboard" },
                { id: "products-list", label: "All Products" },
                { id: "add-product", label: "Add Product" },
                { id: "inventory-qc", label: "QC List" },
                { id: "inventory-drops", label: "Drop Lists" }
            ]
        },
        // {
        //     id: "accounts",
        //     icon: "fa-wallet",
        //     label: "Accounts",
        //     subItems: [
        //         { id: "accounts-dashboard", label: "Dashboard" },
        //         { id: "accounts-items", label: "Items" },
        //         { id: "accounts-sales", label: "Sales" },
        //         { id: "accounts-purchases", label: "Purchases" },
        //         { id: "accounts-reports", label: "Reports" }
        //     ]
        // },
        // {
        //     id: "reports",
        //     icon: "fa-chart-line",
        //     label: "Reports",
        //     subItems: [
        //         { id: "reports-sales", label: "Sales Report" }
        //     ]
        // },
        {
            id: "invoicing",
            icon: "fa-file-invoice",
            label: "Billing",
            subItems: [
                { id: "invoicing-dashboard", label: "Dashboard" },
                { id: "invoicing-all", label: "All Invoice" },
                { id: "quotations-all", label: "All Quotations" }
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
        {
            id: "database",
            icon: "fa-database",
            label: "Database"
        },
        {
            id: "labelsize",
            icon: "fa-tags",
            label: "Label Size"
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

    const handleSubItemClick = (sub: any) => {
        if (sub.id === 'email-inbox') {
            router.push('/admin/email');
        } else {
            // Map sub IDs to routes
            const routeMap: Record<string, string> = {
                'orders-all': '/admin/orders?view=list',
                'orders-create': '/admin/orders?view=create',
                'orders-returns': '/admin/orders?view=returns',
                'customers-all': '/admin/customers',
                'customers-groups': '/admin/customers',
                'accounts-dashboard': '/admin/accounts',
                'accounts-items': '/admin/accounts',
                'accounts-sales': '/admin/accounts',
                'accounts-purchases': '/admin/accounts',
                'accounts-reports': '/admin/accounts',
                'reports-sales': '/admin/reports',
                'invoicing-dashboard': '/admin/billing?view=dashboard',
                'invoicing-all': '/admin/billing?view=invoices-all',
                'quotations-all': '/admin/billing?view=quotations-all',
                'invoicing-new': '/admin/billing',
                'quotations-new': '/admin/billing',
                'payments-all': '/admin/billing',
                'invoices-return': '/admin/billing',
                'users-all': '/admin/users',
                'users-roles': '/admin/users',
                'production-dashboard': '/admin/production?section=production-dashboard',
                'production-qc': '/admin/production?section=production-qc',
                'production-projects': '/admin/production?section=production-projects',
                'production-tasks': '/admin/production?section=production-tasks',
                'inventory-dashboard': '/admin/inventory?section=inventory-dashboard',
                'products-list': '/admin/inventory?section=products-list',
                'add-product': '/admin/inventory?section=add-product',
                'purchase-lots-list': '/admin/inventory?section=purchase-lots-list',
                'inventory-qc': '/admin/inventory?section=inventory-qc',
                'inventory-drops': '/admin/inventory?section=inventory-drops',
                'purchase-dashboard': '/admin/purchase?section=purchase-dashboard',
                'purchase-history': '/admin/purchase?section=purchase-lots-list',
                'purchase-import': '/admin/purchase?section=purchase-lots-import',
                'suppliers': '/admin/purchase?section=suppliers',
            };

            const target = routeMap[sub.id] || `/admin/${sub.id.replace(/-/g, '/')}`;
            const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

            if (currentFullUrl === target) {
                window.location.reload();
            } else {
                router.push(target);
            }
        }
    };

    const handleMainItemClick = (item: any) => {
        if (item.id === 'auto-refresh') {
            setShowAutoRefreshSettings(true);
        } else if (item.subItems) {
            toggleMenu(item.id);
        } else {
            const routeMap: Record<string, string> = {
                'dashboard': '/admin/dashboard',

                'user-passwords': '/admin/passwords',
                'activity-log': '/admin/activity-log',
                'featured-manage': '/admin/featured',
                'production': '/admin/production',
                'inventory': '/admin/inventory',
                'database': '/admin/database'
            };
            const target = routeMap[item.id] || `/admin/${item.id}`;
            const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

            if (currentFullUrl === target) {
                window.location.reload();
            } else {
                router.push(target);
            }
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
            const isSuperAdmin = userRole === 'superadmin' || username === 'superadmin';
            return isSuperAdmin;
        }

        // Workspace Filtering
        const isProductionWorkspace = searchParams.get('workspace') === 'production' ||
            pathname?.startsWith('/admin/production') ||
            pathname?.startsWith('/admin/purchase') ||
            pathname?.startsWith('/admin/inventory') ||
            pathname?.startsWith('/admin/labelsize');

        if (isProductionWorkspace) {
            // Only show detailed Production items + Dashboard
            return ['dashboard', 'production', 'purchase', 'inventory', 'labelsize'].includes(item.id);
        } else {
            // Hide Production items from main menu (Accessed via Header Button)
            if (['production', 'purchase', 'inventory', 'labelsize'].includes(item.id)) {
                return false;
            }
        }

        return true;
    });

    // Helper to check if a main item or its subitems are active
    const isMainItemActive = (item: any) => {
        const routeMap: Record<string, string> = {
            'dashboard': '/admin/dashboard',

            'user-passwords': '/admin/passwords',
            'activity-log': '/admin/activity-log',
            'featured-manage': '/admin/featured',
            'orders': '/admin/orders',
            'customers': '/admin/customers',
            'accounts': '/admin/accounts',
            'invoicing': '/admin/billing',
            'users': '/admin/users',
            'production': '/admin/production',
            'inventory': '/admin/inventory',
            'database': '/admin/database'
        };
        const targetRoute = routeMap[item.id];
        if (pathname === targetRoute) return true;

        // Check subitems
        if (item.subItems) {
            const subRouteMap: Record<string, string> = {
                'orders-all': '/admin/orders',
                'orders-create': '/admin/orders',
                'orders-returns': '/admin/orders',
                'customers-all': '/admin/customers',
                'customers-groups': '/admin/customers',
                'accounts-dashboard': '/admin/accounts',
                'accounts-items': '/admin/accounts',
                'accounts-sales': '/admin/accounts',
                'accounts-purchases': '/admin/accounts',
                'accounts-reports': '/admin/accounts',
                'reports-sales': '/admin/reports',
                'invoicing-dashboard': '/admin/billing?view=dashboard',
                'invoicing-all': '/admin/billing?view=invoices-all',
                'quotations-all': '/admin/billing?view=quotations-all',
                'invoicing-new': '/admin/billing',
                'quotations-new': '/admin/billing',
                'payments-all': '/admin/billing',
                'invoices-return': '/admin/billing',
                'users-all': '/admin/users',
                'users-roles': '/admin/users',
                'production-dashboard': '/admin/production?section=production-dashboard',
                'production-qc': '/admin/production?section=production-qc',
                'production-projects': '/admin/production?section=production-projects',
                'production-tasks': '/admin/production?section=production-tasks',
                'inventory-dashboard': '/admin/inventory?section=inventory-dashboard',
                'products-list': '/admin/inventory?section=products-list',
                'add-product': '/admin/inventory?section=add-product',
                'inventory-qc': '/admin/inventory?section=inventory-qc',
                'inventory-drops': '/admin/inventory?section=inventory-drops',
                'purchase-dashboard': '/admin/purchase?section=purchase-dashboard',
                'purchase-history': '/admin/purchase?section=purchase-lots-list',
                'purchase-import': '/admin/purchase?section=purchase-lots-import',
                'suppliers': '/admin/purchase?section=suppliers',
            };
            const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
            return item.subItems.some((sub: any) => {
                const target = subRouteMap[sub.id] || `/admin/${sub.id.replace(/-/g, '/')}`;
                return currentFullUrl === target || (pathname === target && !searchParams.toString());
            });
        }
        return false;
    };

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
                    const isActive = isMainItemActive(item);
                    const isExpanded = expandedMenus.includes(item.id);

                    return (
                        <div key={item.id} className="nav-item-wrapper">
                            <button
                                className={`nav-item ${isActive ? "active" : ""}`}
                                onClick={() => handleMainItemClick(item)}
                            >
                                <i className={`${item.icon.includes('fab') ? '' : 'fas'} ${item.icon}`}></i>
                                <span className="nav-text">{item.label}</span>
                                {item.subItems && (
                                    <i className={`fas fa-chevron-right dropdown-arrow ${isExpanded ? 'rotated' : ''}`}></i>
                                )}
                            </button>

                            {item.subItems && (
                                <div className={`sub-menu ${isExpanded ? 'expanded' : ''}`}>
                                    {item.subItems.map((sub: any) => {
                                        const subRouteMap: Record<string, string> = {
                                            'orders-all': '/admin/orders',
                                            'orders-create': '/admin/orders',
                                            'orders-returns': '/admin/orders',
                                            'customers-all': '/admin/customers',
                                            'customers-groups': '/admin/customers',
                                            'accounts-dashboard': '/admin/accounts',
                                            'accounts-items': '/admin/accounts',
                                            'accounts-sales': '/admin/accounts',
                                            'accounts-purchases': '/admin/accounts',
                                            'accounts-reports': '/admin/accounts',
                                            'reports-sales': '/admin/reports',
                                            'invoicing-dashboard': '/admin/billing?view=dashboard',
                                            'invoicing-all': '/admin/billing?view=invoices-all',
                                            'quotations-all': '/admin/billing?view=quotations-all',
                                            'invoicing-new': '/admin/billing',
                                            'quotations-new': '/admin/billing',
                                            'payments-all': '/admin/billing',
                                            'invoices-return': '/admin/billing',
                                            'users-all': '/admin/users',
                                            'users-roles': '/admin/users',
                                            'production-dashboard': '/admin/production?section=production-dashboard',
                                            'production-qc': '/admin/production?section=production-qc',
                                            'production-packing': '/admin/production?section=production-packing',
                                            'production-projects': '/admin/production?section=production-projects',
                                            'production-tasks': '/admin/production?section=production-tasks',
                                            'inventory-dashboard': '/admin/inventory?section=inventory-dashboard',
                                            'products-list': '/admin/inventory?section=products-list',
                                            'add-product': '/admin/inventory?section=add-product',
                                            'inventory-qc': '/admin/inventory?section=inventory-qc',
                                            'inventory-drops': '/admin/inventory?section=inventory-drops',
                                            'purchase-dashboard': '/admin/purchase?section=purchase-dashboard',
                                            'purchase-history': '/admin/purchase?section=purchase-lots-list',
                                            'purchase-import': '/admin/purchase?section=purchase-lots-import',
                                            'suppliers': '/admin/purchase?section=suppliers',
                                        };
                                        const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
                                        const target = subRouteMap[sub.id] || `/admin/${sub.id.replace(/-/g, '/')}`;
                                        const isSubActive = currentFullUrl === target || (pathname === target && !searchParams.toString());

                                        return (
                                            <button
                                                key={sub.id}
                                                className={`sub-nav-item ${isSubActive ? "active" : ""}`}
                                                onClick={() => handleSubItemClick(sub)}
                                            >
                                                <span className="sub-nav-text">{sub.label}</span>
                                            </button>
                                        );
                                    })}
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
