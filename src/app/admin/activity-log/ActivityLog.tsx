"use client";

import React, { useState, useMemo } from 'react';
import './ActivityLog.css'; // Import the new specific styles
import '@/app/admin/styles/admin.css'; // Ensure global styles are present
import LoadingSpinner from '../../components/LoadingSpinner';

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

const timeZone = 'Asia/Dubai'; // UTC+04:00

const ActivityLog: React.FC = () => {
    // Helper to get today's date string in YYYY-MM-DD
    const getTodayDateString = () => new Date().toLocaleDateString('en-CA', { timeZone });

    // State
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [dateRange, setDateRange] = useState({ start: getTodayDateString(), end: getTodayDateString() });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal State
    const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

    // Fetch Logs
    React.useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('/api/admin/activity-logs');
                if (response.ok) {
                    const data = await response.json();
                    setLogs(data);
                }
            } catch (error) {
                console.error('Failed to fetch logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    // Delete Log
    const handleDeleteLog = async (id: string) => {
        if (!confirm('Are you sure you want to delete this activity log?')) return;

        try {
            const response = await fetch(`/api/admin/activity-logs?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setLogs(prev => prev.filter(log => log.id !== id));
            } else {
                alert('Failed to delete log');
            }
        } catch (error) {
            console.error('Error deleting log:', error);
            alert('Error deleting log');
        }
    };

    // Filter Logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Explicitly hide "View Dashboard page" logs
            if (log.action === 'View Page' && log.details.includes('Dashboard page')) {
                return false;
            }

            const matchesSearch =
                log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

            let matchesDate = true;
            if (dateRange.start || dateRange.end) {
                // Get log date in target timezone as YYYY-MM-DD for accurate comparison using string lexicography
                const logDateStr = new Date(log.timestamp).toLocaleDateString('en-CA', { timeZone });

                if (dateRange.start && logDateStr < dateRange.start) matchesDate = false;
                if (dateRange.end && logDateStr > dateRange.end) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [logs, searchTerm, filterStatus, dateRange]);

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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', width: '100%' }}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="activity-log-container admin-section active">
            <div className="section-header">
                <h2><i className="fas fa-history"></i> Activity Log</h2>
                <p>Track all system events, user actions, and security alerts in real-time (UTC+04:00).</p>
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
                    <input
                        type="date"
                        className="filter-date"
                        style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', marginRight: '10px' }}
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        title="Start Date"
                    />
                    <input
                        type="date"
                        className="filter-date"
                        style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', marginRight: '10px' }}
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        title="End Date"
                    />
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
                                <th className="col-job">Job Description</th>
                                <th className="col-details">Details</th>
                                <th className="col-date">Date</th>
                                <th className="col-time">Time</th>
                                <th className="col-seconds">Seconds</th>
                                <th className="col-status">Status</th>
                                <th className="col-action-btn">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentLogs.length > 0 ? (
                                currentLogs.map((log) => {
                                    const { icon, color } = getActionIcon(log.action);
                                    const logDateObj = new Date(log.timestamp.endsWith('Z') ? log.timestamp : log.timestamp + 'Z');

                                    // Extract duration from details if present (e.g. "Viewed ... (Duration: 25s)")
                                    const durationMatch = log.details.match(/Duration: (\d+)s/);
                                    const duration = durationMatch ? durationMatch[1] : null;

                                    // Determine content for Details column
                                    let detailsContent = log.details;
                                    if (log.action === 'View Page') {
                                        const page = log.details.replace('Viewed ', '').replace(/ page.*/, '');
                                        detailsContent = `Home > ${page}`;
                                    }

                                    return (
                                        <tr key={log.id}>
                                            <td className="col-user">
                                                <div className="user-info">
                                                    <div className="user-avatar-circle">
                                                        {log.avatar ? (
                                                            <img src={log.avatar} alt={log.user} className="user-avatar-img" />
                                                        ) : (
                                                            log.user.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="user-details">
                                                        <span className="user-name">{log.user}</span>
                                                        <span className="user-role">{log.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="col-job">
                                                <div className="activity-info">
                                                    <div className={`activity-icon ${color}`}>
                                                        <i className={`fas ${icon}`}></i>
                                                    </div>
                                                    <span className="font-weight-bold">{log.action}</span>
                                                </div>
                                            </td>
                                            <td className="col-details">
                                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                    {detailsContent}
                                                </span>
                                            </td>
                                            <td className="col-date text-right">
                                                <span className="log-date">
                                                    {logDateObj.toLocaleDateString('en-GB', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="col-time text-right">
                                                <small className="log-time" style={{ fontSize: '0.9rem' }}>
                                                    {logDateObj.toLocaleTimeString('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </small>
                                            </td>
                                            <td className="col-seconds text-right">
                                                <small className="log-time" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                    {duration ? `${duration} s` : '-'}
                                                </small>
                                            </td>
                                            <td className="col-status text-center">
                                                <div className={`status-pill ${log.status}`}>
                                                    <div className="status-dot"></div>
                                                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                </div>
                                            </td>
                                            <td className="col-action-btn">
                                                <button
                                                    className="btn-icon"
                                                    style={{ marginRight: '8px' }}
                                                    onClick={() => setSelectedLog(log)}
                                                    title="View Details"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn-icon delete"
                                                    onClick={() => handleDeleteLog(log.id)}
                                                    title="Delete Log"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-5">
                                        <div className="empty-state">
                                            <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                            <p className="text-muted">No activity logs found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div >

                {/* Pagination */}
                {
                    totalPages > 1 && (
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
                    )
                }
            </div >

            {/* Details Modal */}
            {
                selectedLog && (
                    <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Activity Details</h3>
                                <button className="modal-close" onClick={() => setSelectedLog(null)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Action:</strong> {selectedLog.action}</p>
                                <p><strong>User:</strong> {selectedLog.user} ({selectedLog.role})</p>
                                <p><strong>Status:</strong> {selectedLog.status}</p>
                                <p><strong>Time:</strong> {new Date(selectedLog.timestamp.endsWith('Z') ? selectedLog.timestamp : selectedLog.timestamp + 'Z').toLocaleString('en-US', { timeZone, dateStyle: 'full', timeStyle: 'medium' })} (UTC+4)</p>
                                <p><strong>Details:</strong> {selectedLog.details}</p>
                                {selectedLog.action === 'View Page' && (
                                    <p><strong>Navigation:</strong> Home {'>'} {selectedLog.details.replace('Viewed ', '').replace(/ page.*/, '')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ActivityLog;
