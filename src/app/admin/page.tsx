"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import DashboardOverview from "./components/DashboardOverview";
import LogoutModal from "./components/LogoutModal";
import PlatformDashboard from "./components/PlatformDashboard";
import "./styles/admin.css";
import "./styles/modern-sidebar.css";
import "./styles/dashboard.css";
import "./styles/admin-header.css";

export default function AdminPage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("dashboard");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState("accountant");
    const [username, setUsername] = useState("Admin");
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Placeholder data state (to be replaced with real data fetching)
    const [laptops, setLaptops] = useState<any[]>([]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated) {
                        setIsAuthenticated(true);
                        setUserRole(data.role || 'accountant');
                        setUsername(data.user?.name || 'Admin');
                    } else {
                        router.push('/admin/login');
                    }
                } else {
                    router.push('/admin/login');
                }
            } catch (error) {
                console.error("Auth check failed", error);
                router.push('/admin/login');
            }
        };
        checkAuth();
    }, [router]);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/admin/login');
        }
    };

    if (!isAuthenticated) return null;

    const renderPlaceholder = (title: string, icon: string, description: string) => (
        <div className="admin-section active">
            <div className="section-header">
                <h2><i className={`fas ${icon}`}></i> {title}</h2>
                <p>{description}</p>
            </div>
            <div className="empty-state-dashboard">
                <i className={`fas ${icon}`}></i>
                <p>{title} module is currently under development.</p>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case "dashboard":
                return <DashboardOverview setActiveSection={setActiveSection} laptops={laptops} />;
            case "amazon":
                return <PlatformDashboard platformName="Amazon" />;
            case "noon":
                return <PlatformDashboard platformName="Noon" />;
            case "orders":
                return renderPlaceholder("Order Management", "fa-shopping-cart", "Track new orders, status, and shipping information");
            case "products":
                return renderPlaceholder("Product Management", "fa-laptop", "Manage laptops and stock status");
            case "accessories":
                return renderPlaceholder("Accessories", "fa-keyboard", "Manage details of accessories");
            case "customers":
                return renderPlaceholder("Customer Management", "fa-users", "View customer information and history");
            case "production":
                return renderPlaceholder("Production Management", "fa-industry", "Manage manufacturing related matters");
            case "reports":
                return renderPlaceholder("Reports", "fa-chart-line", "View daily, weekly, monthly and yearly reports");
            case "invoicing":
                return renderPlaceholder("Invoicing", "fa-file-invoice", "Generate and track invoices");
            case "accounting":
                return renderPlaceholder("Accounting", "fa-coins", "Examine income, expenditure, and profit");
            case "users":
                return renderPlaceholder("User Management", "fa-user-shield", "Manage various users and access levels");
            default:
                return <div>Section not found</div>;
        }
    };

    return (
        <div className="admin-body">
            <div className="admin-container">
                <AdminSidebar
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    onLogout={handleLogout}
                    userRole={userRole}
                    username={username}
                />
                <main className="admin-content">
                    {renderContent()}
                </main>
            </div>
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </div>
    );
}
