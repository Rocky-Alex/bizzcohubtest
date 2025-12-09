"use client";

import React, { useState } from "react";
import NoonIcon from "./icons/NoonIcon";

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
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => setCollapsed(!collapsed);

    const menuItems = [
        { id: "dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
        { id: "orders", icon: "fa-shopping-cart", label: "Order Mgmt" },
        { id: "amazon", icon: "fab fa-amazon", label: "Amazon" },
        { id: "noon", icon: "fa-store", label: "Noon" },
        { id: "products", icon: "fa-laptop", label: "Products" },
        { id: "accessories", icon: "fa-keyboard", label: "Accessories" },
        { id: "customers", icon: "fa-users", label: "Customer Mgmt" },
        { id: "production", icon: "fa-industry", label: "Production" },
        { id: "reports", icon: "fa-chart-line", label: "Reports" },
        { id: "invoicing", icon: "fa-file-invoice", label: "Invoicing" },
        { id: "accounting", icon: "fa-coins", label: "Accounting" },
        { id: "users", icon: "fa-user-shield", label: "User Mgmt" },
    ];

    const displayedItems = userRole === 'accountant'
        ? menuItems.filter(item => ['dashboard', 'orders', 'amazon', 'noon', 'invoicing', 'accounting'].includes(item.id))
        : menuItems;

    return (
        <aside className={`modern-sidebar ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <div className="user-profile" onClick={onLogout} title="Click to Logout">
                    <div className="user-avatar">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{username}</span>
                        <span className="user-role">{userRole}</span>
                    </div>
                    {!collapsed && <i className="fas fa-sign-out-alt user-menu-trigger"></i>}
                </div>
            </div>

            <nav className="sidebar-menu">
                <div className="menu-label">MAIN MENU</div>
                {displayedItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                        onClick={() => setActiveSection(item.id)}
                        title={collapsed ? item.label : ""}
                    >
                        {item.id === 'noon' ? (
                            <NoonIcon className="sidebar-icon-custom" />
                        ) : (
                            <i className={`${item.icon.includes('fab') ? '' : 'fas'} ${item.icon}`}></i>
                        )}
                        <span className="nav-text">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="footer-controls">
                    <button
                        className="control-btn"
                        onClick={toggleSidebar}
                        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <i className={`fas ${collapsed ? "fa-align-left" : "fa-align-right"}`}></i>
                    </button>
                </div>
            </div>


        </aside>
    );
}
