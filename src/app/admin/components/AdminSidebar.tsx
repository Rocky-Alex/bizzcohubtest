"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface AdminSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    onLogout: () => void;
    userRole?: string;
}

export default function AdminSidebar({
    activeSection,
    setActiveSection,
    onLogout,
    userRole = 'accountant',
}: AdminSidebarProps) {
    const router = useRouter();

    const menuItems = [];

    if (userRole === 'admin') {
        menuItems.push(
            { id: "dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
            { id: "inventory", icon: "fa-boxes", label: "Inventory" },
            { id: "billing", icon: "fa-file-invoice-dollar", label: "Billing" },
            { id: "users", icon: "fa-users", label: "Users" }
        );
    } else if (userRole === 'accountant') {
        menuItems.push(
            { id: "billing", icon: "fa-file-invoice-dollar", label: "Billing" }
        );
    }

    const handleNavigation = (id: string) => {
        if (id === "billing") {
            router.push("/billing");
        } else {
            setActiveSection(id);
        }
    };

    return (
        <aside className="admin-sidebar">
            <nav className="admin-menu">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`menu-item ${activeSection === item.id ? "active" : ""}`}
                        onClick={() => handleNavigation(item.id)}
                        style={{
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            padding: "1rem",
                            color: "var(--text-light)",
                            fontSize: "1rem",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <i className={`fas ${item.icon}`} style={{ marginRight: "10px" }}></i>{" "}
                        {item.label}
                    </button>
                ))}
            </nav>
        </aside>
    );
}
