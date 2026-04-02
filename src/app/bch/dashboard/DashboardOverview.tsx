"use client";

import React, { useCallback, useEffect, useState } from "react";
import "./DashboardOverview.css";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface DashboardOverviewProps {
    setActiveSection: (section: string) => void;
    laptops?: unknown[];
}

interface RecentInvoice {
    id: number | string;
    customer_name: string;
    customer_avatar?: string | null;
    created_date: string;
    total_amount: number;
    paid_amount?: number | null;
    payment_type?: string | null;
    due_date?: string | null;
}

interface DashboardStats {
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
    recentInvoices: RecentInvoice[];
    trends: {
        sales: number;
        quotations: number;
        customers: number;
        invoices: number;
    };
}

const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });

const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayOfWeek = date.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ day: null, fullDate: null });
    }

    while (date.getMonth() === month) {
        days.push({
            day: date.getDate(),
            fullDate: new Date(date)
        });
        date.setDate(date.getDate() + 1);
    }

    return days;
};

const getMobileChartHeights = (values: number[]) => {
    const safeValues = values.map((value) => Math.max(0, Number(value) || 0));
    const maxValue = Math.max(...safeValues, 0);

    if (!maxValue) {
        return [18, 28, 48, 34, 44];
    }

    return safeValues.map((value) => Math.max(18, Math.round((value / maxValue) * 48)));
};

