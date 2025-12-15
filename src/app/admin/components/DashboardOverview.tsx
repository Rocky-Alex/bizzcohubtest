import React, { useState, useMemo } from "react";

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
    const [aggregatedStats, setAggregatedStats] = useState({
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
    });
    const [loading, setLoading] = useState(false);

    // --- State ---
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState("Today");

    // State for Custom Range Picker
    const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
    const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

    // State for Applied Filter
    const [appliedStartDate, setAppliedStartDate] = useState<Date>(new Date());
    const [appliedEndDate, setAppliedEndDate] = useState<Date>(new Date());

    // Calendar view state (points to the 1st of the left/primary month)
    const [viewDate, setViewDate] = useState(new Date());

    // Selection step text helper
    const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');

    // --- Fetch Real Data ---
    React.useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Ensure dates are valid
                const from = appliedStartDate.toISOString();
                const to = appliedEndDate.toISOString();

                const res = await fetch(`/api/admin/dashboard/stats?from=${from}&to=${to}`);
                if (res.ok) {
                    const data = await res.json();
                    setAggregatedStats(prev => ({ ...prev, ...data }));
                } else {
                    console.error("Failed to fetch dashboard stats");
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [appliedStartDate, appliedEndDate]);

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
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('en-US').format(val);
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
        <section className="admin-section active">
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

            {/* Top Row Widgets */}
            <div className="dashboard-widgets-grid">
                {/* Overview Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <i className="fas fa-th-large"></i>
                        <h3>Overview</h3>
                    </div>
                    <div className="widget-content grid-2x2">
                        <div className="widget-item">
                            <div className="widget-icon purple"><i className="fas fa-file-invoice"></i></div>
                            <div className="widget-data">
                                <span className="label">Invoices</span>
                                <span className="value">{formatNumber(aggregatedStats.invoices)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon green"><i className="fas fa-users"></i></div>
                            <div className="widget-data">
                                <span className="label">Customers</span>
                                <span className="value">{formatNumber(aggregatedStats.customers)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon yellow"><i className="fas fa-cube"></i></div>
                            <div className="widget-data">
                                <span className="label">Amount Due</span>
                                <span className="value">{formatCurrency(aggregatedStats.amountDue)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon blue"><i className="fas fa-file-alt"></i></div>
                            <div className="widget-data">
                                <span className="label">Quotations</span>
                                <span className="value">{formatNumber(aggregatedStats.quotations)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Analytics Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <i className="fas fa-chart-bar"></i>
                        <h3>Sales Analytics</h3>
                    </div>
                    <div className="widget-content grid-2x2">
                        <div className="widget-item">
                            <div className="widget-icon purple"><i className="fas fa-arrow-right"></i></div>
                            <div className="widget-data">
                                <span className="label">Total Sales</span>
                                <span className="value">{formatCurrency(aggregatedStats.sales)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon green"><i className="fas fa-code-branch"></i></div>
                            <div className="widget-data">
                                <span className="label">Purchase</span>
                                <span className="value">{formatCurrency(aggregatedStats.purchase)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon yellow"><i className="fas fa-coins"></i></div>
                            <div className="widget-data">
                                <span className="label">Expenses</span>
                                <span className="value">{formatCurrency(aggregatedStats.expenses)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon blue"><i className="fas fa-flag"></i></div>
                            <div className="widget-data">
                                <span className="label">Credits</span>
                                <span className="value">{formatCurrency(aggregatedStats.credits)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice Statistics Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <i className="fas fa-file-invoice-dollar"></i>
                        <h3>Invoice Statistics</h3>
                    </div>
                    <div className="widget-content grid-2x2">
                        <div className="widget-item">
                            <div className="widget-icon purple"><i className="fas fa-check-circle"></i></div>
                            <div className="widget-data">
                                <span className="label">Invoiced</span>
                                <span className="value">{formatCurrency(aggregatedStats.invoicedAmt)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon green"><i className="fas fa-file-invoice"></i></div>
                            <div className="widget-data">
                                <span className="label">Received</span>
                                <span className="value">{formatCurrency(aggregatedStats.receivedAmt)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon yellow"><i className="fas fa-clock"></i></div>
                            <div className="widget-data">
                                <span className="label">Outstanding</span>
                                <span className="value">{formatCurrency(aggregatedStats.outstandingAmt)}</span>
                            </div>
                        </div>
                        <div className="widget-item">
                            <div className="widget-icon red"><i className="fas fa-thumbs-down"></i></div>
                            <div className="widget-data">
                                <span className="label">Overdue</span>
                                <span className="value">{formatCurrency(aggregatedStats.overdueAmt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row Summary Cards */}
            <div className="dashboard-summary-cards">
                <div className="summary-card">
                    <div className="card-top">
                        <span className="card-title">Total Products</span>
                        <div className="card-icon-wrapper"><i className="fas fa-box"></i></div>
                    </div>
                    <div className="card-main">
                        <span className="card-value">{formatNumber(aggregatedStats.products)}</span>
                        <span className="card-trend positive">+45 <i className="fas fa-caret-up"></i></span>
                    </div>
                    <div className="card-link" onClick={() => setActiveSection('products')}>
                        View Inventory
                    </div>
                    <div className="corner-accent purple"></div>
                </div>

                <div className="summary-card">
                    <div className="card-top">
                        <span className="card-title">Total Sales</span>
                        <div className="card-icon-wrapper"><i className="fas fa-chart-line"></i></div>
                    </div>
                    <div className="card-main">
                        <span className="card-value">{formatNumber(Math.floor(aggregatedStats.sales / 100))}</span>
                        <span className="card-trend positive">+45 <i className="fas fa-caret-up"></i></span>
                    </div>
                    <div className="card-link" onClick={() => setActiveSection('orders')}>
                        View Invoices
                    </div>
                    <div className="corner-accent blue"></div>
                </div>

                <div className="summary-card">
                    <div className="card-top">
                        <span className="card-title">Total Quotations</span>
                        <div className="card-icon-wrapper"><i className="fas fa-file-alt"></i></div>
                    </div>
                    <div className="card-main">
                        <span className="card-value">{formatNumber(aggregatedStats.quotations)}</span>
                        <span className="card-trend positive">+45 <i className="fas fa-caret-up"></i></span>
                    </div>
                    <div className="card-link" onClick={() => setActiveSection('orders')}>
                        View All
                    </div>
                    <div className="corner-accent orange"></div>
                </div>
            </div>


            {/* Recent Invoices Section */}
            <div className="dashboard-invoices-section">
                <div className="section-header-row">
                    <h3>Invoices</h3>
                    <button className="view-all-btn" onClick={() => setActiveSection('invoicing-dashboard')}>
                        View all Invoices
                    </button>
                </div>

                <div className="table-container">
                    <table className="invoices-table">
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
                            {[
                                { id: "INV00025", name: "Emily Clark", date: "22 Feb 2025", amount: "$10,000", paid: "$5,000", mode: "Cash", due: "04 Mar 2025" },
                                { id: "INV00024", name: "John Carter", date: "07 Feb 2025", amount: "$25,750", paid: "$5,000", mode: "Check", due: "20 Feb 2025" },
                                { id: "INV00023", name: "Sophia White", date: "09 Dec 2024", amount: "$1,20,500", paid: "$60,000", mode: "Check", due: "12 Nov 2024" },
                                { id: "INV00022", name: "Michael Johnson", date: "30 Nov 2024", amount: "$7,50,300", paid: "$60,000", mode: "Check", due: "25 Oct 2024" },
                                { id: "INV00016", name: "Daniel Martinez", date: "12 Oct 2024", amount: "$9,99,999", paid: "$4,00,000", mode: "Cash", due: "18 Oct 2024" },
                            ].map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="text-gray">{invoice.id}</td>
                                    <td>
                                        <div className="customer-cell">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${invoice.name}&background=random&color=fff&size=32`}
                                                alt={invoice.name}
                                                className="customer-avatar"
                                            />
                                            <span className="customer-name">{invoice.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-gray">{invoice.date}</td>
                                    <td className="font-medium">{invoice.amount}</td>
                                    <td className="text-gray">{invoice.paid}</td>
                                    <td className="text-gray">{invoice.mode}</td>
                                    <td className="text-gray">{invoice.due}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
