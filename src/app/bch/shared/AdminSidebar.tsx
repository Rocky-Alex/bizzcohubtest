"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface AdminSidebarProps {
    onLogout: () => void;
    userRole?: string;
    username?: string;
    mobileOpen?: boolean;
}

interface SidebarSubItem {
    id: string;
    label: string;
}

interface SidebarItem {
    id: string;
    icon: string;
    label: string;
    color?: string;
    special?: boolean;
    onClick?: () => void;
    subItems?: SidebarSubItem[];
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
    const menuItems: SidebarItem[] = [
        { id: "dashboard", icon: "fa-tachometer-alt", label: "Dashboard", color: "#6366f1" },
        {
            id: "featured-manage",
            icon: "fa-star",
            label: "Featured Products",
            color: "#f59e0b"
        },
        {
            id: "orders",
            icon: "fa-shopping-cart",
            label: "Orders Manage",
            color: "#10b981",
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
            color: "#3b82f6",
            subItems: [
                { id: "customers-all", label: "All Customers" },
                { id: "customers-groups", label: "Groups" }
            ]
        },
        {
            id: "purchase",
            icon: "fa-shopping-bag",
            label: "Purchases",
            color: "#8b5cf6",
            subItems: [
                { id: "purchase-dashboard", label: "Dashboard" },
                { id: "purchase-history", label: "Purchase Lots" },
                { id: "purchase-lot-inventory", label: "Purchase Lot Inventory" },
                { id: "suppliers", label: "Suppliers Manage" }
            ]
        },
        {
            id: "inventory",
            icon: "fa-boxes",
            label: "Inventory",
            color: "#f97316",
            subItems: [
                { id: "inventory-dashboard", label: "Inventory Dashboard" },
                { id: "add-product", label: "Add E-Comm Product" },
                { id: "products-list", label: "E-Comm Products List" },
                { id: "inventory-qc", label: "Master Inventory" },
                { id: "inventory-drops", label: "Dropdown Manage" }
            ]
        },
        {
            id: "production",
            icon: "fa-tools",
            label: "Production",
            color: "#06b6d4",
            subItems: [
                { id: "production-qc", label: "Production QC Checking" },
                { id: "production-inventory-qc", label: "Inventory QC Checking" },
                { id: "production-model-checking", label: "Model Checking" },
                { id: "production-reprint", label: "Reprint Barcode" },
                { id: "production-sticker-printing", label: "Sticker Printing" }
            ]
        },
        {
            id: "sales",
            icon: "fa-store",
            label: "Sales Port",
            color: "#ec4899",
            subItems: [
                { id: "sales-dashboard", label: "Sales Dashboard" },
                { id: "sales-port", label: "Sales Port (Out)" },
                { id: "sales-inventory", label: "Sales Inventory" }
            ]
        },
        {
            id: "packing",
            icon: "fa-box",
            label: "Packing",
            color: "#14b8a6",
            subItems: [
                { id: "packing-dashboard", label: "Packing Dashboard" },
                { id: "packing-v2", label: "Packing" }
            ]
        },
        {
            id: "product-pricing",
            icon: "fa-tags",
            label: "Product Pricing",
            color: "#f43f5e"
        },
        {
            id: "labelsize",
            icon: "fa-barcode",
            label: "Label Size",
            color: "#84cc16"
        },
        {
            id: "invoicing",
            icon: "fa-file-invoice",
            label: "Billing",
            color: "#ef4444",
            subItems: [
                { id: "invoicing-dashboard", label: "Billing Dashboard" },
                { id: "combined-all", label: "All Bills" },
                { id: "receipts-all", label: "All Receipts" },
                { id: "receipts-new", label: "Create Receipt" },
                { id: "invoicing-create", label: "Create Invoice" },
                { id: "quotations-create", label: "Create Proforma Invoice" }
            ]
        },
        {
            id: "accounting",
            icon: "fa-book-open",
            label: "Accounting",
            color: "#7c3aed",
            subItems: [
                { id: "accounting-dashboard", label: "Dashboard" },
                { id: "accounting-cashbook", label: "Cash Book" },
                { id: "accounting-statements", label: "Financial Statements" },
                { id: "accounting-lots", label: "Lot Management" },
                { id: "accounting-settings", label: "Settings" }
            ]
        },
        {
            id: "users",
            icon: "fa-user-shield",
            label: "User Manage",
            color: "#0ea5e9",
            subItems: [
                { id: "users-all", label: "All Users" },
                { id: "users-roles", label: "Roles and Permissions" }
            ]
        },
        {
            id: "user-passwords",
            icon: "fa-key",
            label: "User Password",
            color: "#f59e0b"
        },
        {
            id: "activity-log",
            icon: "fa-clipboard-list",
            label: "Activity Log",
            color: "#64748b"
        },
        {
            id: "auto-refresh",
            icon: "fa-sync-alt",
            label: "Auto Refresh",
            color: "#10b981"
        },
        {
            id: "database",
            icon: "fa-database",
            label: "Database",
            color: "#475569"
        },
    ];

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }

        try {
            const savedMenus = localStorage.getItem('sidebarExpandedMenus');
            if (savedMenus) {
                setExpandedMenus(JSON.parse(savedMenus));
            }
        } catch (error) {
            console.error('Failed to parse saved sidebar menus', error);
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState.toString());
        if (newState) {
            setExpandedMenus([]);
            localStorage.removeItem('sidebarExpandedMenus');
        }
    };

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
                setExpandedMenus([]);
            }, 300);
        }
    };

    const toggleMenu = (id: string) => {
        setExpandedMenus(prev => {
            const newMenus = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
            localStorage.setItem('sidebarExpandedMenus', JSON.stringify(newMenus));
            return newMenus;
        });
    };

    const handleSubItemClick = (sub: any, returnOnly = false) => {
        const routeMap: Record<string, string> = {
            'orders-all': '/bch/Order/dashboard',
            'orders-create': '/bch/Order/createorder',
            'orders-returns': '/bch/Order/return',
            'customers-all': '/bch/customers',
            'customers-groups': '/bch/customers',
            'invoicing-dashboard': '/bch/billing/dashboard',
            'combined-all': '/bch/billing/allbills',
            'invoicing-all': '/bch/billing/allbills',
            'invoicing-create': '/bch/billing/newinvoices',
            'quotations-all': '/bch/billing/allbills',
            'quotations-create': '/bch/billing/newqoutations',
            'receipts-all': '/bch/billing/allreceipts',
            'receipts-new': '/bch/billing/newreceipts',
            'users-all': '/bch/users',
            'users-roles': '/bch/users',
            'production-dashboard': '/bch/production?section=production-dashboard',
            'production-qc': '/bch/production/productionqcchecking',
            'production-inventory-qc': '/bch/production/inventoryqcchecking',
            'production-model-checking': '/bch/production/modelchecking',
            'production-reprint': '/bch/production/reprintBarcode',
            'production-sticker-printing': '/bch/production/stickerprinting',
            'sales-dashboard': '/bch/sales/dashboard',
            'sales-port': '/bch/sales/port',
            'sales-inventory': '/bch/sales/inventory',
            'inventory-dashboard': '/bch/inventory/inventorydashboard',
            'products-list': '/bch/inventory/ecommproductlist',
            'add-product': '/bch/inventory/addecommproduct',
            'inventory-qc': '/bch/inventory/masterinventory',
            'inventory-drops': '/bch/inventory/dropdownManage',
            'purchase-dashboard': '/bch/purchases/Dashboard',
            'purchase-history': '/bch/purchases/purchaselot',
            'purchase-lot-inventory': '/bch/purchases/inventory',
            'suppliers': '/bch/purchases/suppliersmanage',
            'packing-dashboard': '/bch/packing/packingdashboard',
            'packing-v2': '/bch/packing/packing',
            'accounting-dashboard': '/bch/accounting/dashboard',
            'accounting-cashbook': '/bch/accounting/cashbook',
            'accounting-statements': '/bch/accounting/statements',
            'accounting-lots': '/bch/accounting/lots',
            'accounting-settings': '/bch/accounting/settings',
        };

        const target = routeMap[sub.id] || `/bch/${sub.id.replace(/-/g, '/')}`;
        if (returnOnly) return target;

        const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
        if (currentFullUrl !== target) {
            window.dispatchEvent(new Event('bch-nav-start'));
            router.push(target);
        }
    };

    const handleMainItemClick = (item: any, returnOnly = false) => {
        const routeMap: Record<string, string> = {
            'dashboard': '/bch/dashboard',
            'user-passwords': '/bch/passwords',
            'activity-log': '/bch/activity-log',
            'featured-manage': '/bch/featured',
            'production': '/bch/production',
            'sales': '/bch/sales/dashboard',
            'inventory': '/bch/inventory',
            'packing': '/bch/packing',
            'product-pricing': '/bch/pricing',
            'accounting': '/bch/accounting/dashboard',
            'database': '/bch/database',
            'auto-refresh': '/bch/autorefresh'
        };
        const target = routeMap[item.id] || `/bch/${item.id}`;

        if (returnOnly) return item.subItems ? '#' : target;

        if (item.subItems) {
            toggleMenu(item.id);
        } else {
            const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
            if (currentFullUrl !== target) {
                window.dispatchEvent(new Event('bch-nav-start'));
                router.push(target);
            }
        }
    };

    const displayedItems = menuItems.filter(item => {
        if (item.id === 'mobile-accounts') return true;

        if (userRole?.toLowerCase() === 'accountant') {
            return ['dashboard', 'orders', 'invoicing', 'accounting', 'accounts'].includes(item.id);
        }

        if (['user-passwords', 'activity-log'].includes(item.id)) {
            const isSuperAdmin = userRole === 'superadmin' || username === 'superadmin';
            return isSuperAdmin;
        }

        const isProductionWorkspace = searchParams.get('workspace') === 'production' ||
            pathname?.startsWith('/bch/production') ||
            pathname?.startsWith('/bch/sales') ||
            pathname?.startsWith('/bch/purchase') ||
            pathname?.startsWith('/bch/inventory') ||
            pathname?.startsWith('/bch/packing') ||
            pathname?.startsWith('/bch/labelsize');

        if (isProductionWorkspace) {
            return ['dashboard', 'production', 'sales', 'purchase', 'inventory', 'product-pricing', 'packing', 'labelsize'].includes(item.id);
        } else {
            if (['production', 'sales', 'purchase', 'inventory', 'packing', 'labelsize'].includes(item.id)) {
                return false;
            }
        }

        return true;
    });

    const isMainItemActive = (item: any) => {
        const routeMap: Record<string, string> = {
            'dashboard': '/bch/dashboard',
            'user-passwords': '/bch/passwords',
            'activity-log': '/bch/activity-log',
            'featured-manage': '/bch/featured',
            'orders': '/bch/Order',
            'customers': '/bch/customers',
            'accounts': '/bch/accounts',
            'invoicing': '/bch/billing',
            'users': '/bch/users',
            'production': '/bch/production',
            'sales': '/bch/sales',
            'packing': '/bch/packing',
            'inventory': '/bch/inventory',
            'product-pricing': '/bch/pricing',
            'accounting': '/bch/accounting',
            'database': '/bch/database',
            'auto-refresh': '/bch/autorefresh'
        };
        const targetRoute = routeMap[item.id];
        if (pathname === targetRoute) return true;

        if (item.subItems) {
            const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
            return item.subItems.some((sub: any) => {
                const subTarget = `/bch/${sub.id.replace(/-/g, '/')}`; // Generic fallback
                // Check if the current path matches any of the sub-item logic
                return currentFullUrl.includes('/bch/accounts') && item.id === 'accounts';
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
                    const isExpandedFlag = expandedMenus.includes(item.id);

                    return (
                        <div key={item.id} className={`nav-item-wrapper ${item.special ? 'special-nav-item' : ''}`}>
                            <Link
                                href={item.special ? '#' : (handleMainItemClick(item, true) || '#')}
                                className={`nav-item ${isActive ? "active" : ""}`}
                                onClick={(e) => {
                                    if (item.special && (item as any).onClick) {
                                        e.preventDefault();
                                        (item as any).onClick();
                                        return;
                                    }
                                    const target = handleMainItemClick(item, true);
                                    if (item.subItems) {
                                        e.preventDefault();
                                        toggleMenu(item.id);
                                    } else if (target && (pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')) !== target) {
                                        window.dispatchEvent(new Event('bch-nav-start'));
                                    }
                                }}
                            >
                                <div className="nav-icon-wrapper" style={{ 
                                    background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}30 100%)`,
                                    border: `1px solid ${item.color}20`
                                }}>
                                    <i className={`fas ${item.icon}`} style={{ color: item.color || 'inherit' }}></i>
                                </div>
                                <span className="nav-text">{item.label}</span>
                                {item.subItems && (
                                    <i className={`fas fa-chevron-right dropdown-arrow ${isExpandedFlag ? 'rotated' : ''}`}></i>
                                )}
                            </Link>

                            {item.subItems && (
                                <div className={`sub-menu ${isExpandedFlag ? 'expanded' : ''}`}>
                                    {item.subItems.map((sub: any) => {
                                        const target = handleSubItemClick(sub, true);
                                        const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
                                        const isSubActive = currentFullUrl === target || (pathname === target && !searchParams.toString());

                                        return (
                                            <Link
                                                key={sub.id}
                                                href={target || '#'}
                                                className={`sub-nav-item ${isSubActive ? "active" : ""}`}
                                                onClick={(e) => {
                                                    const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
                                                    if (target && currentFullUrl !== target) {
                                                        window.dispatchEvent(new Event('bch-nav-start'));
                                                    } else if (target === currentFullUrl) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <i className="fas fa-circle" style={{ fontSize: '0.4rem', color: item.color || 'var(--sidebar-primary)', opacity: 0.5 }}></i>
                                                <span className="sub-nav-text">{sub.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

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
        </aside>
    );
}