export default function DashboardOverview({
    setActiveSection
}: DashboardOverviewProps) {
    const [aggregatedStats, setAggregatedStats] = useState<DashboardStats>({
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
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState("Last 30 Days");
    const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
    const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
    const [appliedStartDate, setAppliedStartDate] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [appliedEndDate, setAppliedEndDate] = useState<Date>(new Date());
    const [viewDate, setViewDate] = useState(new Date());
    const [selectionStep, setSelectionStep] = useState<"start" | "end">("start");

    const fetchStats = useCallback(async () => {
        try {
            const from = appliedStartDate.toISOString();
            const to = appliedEndDate.toISOString();
            const res = await fetch(`/api/bch/dashboard/stats?from=${from}&to=${to}`, { cache: "no-store" });

            if (res.ok) {
                const data = await res.json();
                setAggregatedStats((prev) => ({ ...prev, ...data }));
            } else {
                console.error("Failed to fetch dashboard stats");
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    }, [appliedStartDate, appliedEndDate]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useAutoRefresh(fetchStats);

    const handlePresetClick = (option: string) => {
        setSelectedDateRange(option);
        const today = new Date();
        const start = new Date();
        const end = new Date();

        if (option === "Yesterday") {
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
            end.setDate(0);
        } else if (option === "Custom Range") {
            setCustomStartDate(appliedStartDate);
            setCustomEndDate(appliedEndDate);
            return;
        }

        if (option !== "Custom Range") {
            setAppliedStartDate(start);
            setAppliedEndDate(end);
            setCustomStartDate(start);
            setCustomEndDate(end);
            setIsDateDropdownOpen(false);
        }
    };

    const handleMonthNav = (direction: "prev" | "next") => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1));
        setViewDate(newDate);
    };

    const onCalendarDateClick = (date: Date) => {
        if (selectionStep === "start") {
            setCustomStartDate(date);
            setCustomEndDate(date);
            setSelectionStep("end");
            return;
        }

        if (date < customStartDate) {
            setCustomStartDate(date);
            setCustomEndDate(customStartDate);
        } else {
            setCustomEndDate(date);
        }

        setSelectionStep("start");
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "AED", maximumFractionDigits: 0 })
            .format(value)
            .replace("AED", "AED ");

    const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

    const getAvatarUrl = (name: string) =>
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=32`;

    const renderTrendBadge = (value: number) => {
        if (!value) return <span className="summary-badge neutral">0%</span>;

        const isPositive = value > 0;
        return (
            <span className={`summary-badge ${isPositive ? "positive" : "negative"}`}>
                {isPositive ? "+" : ""}{value.toFixed(1)}%
                <i className={`fas fa-arrow-${isPositive ? "up" : "down"}`} style={{ fontSize: "0.7em", marginLeft: "2px" }}></i>
            </span>
        );
    };

    const overviewStats = [
        { label: "Invoices", value: formatNumber(aggregatedStats.invoices), icon: "fas fa-file-invoice", tone: "purple" },
        { label: "Customers", value: formatNumber(aggregatedStats.customers), icon: "fas fa-users", tone: "green" },
        { label: "Amount Due", value: formatCurrency(aggregatedStats.amountDue), icon: "fas fa-wallet", tone: "yellow" },
        { label: "Quotations", value: formatNumber(aggregatedStats.quotations), icon: "fas fa-file-alt", tone: "blue" }
    ];

    const salesStats = [
        { label: "Total Sales", value: formatCurrency(aggregatedStats.sales), icon: "fas fa-arrow-right", tone: "purple" },
        { label: "Purchase", value: formatCurrency(aggregatedStats.purchase), icon: "fas fa-cart-shopping", tone: "green" },
        { label: "Expenses", value: formatCurrency(aggregatedStats.expenses), icon: "fas fa-money-bill-wave", tone: "yellow" },
        { label: "Credits", value: formatCurrency(aggregatedStats.credits), icon: "fas fa-percent", tone: "blue" }
    ];

    const invoiceStats = [
        { label: "Invoiced", value: formatCurrency(aggregatedStats.invoicedAmt), icon: "fas fa-check-circle", tone: "purple" },
        { label: "Received", value: formatCurrency(aggregatedStats.receivedAmt), icon: "fas fa-hand-holding-usd", tone: "green" },
        { label: "Outstanding", value: formatCurrency(aggregatedStats.outstandingAmt), icon: "fas fa-clock", tone: "yellow" },
        { label: "Overdue", value: formatCurrency(aggregatedStats.overdueAmt), icon: "fas fa-exclamation-circle", tone: "red" }
    ];

    const desktopSections = [
        { title: "Overview", headerIcon: "fas fa-th-large", stats: overviewStats },
        { title: "Sales Analytics", headerIcon: "fas fa-chart-bar", stats: salesStats },
        { title: "Invoice Statistics", headerIcon: "fas fa-file-invoice-dollar", stats: invoiceStats }
    ];

    const dateOptions = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom Range"];
    const mobileChartHeights = getMobileChartHeights([
        aggregatedStats.sales,
        aggregatedStats.purchase,
        aggregatedStats.invoicedAmt,
        aggregatedStats.receivedAmt,
        aggregatedStats.quotations
    ]);

    const renderCalendar = (monthOffset: number) => {
        const targetDate = new Date(viewDate);
        targetDate.setMonth(targetDate.getMonth() + monthOffset);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const monthName = targetDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        const days = getDaysInMonth(year, month);

        return (
            <div className="calendar-container">
                <div className="calendar-header">
                    {monthOffset === 0 ? (
                        <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handleMonthNav("prev"); }}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    ) : <span />}
                    <span className="month-label">{monthName}</span>
                    {monthOffset === 1 ? (
                        <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handleMonthNav("next"); }}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    ) : <span />}
                </div>

                <div className="calendar-grid">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <div key={day} className="day-name">{day}</div>)}
                    {days.map((d, idx) => {
                        if (!d.day || !d.fullDate) {
                            return <div key={idx} className="calendar-day empty"></div>;
                        }

                        const isStart = isSameDay(d.fullDate, customStartDate);
                        const isEnd = isSameDay(d.fullDate, customEndDate);
                        const isRange = d.fullDate > customStartDate && d.fullDate < customEndDate;
                        const className = [
                            "calendar-day",
                            isStart ? "selected-start" : "",
                            isEnd ? "selected-end" : "",
                            isRange ? "in-range" : ""
                        ].filter(Boolean).join(" ");

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

    const renderDateFilter = (className = "") => (
        <div className={`date-filter-container ${className}`.trim()}>
            <button className="date-filter-btn" onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}>
                <i className="far fa-calendar"></i>
                <span>{formatDate(appliedStartDate)} - {formatDate(appliedEndDate)}</span>
            </button>

            {isDateDropdownOpen && (
                <div className={`date-dropdown-menu ${selectedDateRange === "Custom Range" ? "expanded" : ""}`}>
                    <div className="date-picker-content">
                        <div className="date-presets">
                            {dateOptions.map((option) => (
                                <div
                                    key={option}
                                    className={`date-dropdown-item ${selectedDateRange === option ? "active" : ""}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePresetClick(option);
                                    }}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>

                        {selectedDateRange === "Custom Range" && (
                            <div className="calendar-section" onClick={(e) => e.stopPropagation()}>
                                <div className="calendars-row">
                                    {renderCalendar(0)}
                                    {renderCalendar(1)}
                                </div>

                                <div className="calendar-footer">
                                    <span className="selected-range-text">{formatDate(customStartDate)} - {formatDate(customEndDate)}</span>
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
    );

    const renderMobileStatCard = (stat: { label: string; value: string; icon: string; tone: string; }) => (
        <div key={stat.label} className="mobile-stat-card">
            <div className={`mobile-stat-icon ${stat.tone}`}>
                <i className={stat.icon}></i>
            </div>
            <div className="mobile-stat-copy">
                <span className="mobile-stat-label">{stat.label}</span>
                <strong className="mobile-stat-value">{stat.value}</strong>
            </div>
        </div>
    );

    return (
        <section className="dashboard-overview-container">
            <div className="dashboard-mobile-view">
                <div className="dashboard-mobile-search">
                    <i className="fas fa-search"></i>
                    <input type="search" placeholder="Search..." aria-label="Search dashboard" />
                </div>

                <section className="mobile-dashboard-section">
                    <div className="mobile-section-header mobile-section-header-split">
                        <div className="mobile-section-title">
                            <i className="fas fa-border-all"></i>
                            <h2>Overview</h2>
                        </div>
                        {renderDateFilter("mobile-date-filter")}
                    </div>
                    <div className="mobile-stat-grid">{overviewStats.map(renderMobileStatCard)}</div>
                </section>

                <section className="mobile-dashboard-section">
                    <div className="mobile-section-header">
                        <div className="mobile-section-title">
                            <i className="fas fa-chart-column"></i>
                            <h2>Sales Analytics</h2>
                        </div>
                    </div>

                    <div className="mobile-feature-card">
                        <div className="mobile-feature-card-header">
                            <div>
                                <span className="mobile-feature-label">Total Sales</span>
                                <div className="mobile-feature-value-row">
                                    <strong className="mobile-feature-value">{formatNumber(aggregatedStats.sales)}</strong>
                                    {renderTrendBadge(aggregatedStats.trends.sales)}
                                </div>
                            </div>
                            <i className="fas fa-chart-line mobile-feature-icon"></i>
                        </div>

                        <div className="mobile-feature-chart" aria-hidden="true">
                            {mobileChartHeights.map((height, index) => (
                                <span key={`${height}-${index}`} className="mobile-feature-bar" style={{ height: `${height}px` }}></span>
                            ))}
                        </div>

                        <button className="mobile-feature-link" onClick={() => setActiveSection("invoicing-all")}>
                            View Invoices
                        </button>
                        <div className="mobile-feature-glow"></div>
                    </div>

                    <div className="mobile-stat-grid mobile-sales-grid">{salesStats.map(renderMobileStatCard)}</div>
                </section>

                <section className="mobile-dashboard-section">
                    <div className="mobile-section-header">
                        <div className="mobile-section-title">
                            <i className="fas fa-file-invoice-dollar"></i>
                            <h2>Invoice Statistics</h2>
                        </div>
                    </div>
                    <div className="mobile-stat-grid mobile-invoice-grid">{invoiceStats.map(renderMobileStatCard)}</div>
                </section>

                <section className="mobile-dashboard-section mobile-recent-section">
                    <div className="mobile-section-header mobile-section-header-split">
                        <div className="mobile-section-title"><h2>Recent Invoices</h2></div>
                        <button className="btn-view-all mobile-view-all-btn" onClick={() => setActiveSection("invoicing-all")}>
                            View all Invoices
                        </button>
                    </div>

                    {aggregatedStats.recentInvoices.length > 0 ? (
                        <div className="mobile-recent-list">
                            {aggregatedStats.recentInvoices.slice(0, 4).map((inv) => (
                                <div key={inv.id} className="mobile-recent-card" onClick={() => setActiveSection("invoicing-all")}>
                                    <div className="mobile-recent-card-top">
                                        <div className="mobile-recent-customer">
                                            <img src={inv.customer_avatar || getAvatarUrl(inv.customer_name)} alt={inv.customer_name} className="avatar" />
                                            <div>
                                                <strong>{inv.customer_name}</strong>
                                                <span>#{inv.id}</span>
                                            </div>
                                        </div>
                                        <span className="mobile-recent-amount">{formatCurrency(inv.total_amount)}</span>
                                    </div>
                                    <div className="mobile-recent-card-bottom">
                                        <span>{new Date(inv.created_date).toLocaleDateString()}</span>
                                        <span>{inv.payment_type || "N/A"}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mobile-empty-state">No recent invoices found.</div>
                    )}
                </section>
            </div>

            <div className="dashboard-desktop-view">
                <div className="dashboard-header-row">
                    <h1>Dashboard</h1>
                    {renderDateFilter()}
                </div>

                <div className="dashboard-top-row">
                    {desktopSections.map((section) => (
                        <div key={section.title} className="stats-card">
                            <div className="stats-card-header">
                                <i className={section.headerIcon}></i>
                                <h3>{section.title}</h3>
                            </div>
                            <div className="stats-grid">
                                {section.stats.map((stat) => (
                                    <div key={stat.label} className="stat-item">
                                        <div className={`stat-icon ${stat.tone}`}><i className={stat.icon}></i></div>
                                        <div className="stat-info">
                                            <span className="stat-label">{stat.label}</span>
                                            <span className="stat-value">{stat.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dashboard-middle-row">
                    <div className="summary-data-card">
                        <div className="summary-card-header">
                            <span className="summary-card-title">Total Sales</span>
                            <i className="fas fa-chart-line summary-card-icon"></i>
                        </div>
                        <div className="summary-card-main">
                            <span className="summary-main-value">
                                {aggregatedStats.sales >= 1000 ? `${(aggregatedStats.sales / 1000).toFixed(1)}K` : formatNumber(aggregatedStats.sales)}
                            </span>
                            {renderTrendBadge(aggregatedStats.trends.sales)}
                        </div>
                        <div className="summary-card-footer" onClick={() => setActiveSection("invoicing-all")}>View Invoices</div>
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
                        <div className="summary-card-footer" onClick={() => setActiveSection("quotations-all")}>View All</div>
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
                        <div className="summary-card-footer" onClick={() => setActiveSection("customers-all")}>View All</div>
                        <div className="corner-decoration purple"></div>
                    </div>
                </div>

                <div className="invoices-section">
                    <div className="invoices-header">
                        <h3>Invoices</h3>
                        <button className="btn-view-all" onClick={() => setActiveSection("invoicing-all")}>
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
                                    aggregatedStats.recentInvoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td style={{ color: "var(--text-secondary)" }}>{inv.id}</td>
                                            <td>
                                                <div className="customer-info">
                                                    <img src={inv.customer_avatar || getAvatarUrl(inv.customer_name)} alt={inv.customer_name} className="avatar" />
                                                    <span style={{ fontWeight: 500 }}>{inv.customer_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: "var(--text-secondary)" }}>{new Date(inv.created_date).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(inv.total_amount)}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{formatCurrency(inv.paid_amount || 0)}</td>
                                            <td><span className="payment-mode-pill">{inv.payment_type || "N/A"}</span></td>
                                            <td style={{ color: "var(--text-secondary)" }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                                            No recent invoices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
