"use client";

import React, { useState, useMemo } from 'react';
import './ActivityLog.css'; // Import the new specific styles
import '@/app/admin/styles/admin.css'; // Ensure global styles are present

interface ActivityLogItem {
    id: string;
    action: string;
    details: string;
    user: string;
    role: string;
    timestamp: string;
    status: 'success' | 'failure' | 'pending';
    ip?: string;
    avatar?: string;
}

const ActivityLog: React.FC = () => {
    // Extended Mock Data
    const [logs] = useState<ActivityLogItem[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filter Logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch =
                log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [logs, searchTerm, filterStatus]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const currentLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Helpers
    const getActionIcon = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('login')) return { icon: 'fa-sign-in-alt', color: 'bg-soft-green' };
        if (lower.includes('logout')) return { icon: 'fa-sign-out-alt', color: 'bg-soft-red' };
        if (lower.includes('update')) return { icon: 'fa-edit', color: 'bg-soft-blue' };
        if (lower.includes('delete')) return { icon: 'fa-trash', color: 'bg-soft-red' };
        if (lower.includes('create') || lower.includes('add')) return { icon: 'fa-plus', color: 'bg-soft-green' };
        if (lower.includes('invoice')) return { icon: 'fa-file-invoice', color: 'bg-soft-purple' };
        if (lower.includes('export')) return { icon: 'fa-file-export', color: 'bg-soft-orange' };
        return { icon: 'fa-history', color: 'bg-soft-blue' }; // default
    };

    return (
        <div className="activity-log-container admin-section active">
            <div className="section-header">
                <h2><i className="fas fa-history"></i> Activity Log</h2>
                <p>Track all system events, user actions, and security alerts in real-time.</p>
            </div>

            {/* Stats Overview */}
            <div className="log-stats-grid">
                <div className="log-stat-card">
                    <div className="stat-icon-wrapper blue">
                        <i className="fas fa-clipboard-list"></i>
                    </div>
                    <div className="stat-content">
                        <h4>Total Events</h4>
                        <p className="stat-value">{logs.length}</p>
                    </div>
                </div>
                <div className="log-stat-card green">
                    <div className="stat-icon-wrapper green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                        <h4>Successful</h4>
                        <p className="stat-value">{logs.filter(l => l.status === 'success').length}</p>
                    </div>
                </div>
                <div className="log-stat-card red">
                    <div className="stat-icon-wrapper red">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="stat-content">
                        <h4>Errors</h4>
                        <p className="stat-value">{logs.filter(l => l.status === 'failure').length}</p>
                    </div>
                </div>
                <div className="log-stat-card purple">
                    <div className="stat-icon-wrapper purple">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                        <h4>Active Users</h4>
                        <p className="stat-value">{new Set(logs.map(l => l.user)).size}</p>
                    </div>
                </div>
            </div>

            {/* Filters & Controls */}
            <div className="log-controls">
                <div className="search-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by user, action or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="failure">Failure</option>
                        <option value="pending">Pending</option>
                    </select>
                    <button className="btn btn-primary" onClick={() => { }}>
                        <i className="fas fa-download"></i> Export
                    </button>
                </div>
            </div>

            {/* Main Log Table */}
            <div className="activity-card">
                <div className="table-responsive">
                    <table className="width-100 activity-table">
                        <thead>
                            <tr>
                                <th className="col-user">User</th>
                                <th className="col-action">Action</th>
                                <th className="col-details">Details</th>
                                <th className="col-time">Date & Time</th>
                                <th className="col-status">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentLogs.length > 0 ? (
                                currentLogs.map((log) => {
                                    const { icon, color } = getActionIcon(log.action);
                                    return (
                                        <tr key={log.id}>
                                            <td className="col-user">
                                                <div className="user-info">
                                                    <div className="user-avatar-circle">
                                                        {log.avatar ? (
                                                            <img src={log.avatar} alt={log.user} className="user-avatar-img" />
                                                        ) : (
                                                            log.user.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="user-details">
                                                        <span className="user-name">{log.user}</span>
                                                        <span className="user-role">{log.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="col-action">
                                                <div className="activity-info">
                                                    <div className={`activity-icon ${color}`}>
                                                        <i className={`fas ${icon}`}></i>
                                                    </div>
                                                    <span className="font-weight-bold">{log.action}</span>
                                                </div>
                                            </td>
                                            <td className="col-details">
                                                <div style={{ maxWidth: '300px' }}>
                                                    <span className="log-details-text" title={log.details}>
                                                        {log.details}
                                                    </span>
                                                    {log.ip && <span className="log-ip">IP: {log.ip}</span>}
                                                </div>
                                            </td>
                                            <td className="col-time text-right">
                                                <div className="datetime-cell">
                                                    <span className="log-date">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                    <small className="log-time">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                </div>
                                            </td>
                                            <td className="col-status text-center">
                                                <div className={`status-pill ${log.status}`}>
                                                    <div className="status-dot"></div>
                                                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-5">
                                        <div className="empty-state">
                                            <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                            <p className="text-muted">No activity logs found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="log-pagination">
                        <div className="page-info">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                        </div>
                        <div className="page-controls">
                            <button
                                className="page-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    className={`page-btn ${currentPage === i + 1 ? 'active-page' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                className="page-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;
