"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import EmailClient from "../components/EmailClient";
import "../styles/admin.css"; // Reuse existing styles
import "../styles/modern-sidebar.css";
import "../styles/dashboard.css";
import "../styles/admin-header.css";

export default function EmailPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState("accountant");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated) {
                        setIsAuthenticated(true);
                        setUserRole(data.role || 'accountant');
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

    if (!isAuthenticated) return null;

    return (
        <div className="admin-container">
            <AdminSidebar
                activeSection="email-inbox"
                setActiveSection={(section) => {
                    if (section !== 'email-inbox') {
                        router.push('/admin');
                    }
                }}
                onLogout={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    router.push('/admin/login');
                }}
                userRole={userRole}
            />

            <main className="admin-main">
                <AdminHeader
                    toggleSidebar={() => {
                        // Toggle sidebar logic (if supported by sidebar using context or event)
                        // Currently AdminSidebar manages its own collapse state locally via localStorage
                        // or separate state. AdminHeader toggle might need communication.
                        // AdminPage doesn't seem to pass a collapse handler to Header,
                        // but Header has a toggle button.
                        // Let's assume standard behavior or ignoring sidebar toggle from header for now
                        // as Sidebar has its own toggle.
                        document.querySelector('.modern-sidebar')?.classList.toggle('collapsed');
                    }}
                    roles={[]} // Pass roles if needed for edit modal
                    onLogout={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        router.push('/admin/login');
                    }}
                />

                <div className="admin-content" style={{ padding: '20px' }}>
                    <EmailClient userRole={userRole} />
                </div>
            </main>
        </div>
    );
}
