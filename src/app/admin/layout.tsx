"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import { ThemeProvider } from "@/context/ThemeContext";
import "./styles/admin.css";
import "./styles/modern-sidebar.css";
import "./styles/admin-header.css";
import "./styles/mobile-responsive.css";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/session');
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    setIsAuthenticated(true);
                    setUser(data.user);
                    // Store user in sync with header expectations
                    if (data.user && !localStorage.getItem('admin_user')) {
                        localStorage.setItem('admin_user', JSON.stringify(data.user));
                        window.dispatchEvent(new Event('admin-login'));
                    }
                } else {
                    router.push('/admin/login');
                }
            } else {
                router.push('/admin/login');
            }
        } catch (error) {
            console.error("Auth check failed", error);
            router.push('/admin/login');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [pathname]);

    // Bypass layout for login page
    if (pathname === '/admin/login' || pathname === '/admin/forgot-password') {
        return <ThemeProvider>{children}</ThemeProvider>;
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('admin_user');
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/admin/login');
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    // Determine active section from pathname
    // e.g., /admin/users -> users-all
    // /admin/inventory -> inventory-dashboard
    let activeSection = "dashboard";
    if (pathname.includes('/admin/users')) activeSection = pathname.includes('/roles') ? "users-roles" : "users-all";
    else if (pathname.includes('/admin/inventory')) {
        if (pathname.includes('/products/add')) activeSection = "products-add";
        else if (pathname.includes('/products')) activeSection = "products-list";
        else if (pathname.includes('/purchase-lots/import')) activeSection = "purchase-lots-import";
        else if (pathname.includes('/purchase-lots')) activeSection = "purchase-lots-list";
        else activeSection = "inventory-dashboard";
    }
    else if (pathname.includes('/admin/orders')) {
        if (pathname.includes('/create')) activeSection = "orders-create";
        else if (pathname.includes('/returns')) activeSection = "orders-returns";
        else activeSection = "orders-all";
    }
    else if (pathname.includes('/admin/customers')) {
        if (pathname.includes('/import')) activeSection = "customers-import";
        else activeSection = "customers-all";
    }
    else if (pathname.includes('/admin/billing')) {
        if (pathname.includes('/payments')) activeSection = "payments-all";
        else if (pathname.includes('/returns')) activeSection = "invoices-return";
        else if (pathname.includes('/invoices/new')) activeSection = "invoicing-new";
        else if (pathname.includes('/invoices')) activeSection = "invoicing-all";
        else if (pathname.includes('/quotations')) activeSection = "quotations-all";
        else activeSection = "invoicing-dashboard";
    }
    else if (pathname.includes('/admin/reports')) activeSection = "reports-sales"; // simplified
    else if (pathname.includes('/admin/email')) activeSection = "email-inbox";

    // Override with query param if present (for inventory sections mostly)
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
        activeSection = sectionParam;
    }

    return (
        <ThemeProvider>
            <div className="admin-body">
                <div
                    className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
                    onClick={() => setIsMobileSidebarOpen(false)}
                ></div>

                <div className="admin-container">
                    <AdminSidebar
                        activeSection={activeSection}
                        setActiveSection={(section) => {
                            // Mapping back to paths if needed, but Sidebar should handle Links
                        }}
                        onLogout={handleLogout}
                        userRole={user?.role || 'Administrator'}
                        username={user?.name || user?.username || 'Admin'}
                        mobileOpen={isMobileSidebarOpen}
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
                </div>
            </div>
        </ThemeProvider>
    );
}
