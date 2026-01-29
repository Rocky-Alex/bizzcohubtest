"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import "./ActivityLog.css";

interface ActivityLogItem {
    id: number;
    user: string;
    action: string;
    details: string;
    status: string;
    role: string;
    ip: string;
    timestamp: string;
    avatar?: string;
}

import PasswordModal from "../components/PasswordModal";

export default function ActivityLog() {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const [subFilter, setSubFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Deletion states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'clear', id?: number } | null>(null);
    const [modalError, setModalError] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/activity-logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch activity logs", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Note: Auto-refresh disabled when modal is open to prevent UI shifts
    useAutoRefresh(() => {
        if (!showPasswordModal) fetchLogs();
    });

    const checkPasswordAndExecute = async (password: string) => {
        if (!pendingAction) return;

        setIsActionLoading(true);
        setModalError('');

        try {
            let url = '/api/admin/activity-logs';
            if (pendingAction.type === 'clear') {
                url += '?all=true';
            } else if (pendingAction.type === 'delete' && pendingAction.id) {
                url += `?id=${pendingAction.id}`;
            }

            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': password
                }
            });

            if (res.ok) {
                setShowPasswordModal(false);
                setPendingAction(null);
                setModalError('');
                fetchLogs(); // Refresh immediately
            } else {
                const data = await res.json();
                setModalError(data.error || 'Invalid Password');
            }
        } catch (error) {
            console.error('Action failed', error);
            setModalError('Connection failed, please try again.');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Reset error when opening modal
    useEffect(() => {
        if (showPasswordModal) {
            setModalError('');
            setIsActionLoading(false);
        }
    }, [showPasswordModal]);

    const handleDeleteClick = (id: number) => {
        setPendingAction({ type: 'delete', id });
        setShowPasswordModal(true);
    };

    const handleClearAllClick = () => {
        setPendingAction({ type: 'clear' });
        setShowPasswordModal(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getAvatarUrl = (name: string) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=32`;
    };

    const categories = [
        { id: 'All', label: 'All Activities' },
        { id: 'Auth', label: 'Login / Logout' },
        { id: 'Inventory', label: 'Inventory' },
        { id: 'Users', label: 'User Management' },
        { id: 'PageViews', label: 'Page Visits' }
    ];

    const subCategories: Record<string, { id: string, label: string }[]> = {
        'All': [
            { id: 'All', label: 'All' },
            { id: 'Success', label: 'Success Only' },
            { id: 'Failed', label: 'Failures / Errors' }
        ],
        'Auth': [
            { id: 'All', label: 'All' },
            { id: 'Login', label: 'Login' },
            { id: 'Logout', label: 'Logout' }
        ],
        'Inventory': [
            { id: 'All', label: 'All' },
            { id: 'Create', label: 'Created' },
            { id: 'Update', label: 'Updated' },
            { id: 'Delete', label: 'Deleted' }
        ],
        'Users': [
            { id: 'All', label: 'All' },
            { id: 'Create', label: 'Created' },
            { id: 'Update', label: 'Updated' }
        ],
        'PageViews': [
            { id: 'All', label: 'All Pages' },
            { id: 'Dashboard', label: 'Dashboard' },
            { id: 'Orders', label: 'Orders' },
            { id: 'Inventory', label: 'Inventory' },
            { id: 'Invoicing', label: 'Invoicing' }
        ]
    };

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setSubFilter('All');
    };

    const filteredLogs = logs.filter(log => {
        const action = log.action.toLowerCase();
        const details = log.details.toLowerCase();
        const status = log.status.toLowerCase();
        const user = log.user.toLowerCase();
        const query = searchQuery.toLowerCase();

        // 0. Search Query
        if (query) {
            if (!user.includes(query) && !details.includes(query) && !action.includes(query)) return false;
        }

        // 1. Main Filter
        if (filter !== 'All') {
            if (filter === 'Auth' && !(action.includes('login') || action.includes('logout'))) return false;
            if (filter === 'Inventory' && !(action.includes('product') || action.includes('inventory'))) return false;
            if (filter === 'Users' && !(action.includes('user') || action.includes('customer'))) return false;
            if (filter === 'PageViews' && !action.includes('view page')) return false;
        }

        // 2. Sub Filter
        if (subFilter !== 'All') {
            // All Category Sub-filters (Status)
            if (filter === 'All') {
                if (subFilter === 'Success' && status !== 'success') return false;
                if (subFilter === 'Failed' && status === 'success') return false;
            }

            // Auth Sub-filters
            if (filter === 'Auth') {
                if (subFilter === 'Login' && !action.includes('login')) return false;
                if (subFilter === 'Logout' && !action.includes('logout')) return false;
            }

            // Inventory Sub-filters
            if (filter === 'Inventory') {
                if (subFilter === 'Create' && !action.includes('create') && !action.includes('add')) return false;
                if (subFilter === 'Update' && !action.includes('update') && !action.includes('edit')) return false;
                if (subFilter === 'Delete' && !action.includes('delete') && !action.includes('remove')) return false;
            }

            // Users Sub-filters
            if (filter === 'Users') {
                if (subFilter === 'Create' && !action.includes('create') && !action.includes('add')) return false;
                if (subFilter === 'Update' && !action.includes('update') && !action.includes('edit')) return false;
            }

            // PageViews Sub-filters
            if (filter === 'PageViews') {
                // Check details for page name
                if (!details.includes(subFilter.toLowerCase())) return false;
            }
        }

        return true;
    });

    return (
        <div className="activity-log-container">
            <div className="section-header">
                <div className="header-left">
                    <h2><i className="fas fa-history"></i> Activity Log</h2>
                    <div className="header-actions">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search users or details..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
                                    onClick={() => handleFilterChange(cat.id)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        <button className="refresh-btn danger-hover" onClick={handleClearAllClick} title="Clear All Logs">
                            <i className="fas fa-trash-alt"></i>
                        </button>
                        <button className="refresh-btn" onClick={fetchLogs} disabled={loading}>
                            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sub Filters Toolbar */}
            {subCategories[filter] && (
                <div className="sub-filter-bar">
                    <span className="sub-filter-label">Filter by:</span>
                    <div className="sub-filter-group">
                        {subCategories[filter].map(sub => (
                            <button
                                key={sub.id}
                                className={`sub-filter-btn ${subFilter === sub.id ? 'active' : ''}`}
                                onClick={() => setSubFilter(sub.id)}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={`log-table-wrapper ${filter.toLowerCase()}-mode`}>
                <table className="log-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Action</th>
                            <th>Date & Time</th>
                            <th>Details</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div className="user-info">
                                            <img
                                                src={getAvatarUrl(log.user)}
                                                alt={log.user}
                                                className="user-avatar"
                                            />
                                            <div className="user-details">
                                                <span className="user-name">{log.user}</span>
                                                <span className="user-role">{log.role}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="action-badge">{log.action}</span>
                                    </td>
                                    <td className="log-date">{formatDate(log.timestamp)}</td>
                                    <td className="log-details" title={log.details}>{log.details}</td>
                                    <td>
                                        <span className={`status-badge ${log.status.toLowerCase()}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="action-btn-delete"
                                            onClick={() => handleDeleteClick(log.id)}
                                            title="Delete Log"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="empty-state">No activity logs found for this category.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <PasswordModal
                isOpen={showPasswordModal}
                title={pendingAction?.type === 'clear' ? 'Clear All Activity Logs' : 'Delete Activity Log'}
                onConfirm={checkPasswordAndExecute}
                onCancel={() => {
                    setShowPasswordModal(false);
                    setPendingAction(null);
                }}
                errorMessage={modalError}
                isLoading={isActionLoading}
            />
        </div>
    );
}
