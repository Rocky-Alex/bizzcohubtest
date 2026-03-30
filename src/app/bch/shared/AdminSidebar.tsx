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
            id: "purchase",
            icon: "fa-shopping-bag",
            label: "Purchases",
            subItems: [
                { id: "purchase-dashboard", label: "Dashboard" },
                { id: "purchase-history", label: "Purchase Lots" },
                { id: "suppliers", label: "Suppliers Manage" }
            ]
        },
        {
            id: "inventory",
            icon: "fa-boxes",
            label: "Inventory",
            subItems: [
                { id: "inventory-dashboard", label: "Inventory Dashboard" },
                { id: "add-product", label: "Add E-Comm Product" },
                { id: "products-list", label: "E-Comm Products List" },
                { id: "inventory-qc", label: "Inventory QC List" },
                { id: "inventory-drops", label: "Dropdown Manage" }
            ]
        },
        {
            id: "production",
            icon: "fa-tools",
            label: "Production",
            subItems: [
                { id: "production-qc", label: "Production QC Checking" },
                { id: "production-inventory-qc", label: "Inventory QC Checking" },
                { id: "production-model-checking", label: "Model Checking" },
                { id: "production-reprint", label: "Reprint Barcode" },
                { id: "production-sale-out", label: "Sale Out" }
            ]
        },
        {
            id: "packing",
            icon: "fa-box-open",
            label: "Packing",
            subItems: [
                { id: "packing-dashboard", label: "Packing Dashboard" },
                { id: "packing-v2", label: "Packing" }
            ]
        },
        {
            id: "product-pricing",
            icon: "fa-tags",
            label: "Product Pricing"
        },
        {
            id: "labelsize",
            icon: "fa-barcode",
            label: "Label Size"
        },
        {
            id: "invoicing",
            icon: "fa-file-invoice",
            label: "Billing",
            subItems: [
                { id: "invoicing-dashboard", label: "Billing Dashboard" },
                { id: "combined-all", label: "All Bills" },
                { id: "receipts-all", label: "All Receipts" },
                { id: "receipts-new", label: "Create Receipt" },
                //{ id: "invoicing-all", label: "All Invoice" },
                { id: "invoicing-create", label: "Create Invoice" },
                //{ id: "quotations-all", label: "All Proforma Invoices" },
                { id: "quotations-create", label: "Create Proforma Invoice" }
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
            'accounts-dashboard': '/bch/accounts',
            'accounts-items': '/bch/accounts',
            'accounts-sales': '/bch/accounts',
            'accounts-purchases': '/bch/accounts',
            'accounts-reports': '/bch/accounts',
            'reports-sales': '/bch/reports',
            'invoicing-dashboard': '/bch/billing/dashboard',
            'combined-all': '/bch/billing/allbills',
            'invoicing-all': '/bch/billing/allbills',
            'invoicing-create': '/bch/billing/newinvoices',
            'quotations-all': '/bch/billing/allbills',
            'quotations-create': '/bch/billing/newqoutations',
            'payments-all': '/bch/billing/allreceipts',
            'receipts-all': '/bch/billing/allreceipts',
            'receipts-new': '/bch/billing/newreceipts',
            'invoices-return': '/bch/billing/returns',
            'users-all': '/bch/users',
            'users-roles': '/bch/users',
            'production-dashboard': '/bch/production?section=production-dashboard',
            'production-qc': '/bch/production/productionqcchecking',
            'production-inventory-qc': '/bch/production/inventoryqcchecking',
            'production-model-checking': '/bch/production/modelchecking',
            'production-reprint': '/bch/production/reprintBarcode',
            'production-sale-out': '/bch/inventory/soldout',
            'production-projects': '/bch/production?section=production-projects',
            'production-tasks': '/bch/production?section=production-tasks',
            'inventory-dashboard': '/bch/inventory/inventorydashboard',
            'products-list': '/bch/inventory/ecommproductlist',
            'inventory-pricing': '/bch/inventory?section=inventory-pricing',
            'add-product': '/bch/inventory/addecommproduct',
            'purchase-lots-list': '/bch/purchases/purchaselot',
            'inventory-qc': '/bch/inventory/inventoryqclist',
            'inventory-drops': '/bch/inventory/dropdownManage',
            'purchase-dashboard': '/bch/purchases/Dashboard',
            'purchase-history': '/bch/purchases/purchaselot',
            'purchase-import-full': '/bch/purchase?section=purchase-import-full',
            'suppliers': '/bch/purchases/suppliersmanage',
            'packing-dashboard': '/bch/packing/packingdashboard',
            'packing-v2': '/bch/packing/packing',
            'email-inbox': '/bch/email'
        };

        const target = routeMap[sub.id] || `/bch/${sub.id.replace(/-/g, '/')}`;
        if (returnOnly) return target;

        const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
        if (currentFullUrl === target) {
            window.location.reload();
        } else {
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
            'inventory': '/bch/inventory',
            'packing': '/bch/packing',
            'product-pricing': '/bch/pricing',
            'database': '/bch/database',
            'auto-refresh': '/bch/autorefresh'
        };
        const target = routeMap[item.id] || `/bch/${item.id}`;

        if (returnOnly) return item.subItems ? '#' : target;

        if (item.subItems) {
            toggleMenu(item.id);
        } else {
            const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
            if (currentFullUrl === target) {
                window.location.reload();
            } else {
                router.push(target);
            }
        }
    };

    const displayedItems = menuItems.filter(item => {
        if (userRole?.toLowerCase() === 'accountant') {
            return ['dashboard', 'orders', 'invoicing'].includes(item.id);
        }

        if (['user-passwords', 'activity-log'].includes(item.id)) {
            const isSuperAdmin = userRole === 'superadmin' || username === 'superadmin';
            return isSuperAdmin;
        }

        const isProductionWorkspace = searchParams.get('workspace') === 'production' ||
            pathname?.startsWith('/bch/production') ||
            pathname?.startsWith('/bch/purchase') ||
            pathname?.startsWith('/bch/inventory') ||
            pathname?.startsWith('/bch/packing') ||
            pathname?.startsWith('/bch/labelsize');

        if (isProductionWorkspace) {
            return ['dashboard', 'production', 'purchase', 'inventory', 'product-pricing', 'packing', 'labelsize'].includes(item.id);
        } else {
            if (['production', 'purchase', 'inventory', 'packing', 'labelsize'].includes(item.id)) {
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
            'packing': '/bch/packing',
            'inventory': '/bch/inventory',
            'product-pricing': '/bch/pricing',
            'database': '/bch/database',
            'auto-refresh': '/bch/autorefresh'
        };
        const targetRoute = routeMap[item.id];
        if (pathname === targetRoute) return true;

        if (item.subItems) {
            const subRouteMap: Record<string, string> = {
                'orders-all': '/bch/Order/dashboard',
                'orders-create': '/bch/Order/createorder',
                'orders-returns': '/bch/Order/return',
                'customers-all': '/bch/customers',
                'customers-groups': '/bch/customers',
                'accounts-dashboard': '/bch/accounts',
                'accounts-items': '/bch/accounts',
                'accounts-sales': '/bch/accounts',
                'accounts-purchases': '/bch/accounts',
                'accounts-reports': '/bch/accounts',
                'reports-sales': '/bch/reports',
                'invoicing-dashboard': '/bch/billing/dashboard',
                'combined-all': '/bch/billing/allbills',
                'invoicing-all': '/bch/billing/allbills',
                'invoicing-create': '/bch/billing/newinvoices',
                'payments-all': '/bch/billing/allreceipts',
                'receipts-all': '/bch/billing/allreceipts',
                'receipts-new': '/bch/billing/newreceipts',
                'invoices-return': '/bch/billing/returns',
                'users-all': '/bch/users',
                'users-roles': '/bch/users',
                'production-dashboard': '/bch/production?section=production-dashboard',
                'production-qc': '/bch/production/productionqcchecking',
                'production-inventory-qc': '/bch/production/inventoryqcchecking',
                'production-model-checking': '/bch/production/modelchecking',
                'production-packing': '/bch/production?section=production-packing',
                'production-reprint': '/bch/production/reprintBarcode',
                'production-sale-out': '/bch/inventory/soldout',
                'production-projects': '/bch/production?section=production-projects',
                'production-tasks': '/bch/production?section=production-tasks',
                'inventory-dashboard': '/bch/inventory/inventorydashboard',
                'products-list': '/bch/inventory/ecommproductlist',
                'inventory-pricing': '/bch/inventory?section=inventory-pricing',
                'add-product': '/bch/inventory/addecommproduct',
                'inventory-qc': '/bch/inventory/inventoryqclist',
                'inventory-drops': '/bch/inventory/dropdownManage',
                'purchase-dashboard': '/bch/purchases/Dashboard',
                'purchase-history': '/bch/purchases/purchaselot',
                'purchase-import': '/bch/purchase?section=purchase-lots-import',
                'purchase-import-full': '/bch/purchase?section=purchase-import-full',
                'suppliers': '/bch/purchases/suppliersmanage',
                'packing-dashboard': '/bch/packing/packingdashboard',
                'packing-v2': '/bch/packing/packing',
            };
            const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
            return item.subItems.some((sub: any) => {
                const target = subRouteMap[sub.id] || `/bch/${sub.id.replace(/-/g, '/')}`;
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
                            <Link
                                href={handleMainItemClick(item, true) || '#'}
                                className={`nav-item ${isActive ? "active" : ""}`}
                                onMouseEnter={() => {
                                    handleMouseEnter();
                                    const target = handleMainItemClick(item, true);
                                    if (target && target !== '#') router.prefetch(target);
                                }}
                                onClick={(e) => {
                                    const target = handleMainItemClick(item, true);
                                    if (item.subItems) {
                                        e.preventDefault();
                                        toggleMenu(item.id);
                                    } else if (target && (pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')) === target) {
                                        e.preventDefault();
                                        window.location.reload();
                                    }
                                }}
                            >
                                <i className={`${item.icon.includes('fab') ? '' : 'fas'} ${item.icon}`}></i>
                                <span className="nav-text">{item.label}</span>
                                {item.subItems && (
                                    <i className={`fas fa-chevron-right dropdown-arrow ${isExpanded ? 'rotated' : ''}`}></i>
                                )}
                            </Link>

                            {item.subItems && (
                                <div className={`sub-menu ${isExpanded ? 'expanded' : ''}`}>
                                    {item.subItems.map((sub: any) => {
                                        const subRouteMap: Record<string, string> = {
                                            'orders-all': '/bch/Order/dashboard',
                                            'orders-create': '/bch/Order/createorder',
                                            'orders-returns': '/bch/Order/return',
                                            'customers-all': '/bch/customers',
                                            'customers-groups': '/bch/customers',
                                            'accounts-dashboard': '/bch/accounts',
                                            'accounts-items': '/bch/accounts',
                                            'accounts-sales': '/bch/accounts',
                                            'accounts-purchases': '/bch/accounts',
                                            'accounts-reports': '/bch/accounts',
                                            'reports-sales': '/bch/reports',
                                            'invoicing-new': '/bch/billing/newinvoices',
                                            'quotations-new': '/bch/billing/newqoutations',
                                            'payments-all': '/bch/billing/allreceipts',
                                            'receipts-all': '/bch/billing/allreceipts',
                                            'receipts-new': '/bch/billing/newreceipts',
                                            'invoices-return': '/bch/billing/returns',
                                            'users-all': '/bch/users',
                                            'users-roles': '/bch/users',
                                            'production-dashboard': '/bch/production?section=production-dashboard',
                                            'production-qc': '/bch/production/productionqcchecking',
                                            'production-inventory-qc': '/bch/production/inventoryqcchecking',
                                            'production-model-checking': '/bch/production/modelchecking',
                                            'production-packing': '/bch/production?section=production-packing',
                                            'production-reprint': '/bch/production/reprintBarcode',
                                            'production-sale-out': '/bch/inventory/soldout',
                                            'production-projects': '/bch/production?section=production-projects',
                                            'production-tasks': '/bch/production?section=production-tasks',
                                            'inventory-dashboard': '/bch/inventory/inventorydashboard',
                                            'products-list': '/bch/inventory/ecommproductlist',
                                            'inventory-pricing': '/bch/inventory?section=inventory-pricing',
                                            'add-product': '/bch/inventory/addecommproduct',
                                            'inventory-qc': '/bch/inventory/inventoryqclist',
                                            'inventory-drops': '/bch/inventory/dropdownManage',
                                            'purchase-dashboard': '/bch/purchases/Dashboard',
                                            'purchase-history': '/bch/purchases/purchaselot',
                                            'purchase-import': '/bch/purchase?section=purchase-lots-import',
                                            'purchase-import-full': '/bch/purchase?section=purchase-import-full',
                                            'suppliers': '/bch/purchases/suppliersmanage',
                                        };
                                        const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
                                        const target = subRouteMap[sub.id] || `/bch/${sub.id.replace(/-/g, '/')}`;
                                        const isSubActive = currentFullUrl === target || (pathname === target && !searchParams.toString());

                                        return (
                                            <Link
                                                key={sub.id}
                                                href={handleSubItemClick(sub, true) || '#'}
                                                className={`sub-nav-item ${isSubActive ? "active" : ""}`}
                                                onMouseEnter={() => {
                                                    const target = handleSubItemClick(sub, true);
                                                    if (target && target !== '#') router.prefetch(target);
                                                }}
                                                onClick={(e) => {
                                                    const target = handleSubItemClick(sub, true);
                                                    if (target && (pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')) === target) {
                                                        e.preventDefault();
                                                        window.location.reload();
                                                    }
                                                }}
                                            >
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
