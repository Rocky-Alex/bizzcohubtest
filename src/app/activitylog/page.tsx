"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import ActivityLog from "@/app/admin/activity-log/ActivityLog";
import "@/app/admin/styles/admin.css";
import "@/app/admin/styles/modern-sidebar.css";

export default function ActivityLogPage() {
    const router = useRouter();


    // Mock user data for sidebar - in real app, fetch from session/context
    // Since we are moving out of AdminPage which had auth check, we ideally duplicate it here or use a layout.
    // For now assuming public or simple access as per request "make a separate page".
    const userRole = 'admin';
    const username = 'Admin';

    const handleSectionChange = (section: string) => {
        if (section === 'activity-log') return;

        // Navigate back to main admin dashboard for other sections
        // We could pass query params if AdminPage supported them, e.g. /admin?section=orders
        router.push('/admin');
    };

    const handleLogout = () => {
        // Implement logout or redirect to login
        router.push('/admin/login');
    };

    return (
        <div className="admin-body">
            <div className="admin-container">
                <AdminSidebar
                    activeSection="activity-log"
                    setActiveSection={handleSectionChange}
                    onLogout={handleLogout}
                    userRole={userRole}
                    username={username}
                />

                <main className="admin-content">
                    <ActivityLog />
                </main>
            </div>
        </div>
    );
}
