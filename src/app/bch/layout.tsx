"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "./shared/AdminSidebar";
import AdminHeader from "./shared/AdminHeader";
import ConfirmModal from "./shared/ConfirmModal";
import { useTheme } from "@/context/ThemeContext";
import "./styles/admin.css";
import "./styles/modern-sidebar.css";
import "./styles/dashboard.css";
import "./styles/admin-header.css";
import "./styles/mobile-responsive.css";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { theme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState("accountant");
    const [username, setUsername] = useState("Admin");
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Modal State for global use (like Logout)
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger' as 'danger' | 'info' | 'success',
        singleButton: false,
        onConfirm: () => { }
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();

                    const isSessionActive = sessionStorage.getItem('admin_authenticated');

                    if (data.authenticated) {
                        if (!isSessionActive) {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            router.push('/bch/login');
                            return;
                        }

                        setIsAuthenticated(true);
                        setUserRole(data.role || 'accountant');
                        setUsername(data.user?.name || 'Admin');
                    } else {
                        router.push('/bch/login');
                    }
                } else {
                    router.push('/bch/login');
                }
            } catch (error) {
                console.error("Auth check failed", error);
                router.push('/bch/login');
            }
        };
        checkAuth();
    }, [router]);

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out of the BCH Portal?',
            type: 'danger',
            singleButton: false,
            onConfirm: confirmLogout
        });
    };

    const confirmLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            sessionStorage.removeItem('admin_authenticated');
            router.push('/bch/login');
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/bch/login');
        }
    };

    const mobileNavItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'fas fa-border-all',
            active: pathname === '/bch/dashboard',
            onClick: () => router.push('/bch/dashboard')
        },
        {
            id: 'purchase',
            label: 'Purchase',
            icon: 'fas fa-cart-shopping',
            active: pathname.startsWith('/bch/purchase') || pathname.startsWith('/bch/purchases'),
            onClick: () => router.push('/bch/purchases/Dashboard')
        },
        {
            id: 'inventory',
            label: 'Inventory',
            icon: 'fas fa-box',
            active: pathname.startsWith('/bch/inventory'),
            onClick: () => router.push('/bch/inventory/inventorydashboard')
        },
        {
            id: 'billing',
            label: 'Billing',
            icon: 'fas fa-money-bill-wave',
            active: pathname.startsWith('/bch/billing'),
            onClick: () => router.push('/bch/billing/dashboard')
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: 'fas fa-user',
            active: false,
            onClick: () => window.dispatchEvent(new Event('bch-open-profile'))
        }
    ];

    if (!isAuthenticated && pathname !== '/bch/login') {
        return null; // Or a loading spinner
    }

    if (pathname === '/bch/login') {
        return <>{children}</>;
    }

    return (
        <div className={`admin-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
            <AdminSidebar
                onLogout={handleLogout}
                userRole={userRole}
                username={username}
                mobileOpen={isMobileSidebarOpen}
            />
            <div
                className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-hidden="true"
            />

            <div className="admin-main">
                <AdminHeader
                    toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    onLogout={handleLogout}
                />

                <main className="admin-content">
                    {children}
                </main>
            </div>

            <nav className="mobile-bottom-nav" aria-label="Admin mobile navigation">
                {mobileNavItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`mobile-bottom-nav-item ${item.active ? 'active' : ''}`}
                        onClick={item.onClick}
                    >
                        <i className={item.icon}></i>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                singleButton={confirmModal.singleButton}
            />
        </div>
    );
}
