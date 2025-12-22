"use client";

import React, { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal,
    Search,
    Bell,
    Settings,
    MessageSquare,
    HelpCircle,
    Calendar,
    ChevronRight,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import './customer-dashboard.css';

interface CustomerDashboardProps {
    user: {
        id: number | null;
        email: string | null;
    };
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        total_invoiced: 0,
        total_paid: 0,
        total_pending: 0,
        active_orders: 0
    });

    useEffect(() => {
        if (user.id) {
            fetchData();
        }
    }, [user.id]);

    const fetchData = async () => {
        try {
            // Fetch Profile
            const profileRes = await fetch(`/api/customer/profile?id=${user.id}`);
            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data.user);
            }

            // Fetch Orders
            const ordersRes = await fetch(`/api/customer/orders?customer_id=${user.id}`);
            if (ordersRes.ok) {
                const data = await ordersRes.json();
                const fetchedOrders = data.orders || [];
                setOrders(fetchedOrders);

                // Calculate summary
                let invoiced = 0, paid = 0, active = 0;
                fetchedOrders.forEach((o: any) => {
                    const total = Number(o.total) || 0;
                    invoiced += total;
                    if (o.status === 'Paid') paid += total;
                    if (o.status === 'Processing' || o.status === 'Pending') active++;
                });

                setSummary({
                    total_invoiced: invoiced,
                    total_paid: paid,
                    total_pending: invoiced - paid,
                    active_orders: active
                });
            }
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loader">
                <div className="loader-glow"></div>
                <div className="loader-text">Initializing Dashboard...</div>
            </div>
        );
    }

    const firstName = (profile?.name || user.email?.split('@')[0] || 'Customer').split(' ')[0];

    return (
        <div className="dashboard-v2-container">
            {/* Top Bar */}
            <header className="v2-header">
                <div className="header-left">
                    <h1>Welcome back, {firstName} <span className="wave">👋</span></h1>
                    <p className="header-subtitle">Here's what's happening with your account today.</p>
                </div>
                <div className="header-right">
                    <div className="header-search">
                        <Search size={18} />
                        <input type="text" placeholder="Search orders..." />
                    </div>
                    <button className="icon-btn-v2"><Bell size={20} /><span className="badge-dot"></span></button>
                    <button className="icon-btn-v2"><Settings size={20} /></button>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="v2-stats-grid">
                <div className="v2-stat-card primary-glow">
                    <div className="card-top">
                        <div className="icon-box-v2"><Wallet size={24} /></div>
                        <span className="card-trend positive">+12.5%</span>
                    </div>
                    <div className="card-bottom">
                        <span className="v2-label">Total Invoiced</span>
                        <h2 className="v2-value">AED {summary.total_invoiced.toLocaleString()}</h2>
                        <p className="v2-subtext">Overall lifetime volume</p>
                    </div>
                    <div className="card-bg-glow blue"></div>
                </div>

                <div className="v2-stat-card">
                    <div className="card-top">
                        <div className="icon-box-v2 green"><CheckCircle2 size={24} /></div>
                        <span className="card-trend positive">Paid</span>
                    </div>
                    <div className="card-bottom">
                        <span className="v2-label">Total Paid</span>
                        <h2 className="v2-value">AED {summary.total_paid.toLocaleString()}</h2>
                        <p className="v2-subtext">Successfully processed</p>
                    </div>
                </div>

                <div className="v2-stat-card">
                    <div className="card-top">
                        <div className="icon-box-v2 yellow"><Clock size={24} /></div>
                        <span className="card-trend warning">Pending</span>
                    </div>
                    <div className="card-bottom">
                        <span className="v2-label">Pending Amount</span>
                        <h2 className="v2-value">AED {summary.total_pending.toLocaleString()}</h2>
                        <p className="v2-subtext">To be settled</p>
                    </div>
                </div>

                <div className="v2-stat-card">
                    <div className="card-top">
                        <div className="icon-box-v2 purple"><ShieldCheck size={24} /></div>
                        <span className="card-trend info">{summary.active_orders} Orders</span>
                    </div>
                    <div className="card-bottom">
                        <span className="v2-label">Active Orders</span>
                        <h2 className="v2-value">{summary.active_orders}</h2>
                        <p className="v2-subtext">In progress / processing</p>
                    </div>
                </div>
            </div>

            {/* Layout Main Column + Side Column */}
            <div className="v2-main-grid">
                {/* Left Column: Transactions & Charts */}
                <div className="v2-content-main">
                    {/* Insights / Chart Placeholder */}
                    <div className="v2-panel insights-panel">
                        <div className="panel-header-v2">
                            <h3>Spending Trends</h3>
                            <div className="time-filters">
                                <button className="active">7D</button>
                                <button>1M</button>
                                <button>3M</button>
                            </div>
                        </div>
                        <div className="chart-wrapper-v2">
                            <svg className="v2-line-chart" viewBox="0 0 800 200">
                                <path
                                    className="chart-path-bg"
                                    d="M0,180 Q100,160 200,100 T400,120 T600,60 T800,40 L800,200 L0,200 Z"
                                />
                                <path
                                    className="chart-path"
                                    d="M0,180 Q100,160 200,100 T400,120 T600,60 T800,40"
                                    fill="none"
                                    strokeWidth="3"
                                />
                                <circle cx="200" cy="100" r="4" className="chart-dot" />
                                <circle cx="400" cy="120" r="4" className="chart-dot" />
                                <circle cx="600" cy="60" r="4" className="chart-dot" />
                            </svg>
                            <div className="chart-labels">
                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="v2-panel">
                        <div className="panel-header-v2">
                            <h3>Recent Transactions</h3>
                            <button className="text-btn-v2">View All <ChevronRight size={14} /></button>
                        </div>
                        <div className="v2-transaction-list">
                            {orders.length > 0 ? orders.slice(0, 5).map((order, idx) => (
                                <div key={idx} className="v2-tr-item">
                                    <div className="tr-icon">
                                        {order.status === 'Paid' ? <div className="tr-icon-circle green"><ArrowDownLeft size={16} /></div> : <div className="tr-icon-circle yellow"><Clock size={16} /></div>}
                                    </div>
                                    <div className="tr-info">
                                        <span className="tr-name">Order #{order.order_number}</span>
                                        <span className="tr-date">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                    <div className="tr-status">
                                        <span className={`v2-badge ${order.status?.toLowerCase()}`}>{order.status}</span>
                                    </div>
                                    <div className="tr-amount">
                                        <span className="val">AED {Number(order.total).toLocaleString()}</span>
                                    </div>
                                    <button className="tr-more"><MoreHorizontal size={18} /></button>
                                </div>
                            )) : (
                                <div className="empty-state-v2">
                                    <TrendingUp size={48} />
                                    <p>No transactions found yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Support & Info */}
                <div className="v2-content-side">
                    <div className="v2-panel promo-card-v2">
                        <h4>Need Assistance?</h4>
                        <p>Our dedicated support team is available 24/7 to help you with your business needs.</p>
                        <button className="v2-btn-gradient">Contact Manager</button>
                        <div className="promo-bg-icon"><MessageSquare size={120} /></div>
                    </div>

                    <div className="v2-panel help-center-v2">
                        <h3 className="section-title-sm">Quick Help</h3>
                        <div className="help-links">
                            <div className="help-link-item">
                                <HelpCircle size={18} />
                                <span>Common FAQs</span>
                            </div>
                            <div className="help-link-item">
                                <Calendar size={18} />
                                <span>Billing Cycle Info</span>
                            </div>
                            <div className="help-link-item">
                                <MessageSquare size={18} />
                                <span>Live Chat Support</span>
                            </div>
                        </div>
                    </div>

                    <div className="v2-panel activity-preview">
                        <h3 className="section-title-sm">System Updates</h3>
                        <div className="system-logs">
                            <div className="log-item">
                                <div className="log-dot"></div>
                                <div className="log-text">
                                    <p>Server Maintenance</p>
                                    <span>2 hours ago</span>
                                </div>
                            </div>
                            <div className="log-item">
                                <div className="log-dot active"></div>
                                <div className="log-text">
                                    <p>New Feature: Statement Export</p>
                                    <span>Today at 10:00 AM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
