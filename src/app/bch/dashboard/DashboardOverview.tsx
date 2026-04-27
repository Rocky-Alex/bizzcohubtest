"use client";

import React, { useCallback, useEffect, useState } from "react";
import "./DashboardOverview.css";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface DashboardOverviewProps {
    setActiveSection: (section: string) => void;
    laptops?: unknown[];
}

interface RecentBilling {
    id: number | string;
    doc_no: string;
    doc_type: string;
    customer_name: string;
    customer_avatar?: string | null;
    created_date: string;
    total_amount: number;
    paid_amount?: number | null;
    payment_type?: string | null;
    status?: string | null;
    due_date?: string | null;
}

interface RecentPurchase {
    id: number | string;
    lot_number?: string | null;
    supplier_name?: string | null;
    invoice_number?: string | null;
    total_cost: number;
    created_at: string;
}

interface DashboardStats {
    invoices: number;
    proformaCount: number;
    receiptCount: number;
    totalProductQty: number;
    totalSoldQty: number;
    totalInvoicedAmount: number;
    totalPaidInvoicedAmount: number;
    totalPendingInvoicedAmount: number;
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
    recentBilling: RecentBilling[];
    recentPurchases: RecentPurchase[];
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
        proformaCount: 0,
        receiptCount: 0,
        totalProductQty: 0,
        totalSoldQty: 0,
        totalInvoicedAmount: 0,
        totalPaidInvoicedAmount: 0,
        totalPendingInvoicedAmount: 0,
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
        recentBilling: [],
        recentPurchases: [],
        trends: {
            sales: 0,
            quotations: 0,
            customers: 0,
            invoices: 0
        }
    });
    const [overviewStatsData, setOverviewStatsData] = useState<DashboardStats | null>(null);
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
    const [activeRecentTab, setActiveRecentTab] = useState<"billing" | "purchases">("billing");

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

    const fetchOverviewStats = useCallback(async () => {
        try {
            // Fetch lifetime totals for overview stats
            const res = await fetch('/api/bch/dashboard/stats?lifetime=true', { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setOverviewStatsData(data);
            }
        } catch (error) {
            console.error("Error fetching overview stats:", error);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchOverviewStats();
    }, [fetchStats, fetchOverviewStats]);

    useAutoRefresh(() => {
        fetchStats();
        fetchOverviewStats();
    });

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
        { label: "Total Invoice Qty", value: formatNumber(overviewStatsData?.invoices || 0), icon: "fas fa-file-invoice", tone: "purple" },
        { label: "Total Proforma Invoice Qty", value: formatNumber(overviewStatsData?.proformaCount || 0), icon: "fas fa-file-alt", tone: "blue" }
    ];

    const billingStats = [
        { label: "Total Invoice", value: formatCurrency(overviewStatsData?.totalInvoicedAmount || 0), icon: "fas fa-money-bill-wave", tone: "purple" },
        { label: "Total Paid", value: formatCurrency(overviewStatsData?.totalPaidInvoicedAmount || 0), icon: "fas fa-hand-holding-dollar", tone: "green" },
        { label: "Total Pending", value: formatCurrency(overviewStatsData?.totalPendingInvoicedAmount || 0), icon: "fas fa-hourglass-half", tone: "yellow" },
        { label: "Overdue", value: formatCurrency(overviewStatsData?.overdueAmt || 0), icon: "fas fa-exclamation-triangle", tone: "red" }
    ];

    const inventoryStats = [
        { label: "Total Product Qty", value: formatNumber(overviewStatsData?.totalProductQty || 0), icon: "fas fa-boxes", tone: "orange" },
        { label: "Total Sold Product Qty", value: formatNumber(overviewStatsData?.totalSoldQty || 0), icon: "fas fa-box-open", tone: "red" },
        { label: "Purchase Cost", value: formatCurrency(overviewStatsData?.purchase || 0), icon: "fas fa-cart-shopping", tone: "green" }
    ];

    const desktopSections = [
        { title: "Billing Overview", headerIcon: "fas fa-th-large", stats: overviewStats },
        { title: "Payment Summary", headerIcon: "fas fa-chart-bar", stats: billingStats },
        { title: "Inventory & Purchases", headerIcon: "fas fa-file-invoice-dollar", stats: inventoryStats }
    ];

    const dateOptions = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom Range"];
    const mobileChartHeights = getMobileChartHeights([
        aggregatedStats.totalInvoicedAmount,
        aggregatedStats.totalPaidInvoicedAmount,
        aggregatedStats.totalPendingInvoicedAmount,
        aggregatedStats.purchase,
        aggregatedStats.totalProductQty
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
                    <div className="mobile-section-header">
                        <div className="mobile-section-title">
                            <i className="fas fa-th-large"></i>
                            <h2>Billing Overview</h2>
                        </div>
                    </div>
                    <div className="mobile-stat-grid mobile-overview-grid">{overviewStats.map(renderMobileStatCard)}</div>
                </section>

                <section className="mobile-dashboard-section">
                    <div className="mobile-section-header mobile-section-header-split">
                        <div className="mobile-section-title">
                            <i className="fas fa-chart-column"></i>
                            <h2>Sales Analytics</h2>
                        </div>
                        {renderDateFilter("mobile-date-filter")}
                    </div>

                    <div className="mobile-section-header">
                        <div className="mobile-section-title">
                            <i className="fas fa-chart-column"></i>
                            <h2>Sales Analytics</h2>
                        </div>
                    </div>

                    <div className="mobile-feature-card">
                        <div className="mobile-feature-card-header">
                            <div>
                                <span className="mobile-feature-label">Total Invoiced</span>
                                <div className="mobile-feature-value-row">
                                    <strong className="mobile-feature-value">{formatCurrency(aggregatedStats.totalInvoicedAmount)}</strong>
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

                        <button className="mobile-feature-link" onClick={() => {
                            window.dispatchEvent(new Event('bch-nav-start'));
                            setActiveSection("invoicing-all");
                        }}>
                            View Invoices
                        </button>
                        <div className="mobile-feature-glow"></div>
                    </div>

                    <div className="mobile-stat-grid mobile-sales-grid">{billingStats.map(renderMobileStatCard)}</div>
                </section>

                <section className="mobile-dashboard-section">
                    <div className="mobile-section-header">
                        <div className="mobile-section-title">
                            <i className="fas fa-file-invoice-dollar"></i>
                            <h2>Inventory & Purchases</h2>
                        </div>
                    </div>
                    <div className="mobile-stat-grid mobile-invoice-grid">{inventoryStats.map(renderMobileStatCard)}</div>
                </section>

                <section className="mobile-dashboard-section mobile-recent-section">
                    <div className="mobile-section-header mobile-section-header-split">
                        <div className="mobile-section-title"><h2>Recent Billing</h2></div>
                        <button className="btn-view-all mobile-view-all-btn" onClick={() => {
                            window.dispatchEvent(new Event('bch-nav-start'));
                            setActiveSection("invoicing-all");
                        }}>
                            View all Billing
                        </button>
                    </div>

                    {aggregatedStats.recentBilling.length > 0 ? (
                        <div className="mobile-recent-list">
                            {aggregatedStats.recentBilling.slice(0, 4).map((inv) => (
                                <div key={`${inv.doc_type}-${inv.id}`} className="mobile-recent-card" onClick={() => setActiveSection("invoicing-all")}>
                                    <div className="mobile-recent-card-top">
                                        <div className="mobile-recent-customer">
                                            <img src={inv.customer_avatar || getAvatarUrl(inv.customer_name)} alt={inv.customer_name} className="avatar" />
                                            <div>
                                                <strong>{inv.customer_name}</strong>
                                                <span>{inv.doc_type} #{inv.doc_no}</span>
                                            </div>
                                        </div>
                                        <span className="mobile-recent-amount">{formatCurrency(inv.total_amount)}</span>
                                    </div>
                                    <div className="mobile-recent-card-bottom">
                                        <span>{new Date(inv.created_date).toLocaleDateString()}</span>
                                        <span>{inv.doc_type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mobile-empty-state">No recent billing found.</div>
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



                <div className="invoices-section dual-tab-section">
                    <div className="section-header-row">
                        <div className="tab-switcher">
                            <button 
                                className={`tab-btn ${activeRecentTab === "billing" ? "active" : ""}`}
                                onClick={() => setActiveRecentTab("billing")}
                            >
                                Recent Billing
                            </button>
                            <button 
                                className={`tab-btn ${activeRecentTab === "purchases" ? "active" : ""}`}
                                onClick={() => setActiveRecentTab("purchases")}
                            >
                                Recent Purchases
                            </button>
                            <div className={`tab-slider ${activeRecentTab === "purchases" ? "purchases" : ""}`} />
                        </div>
                        <button 
                            className="btn-view-all" 
                            onClick={() => {
                                window.dispatchEvent(new Event('bch-nav-start'));
                                setActiveSection(activeRecentTab === "billing" ? "invoicing-all" : "purchase-history");
                            }}
                        >
                            View all {activeRecentTab === "billing" ? "Billing" : "Purchases"}
                        </button>
                    </div>

                    <div className="table-wrapper">
                        {activeRecentTab === "billing" ? (
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Doc</th>
                                        <th>Type</th>
                                        <th>Customer</th>
                                        <th>Created On</th>
                                        <th>Amount</th>
                                        <th>Paid</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aggregatedStats.recentBilling.length > 0 ? (
                                        aggregatedStats.recentBilling.map((inv) => (
                                            <tr key={`${inv.doc_type}-${inv.id}`}>
                                                <td style={{ color: "var(--text-secondary)" }}>{inv.doc_no}</td>
                                                <td style={{ color: "var(--text-secondary)" }}>{inv.doc_type}</td>
                                                <td>
                                                    <div className="customer-info">
                                                        <img src={inv.customer_avatar || getAvatarUrl(inv.customer_name)} alt={inv.customer_name} className="avatar" />
                                                        <span style={{ fontWeight: 500 }}>{inv.customer_name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: "var(--text-secondary)" }}>{new Date(inv.created_date).toLocaleDateString()}</td>
                                                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(inv.total_amount)}</td>
                                                <td style={{ color: "var(--text-secondary)" }}>{formatCurrency(inv.paid_amount || 0)}</td>
                                                <td><span className="payment-mode-pill">{inv.status || "N/A"}</span></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                                                No recent billing found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Lot #</th>
                                        <th>Supplier</th>
                                        <th>Invoice #</th>
                                        <th>Total Cost</th>
                                        <th>Created On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aggregatedStats.recentPurchases.length > 0 ? (
                                        aggregatedStats.recentPurchases.map((purchase) => (
                                            <tr key={purchase.id}>
                                                <td style={{ color: "var(--text-secondary)" }}>{purchase.lot_number || purchase.id}</td>
                                                <td>{purchase.supplier_name || 'N/A'}</td>
                                                <td>{purchase.invoice_number || 'N/A'}</td>
                                                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(purchase.total_cost)}</td>
                                                <td style={{ color: "var(--text-secondary)" }}>{new Date(purchase.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                                                No recent purchases found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
