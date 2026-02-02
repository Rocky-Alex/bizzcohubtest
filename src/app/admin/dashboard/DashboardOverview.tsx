"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./DashboardOverview.css";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface DashboardOverviewProps {
    setActiveSection: (section: string) => void;
    laptops?: any[];
}

// --- Date Helper Functions ---
const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
};

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];

    // Previous month padding
    const firstDayOfWeek = date.getDay(); // 0 = Sunday
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ day: null, fullDate: null });
    }

    // Days of current month
    while (date.getMonth() === month) {
        days.push({
            day: date.getDate(),
            fullDate: new Date(date)
        });
        date.setDate(date.getDate() + 1);
    }

    return days;
};

export default function DashboardOverview({
    setActiveSection,
    laptops = []
}: DashboardOverviewProps) {
    // --- Data State ---
    const [aggregatedStats, setAggregatedStats] = useState<{
        invoices: number;
        customers: number;
        amountDue: number;
        quotations: number;
        sales: number;
        purchase: number;
        expenses: number;
        credits: number;
        invoicedAmt: number;
        receivedAmt: number;
        outstandingAmt: number;
        overdueAmt: number;
        products: number;
        recentInvoices: any[];
        trends: {
            sales: number;
            quotations: number;
            customers: number;
            invoices: number;
        };
    }>({
        invoices: 0,
        customers: 0,
        amountDue: 0,
        quotations: 0,
        sales: 0,
        purchase: 0,
        expenses: 0,
        credits: 0,
        invoicedAmt: 0,
        receivedAmt: 0,
        outstandingAmt: 0,
        overdueAmt: 0,
        products: 0,
        recentInvoices: [],
        trends: {
            sales: 0,
            quotations: 0,
            customers: 0,
            invoices: 0
        }
    });
    const [loading, setLoading] = useState(false);

    // --- State ---
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState("Last 30 Days");

    // State for Custom Range Picker
    const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
    const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

    // State for Applied Filter - Default to This Month
    const [appliedStartDate, setAppliedStartDate] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [appliedEndDate, setAppliedEndDate] = useState<Date>(new Date());

    // Calendar view state (points to the 1st of the left/primary month)
    const [viewDate, setViewDate] = useState(new Date());

    // Selection step text helper
    const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');

    // --- Fetch Data Function ---
    const fetchStats = useCallback(async () => {
        // Don't set loading true for auto-refresh to assume smoother UI, or handle differently
        // But for manual filters, we might want it. For now, let's keep it subtle.
        try {
            // Ensure dates are valid
            const from = appliedStartDate.toISOString();
            const to = appliedEndDate.toISOString();

            const res = await fetch(`/api/admin/dashboard/stats?from=${from}&to=${to}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setAggregatedStats(prev => ({ ...prev, ...data }));
            } else {
                console.error("Failed to fetch dashboard stats");
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    }, [appliedStartDate, appliedEndDate]);

    // Initial Fetch & Date Change
    useEffect(() => {
        setLoading(true);
        fetchStats().finally(() => setLoading(false));
    }, [fetchStats]);

    // --- Auto Refresh Logic ---
    useAutoRefresh(fetchStats);


    // --- Handlers ---

    const handlePresetClick = (option: string) => {
        setSelectedDateRange(option);
        const today = new Date();
        const start = new Date();
        const end = new Date();

        if (option === "Today") {
            // default
        } else if (option === "Yesterday") {
            start.setDate(today.getDate() - 1);
            end.setDate(today.getDate() - 1);
        } else if (option === "Last 7 Days") {
            start.setDate(today.getDate() - 6);
        } else if (option === "Last 30 Days") {
            start.setDate(today.getDate() - 29);
        } else if (option === "This Month") {
            start.setDate(1);
        } else if (option === "Last Month") {
            start.setMonth(today.getMonth() - 1);
            start.setDate(1);
            end.setDate(0); // Last day of last month
        } else if (option === "Custom Range") {
            // Don't apply immediately
            setCustomStartDate(appliedStartDate); // Init with current
            setCustomEndDate(appliedEndDate);
            return;
        }

        if (option !== "Custom Range") {
            setAppliedStartDate(start);
            setAppliedEndDate(end);
            // Also sync custom state so calendar shows it if opened later
            setCustomStartDate(start);
            setCustomEndDate(end);
            setIsDateDropdownOpen(false);
        }
    };

    const handleMonthNav = (direction: 'prev' | 'next') => {
        const newDate = new Date(viewDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setViewDate(newDate);
    };

    const onCalendarDateClick = (date: Date) => {
        if (selectionStep === 'start') {
            setCustomStartDate(date);
            setCustomEndDate(date); // Reset selection
            setSelectionStep('end');
        } else {
            // Step is end
            if (date < customStartDate) {
                // User clicked a date BEFORE start, so swap or reset
                setCustomStartDate(date);
                setCustomEndDate(customStartDate); // old start becomes end
            } else {
                setCustomEndDate(date);
            }
            setSelectionStep('start'); // Reset cycle
        }
    };

    // Helper to format currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(val).replace('AED', 'AED ');
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('en-US').format(val);
    };

    const getAvatarUrl = (name: string) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=32`;
    };

    const renderTrendBadge = (value: number) => {
        if (!value) return <span className="summary-badge neutral">0%</span>;
        const isPositive = value > 0;
        return (
            <span className={`summary-badge ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{value.toFixed(1)}%
                <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'}`} style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
            </span>
        );
    };

    // --- Render Helpers ---
    const renderCalendar = (monthOffset: number) => {
        const targetDate = new Date(viewDate);
        targetDate.setMonth(targetDate.getMonth() + monthOffset);

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        const days = getDaysInMonth(year, month);

        return (
            <div className="calendar-container">
                <div className="calendar-header">
                    {monthOffset === 0 && (
                        <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handleMonthNav('prev'); }}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}
                    {monthOffset === 1 && <span />} {/* Spacer */}

                    <span className="month-label">{monthName}</span>

                    {monthOffset === 0 && <span />} {/* Spacer */}
                    {monthOffset === 1 && (
                        <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handleMonthNav('next'); }}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}
                </div>
                <div className="calendar-grid">
                    <div className="day-name">Su</div><div className="day-name">Mo</div><div className="day-name">Tu</div><div className="day-name">We</div><div className="day-name">Th</div><div className="day-name">Fr</div><div className="day-name">Sa</div>

                    {days.map((d, idx) => {
                        if (!d.day || !d.fullDate) {
                            return <div key={idx} className="calendar-day empty"></div>;
                        }

                        const isStart = isSameDay(d.fullDate, customStartDate);
                        const isEnd = isSameDay(d.fullDate, customEndDate);
                        const isRange = d.fullDate > customStartDate && d.fullDate < customEndDate;

                        let className = "calendar-day";
                        if (isStart) className += " selected-start";
                        if (isEnd) className += " selected-end";
                        if (isRange) className += " in-range";

                        return (
                            <div
                                key={idx}
                                className={className}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCalendarDateClick(d.fullDate!);
                                }}
                            >
                                {d.day}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const dateOptions = [
        "Today",
        "Yesterday",
        "Last 7 Days",
        "Last 30 Days",
        "This Month",
        "Last Month",
        "Custom Range"
    ];

    return (
        <section className="dashboard-overview-container">
            <div className="dashboard-header-row">
                <h1>Dashboard</h1>
                <div className="date-filter-container">
                    <button
                        className="date-filter-btn"
                        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    >
                        <i className="far fa-calendar"></i>
                        <span>{formatDate(appliedStartDate)} - {formatDate(appliedEndDate)}</span>
                    </button>

                    {isDateDropdownOpen && (
                        <div className={`date-dropdown-menu ${selectedDateRange === 'Custom Range' ? 'expanded' : ''}`}>
                            <div className="date-picker-content">
                                <div className="date-presets">
                                    {dateOptions.map((option) => (
                                        <div
                                            key={option}
                                            className={`date-dropdown-item ${selectedDateRange === option ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePresetClick(option);
                                            }}
                                        >
                                            {option}
                                        </div>
                                    ))}
                                </div>

                                {selectedDateRange === 'Custom Range' && (
                                    <div className="calendar-section" onClick={(e) => e.stopPropagation()}>
                                        <div className="calendars-row">
                                            {renderCalendar(0)}
                                            {renderCalendar(1)}
                                        </div>

                                        <div className="calendar-footer">
                                            <span className="selected-range-text">
                                                {formatDate(customStartDate)} - {formatDate(customEndDate)}
                                            </span>
                                            <div className="calendar-actions">
                                                <button className="btn-cancel" onClick={() => setIsDateDropdownOpen(false)}>Cancel</button>
                                                <button
                                                    className="btn-apply"
                                                    onClick={() => {
                                                        setAppliedStartDate(customStartDate);
                                                        setAppliedEndDate(customEndDate);
                                                        setIsDateDropdownOpen(false);
                                                    }}
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Row: 3 Main Cards */}
            <div className="dashboard-top-row">
                {/* 1. Overview */}
                <div className="stats-card">
                    <div className="stats-card-header">
                        <i className="fas fa-th-large"></i>
                        <h3>Overview</h3>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon purple"><i className="fas fa-file-invoice"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Invoices</span>
                                <span className="stat-value">{formatNumber(aggregatedStats.invoices)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon green"><i className="fas fa-users"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Customers</span>
                                <span className="stat-value">{formatNumber(aggregatedStats.customers)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon yellow"><i className="fas fa-box"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Amount Due</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.amountDue)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon blue"><i className="fas fa-file-alt"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Quotations</span>
                                <span className="stat-value">{formatNumber(aggregatedStats.quotations)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Sales Analytics */}
                <div className="stats-card">
                    <div className="stats-card-header">
                        <i className="fas fa-chart-bar"></i>
                        <h3>Sales Analytics</h3>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon purple"><i className="fas fa-arrow-right"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Total Sales</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.sales)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon green"><i className="fas fa-shopping-cart"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Purchase</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.purchase)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon yellow"><i className="fas fa-coins"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Expenses</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.expenses)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon blue"><i className="fas fa-percentage"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Credits</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.credits)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Invoice Statistics */}
                <div className="stats-card">
                    <div className="stats-card-header">
                        <i className="fas fa-file-invoice-dollar"></i>
                        <h3>Invoice Statistics</h3>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon purple"><i className="fas fa-check-circle"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Invoiced</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.invoicedAmt)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon green"><i className="fas fa-hand-holding-usd"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Received</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.receivedAmt)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon yellow"><i className="fas fa-clock"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Outstanding</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.outstandingAmt)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon red"><i className="fas fa-exclamation-circle"></i></div>
                            <div className="stat-info">
                                <span className="stat-label">Overdue</span>
                                <span className="stat-value">{formatCurrency(aggregatedStats.overdueAmt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row: Summary Cards */}
            <div className="dashboard-middle-row">


                <div className="summary-data-card">
                    <div className="summary-card-header">
                        <span className="summary-card-title">Total Sales</span>
                        <i className="fas fa-chart-line summary-card-icon"></i>
                    </div>
                    <div className="summary-card-main">
                        <span className="summary-main-value">
                            {aggregatedStats.sales >= 1000
                                ? (aggregatedStats.sales / 1000).toFixed(1) + 'K'
                                : formatNumber(aggregatedStats.sales)}
                        </span>
                        {renderTrendBadge(aggregatedStats.trends.sales)}
                    </div>
                    <div className="summary-card-footer" onClick={() => setActiveSection('orders-all')}>
                        View Invoices
                    </div>
                    <div className="corner-decoration blue"></div>
                </div>

                <div className="summary-data-card">
                    <div className="summary-card-header">
                        <span className="summary-card-title">Total Quotations</span>
                        <i className="fas fa-file-alt summary-card-icon"></i>
                    </div>
                    <div className="summary-card-main">
                        <span className="summary-main-value">{formatNumber(aggregatedStats.quotations)}</span>
                        {renderTrendBadge(aggregatedStats.trends.quotations)}
                    </div>
                    <div className="summary-card-footer" onClick={() => setActiveSection('quotations-all')}>
                        View All
                    </div>
                    <div className="corner-decoration orange"></div>
                </div>

                <div className="summary-data-card">
                    <div className="summary-card-header">
                        <span className="summary-card-title">New Customers</span>
                        <i className="fas fa-users-plus summary-card-icon"></i>
                    </div>
                    <div className="summary-card-main">
                        <span className="summary-main-value">{formatNumber(aggregatedStats.customers)}</span>
                        {renderTrendBadge(aggregatedStats.trends.customers)}
                    </div>
                    <div className="summary-card-footer" onClick={() => setActiveSection('customers-all')}>
                        View All
                    </div>
                    <div className="corner-decoration purple"></div>
                </div>
            </div>

            {/* Bottom Row: Invoices Table */}
            <div className="invoices-section">
                <div className="invoices-header">
                    <h3>Invoices</h3>
                    <button className="btn-view-all" onClick={() => setActiveSection('invoicing-all')}>
                        View all Invoices
                    </button>
                </div>
                <div className="table-wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Created On</th>
                                <th>Amount</th>
                                <th>Paid</th>
                                <th>Payment Mode</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregatedStats.recentInvoices.length > 0 ? (
                                aggregatedStats.recentInvoices.map((inv: any) => (
                                    <tr key={inv.id}>
                                        <td style={{ color: 'var(--text-secondary)' }}>{inv.id}</td>
                                        <td>
                                            <div className="customer-info">
                                                <img
                                                    src={inv.customer_avatar || getAvatarUrl(inv.customer_name)}
                                                    alt={inv.customer_name}
                                                    className="avatar"
                                                />
                                                <span style={{ fontWeight: 500 }}>{inv.customer_name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(inv.created_date).toLocaleDateString()}
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(inv.total_amount)}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(inv.paid_amount || 0)}</td>
                                        <td>
                                            <span className="payment-mode-pill">
                                                {inv.payment_type || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                                        No recent invoices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
