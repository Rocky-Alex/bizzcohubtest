"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AdminSidebar from "./shared/AdminSidebar/AdminSidebar";
import AdminHeader from "./shared/AdminHeader";
import ConfirmModal from "./shared/ConfirmModal";
import { useTheme } from "@/context/ThemeContext";
import "./styles/admin.css";
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
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeSection, setActiveSection] = useState("dashboard");
    const searchParams = useSearchParams();

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
                            router.push('/admin/login');
                            return;
                        }

                        setIsAuthenticated(true);
                        setUserRole(data.role || 'accountant');
                        setUsername(data.user?.name || 'Admin');
                        setCurrentUser(data.user);
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

    // Sync activeSection with URL
    useEffect(() => {
        const section = searchParams.get('section');
        if (section) {
            setActiveSection(section);
        } else {
            // Derive from pathname
            const segments = pathname.split('/');
            const lastSegment = segments[segments.length - 1];
            if (lastSegment && lastSegment !== 'admin') {
                setActiveSection(lastSegment);
            } else if (pathname === '/admin') {
                setActiveSection('dashboard');
            }
        }
    }, [pathname, searchParams]);

    const handleLogout = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out of the admin panel?',
            type: 'danger',
            singleButton: false,
            onConfirm: confirmLogout
        });
    };

    const confirmLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            sessionStorage.removeItem('admin_authenticated');
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/admin/login');
        }
    };

    if (!isAuthenticated && pathname !== '/admin/login') {
        return null; // Or a loading spinner
    }

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className={`admin-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
            <AdminSidebar
                onLogout={handleLogout}
                userRole={userRole}
                username={username}
                mobileOpen={isMobileSidebarOpen}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
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
