"use client";

import React, { useState } from "react";
import NoonIcon from "./icons/NoonIcon";
import AutoRefreshSettings from "./AutoRefreshSettings";

interface AdminSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    onLogout: () => void;
    userRole?: string;
    username?: string;
}

export default function AdminSidebar({
    activeSection,
    setActiveSection,
    onLogout,
    userRole = 'accountant',
    username = 'Admin'
}: AdminSidebarProps) {
    const menuItems = [
        { id: "dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },

        {
            id: "orders",
            icon: "fa-shopping-cart",
            label: "Order Mgmt",
            subItems: [
                { id: "orders-all", label: "All Orders" },
                { id: "orders-create", label: "Create Order" },
                { id: "orders-returns", label: "Returns" }
            ]
        },
        {
            id: "amazon",
            icon: "fab fa-amazon",
            label: "Amazon",
            subItems: [
                { id: "amazon-dashboard", label: "Dashboard" },
                { id: "amazon-orders", label: "Orders" },
                { id: "amazon-listings", label: "Listings" }
            ]
        },
        {
            id: "noon",
            icon: "fa-store",
            label: "Noon",
            subItems: [
                { id: "noon-dashboard", label: "Dashboard" },
                { id: "noon-orders", label: "Orders" },
                { id: "noon-listings", label: "Listings" }
            ]
        },
        {
            id: "products",
            icon: "fa-laptop",
            label: "Products",
            subItems: [
                { id: "products-list", label: "Product List" },
                { id: "products-add", label: "Add Product" }
            ]
        },
        {
            id: "accessories",
            icon: "fa-keyboard",
            label: "Accessories",
            subItems: [
                { id: "accessories-list", label: "Accessory List" },
                { id: "accessories-add", label: "Add Accessory" }
            ]
        },
        {
            id: "customers",
            icon: "fa-users",
            label: "Customer Mgmt",
            subItems: [
                { id: "customers-all", label: "All Customers" },
                { id: "customers-groups", label: "Groups" }
            ]
        },
        {
            id: "production",
            icon: "fa-industry",
            label: "Production",
            subItems: [
                { id: "production-pipeline", label: "Pipeline" },
                { id: "production-history", label: "History" }
            ]
        },
        {
            id: "reports",
            icon: "fa-chart-line",
            label: "Reports",
            subItems: [
                { id: "reports-sales", label: "Sales Report" },
                { id: "reports-inventory", label: "Inventory Report" }
            ]
        },
        {
            id: "invoicing",
            icon: "fa-file-invoice",
            label: "Invoicing",
            subItems: [
                { id: "invoicing-all", label: "All Invoices" },
                { id: "invoicing-new", label: "New Invoice" }
            ]
        },
        {
            id: "accounting",
            icon: "fa-coins",
            label: "Accounting",
            subItems: [
                { id: "accounting-overview", label: "Overview" },
                { id: "accounting-transactions", label: "Transactions" }
            ]
        },
        {
            id: "users",
            icon: "fa-user-shield",
            label: "User Mgmt",
            subItems: [
                { id: "users-all", label: "All Users" },
                { id: "users-roles", label: "Roles" }
            ]
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
        } else if (item.subItems) {
            toggleMenu(item.id);
        } else {
            setActiveSection(item.id);
        }
    };

    const displayedItems = userRole === 'accountant'
        ? menuItems.filter(item => ['dashboard', 'apps', 'orders', 'amazon', 'noon', 'invoicing', 'accounting'].includes(item.id))
        : menuItems;

    return (
        <aside
            className={`modern-sidebar ${!isExpanded ? "collapsed" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="sidebar-header">
                <div className="brand-wrapper">
                    <div className="brand-logo">
                        <img src="/icon/nav-logo.png" alt="Bizzcohub" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    {isExpanded && <span className="brand-text">Bizzcohub</span>}
                </div>
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
                                {item.id === 'noon' ? (
                                    <NoonIcon className="sidebar-icon-custom" />
                                ) : (
                                    <i className={`${item.icon.includes('fab') ? '' : 'fas'} ${item.icon}`}></i>
                                )}
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
                                            onClick={() => setActiveSection(sub.id)}
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
