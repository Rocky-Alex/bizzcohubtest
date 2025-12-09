import React, { useState } from 'react';
import '../styles/platform-dashboard.css';
import NoonIcon from "./icons/NoonIcon";
// import '../styles/dashboard.css'; // Already imported in page.tsx

interface PlatformDashboardProps {
    platformName: 'Amazon' | 'Noon';
}

export default function PlatformDashboard({ platformName }: PlatformDashboardProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab platformName={platformName} setActiveTab={setActiveTab} />;
            case 'orders':
                return <OrdersTab platformName={platformName} />;
            case 'returns':
                return <ReturnsTab platformName={platformName} />;
            case 'warranty':
                return <WarrantyTab platformName={platformName} />;
            case 'reports':
                return <ReportsTab platformName={platformName} />;
            default:
                return <OverviewTab platformName={platformName} setActiveTab={setActiveTab} />;
        }
    };

    return (
        <section className="admin-section active">
            <div className="section-header">
                <div className="platform-header-row">
                    <div>
                        <h2>
                            {platformName === 'Noon' ? (
                                <span style={{ display: 'inline-block', width: '32px', marginRight: '10px', verticalAlign: 'middle' }}>
                                    <NoonIcon />
                                </span>
                            ) : (
                                <i className={`fab fa-amazon`}></i>
                            )} {platformName} Dashboard
                        </h2>
                        <p>Manage your {platformName} business operations</p>
                    </div>
                    {/* Integration Status Badge */}
                    <div className="integration-status">
                        <span className="status-dot"></span>
                        Connected
                    </div>
                </div>
            </div>

            {/* Sub-navigation */}
            <div className="dashboard-tabs">
                <nav className="tabs-nav" aria-label="Tabs">
                    {['overview', 'orders', 'returns', 'warranty', 'reports'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab === 'returns' ? 'Returns & Complaints' : tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="platform-content">
                {renderTabContent()}
            </div>
        </section>
    );
}

function OverviewTab({ platformName, setActiveTab }: { platformName: string, setActiveTab: (tab: string) => void }) {
    return (
        <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card card-blue">
                <div className="stat-card-header">
                    <div className="stat-icon-wrapper"><i className="fas fa-shopping-cart"></i></div>
                    <div className="stat-badge">Orders</div>
                </div>
                <div className="stat-card-body">
                    <h3 className="stat-number">1,245</h3>
                    <p className="stat-label">Total {platformName} Orders</p>
                </div>
                <div className="stat-card-footer">
                    <button className="stat-action-btn" onClick={() => setActiveTab('orders')}>
                        View Orders <i className="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            <div className="dashboard-stat-card card-green">
                <div className="stat-card-header">
                    <div className="stat-icon-wrapper"><i className="fas fa-wallet"></i></div>
                    <div className="stat-badge">Revenue</div>
                </div>
                <div className="stat-card-body">
                    <h3 className="stat-number">AED 45.2k</h3>
                    <p className="stat-label">{platformName} Revenue</p>
                </div>
                <div className="stat-card-footer">
                    <button className="stat-action-btn" onClick={() => setActiveTab('reports')}>
                        View Reports <i className="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            <div className="dashboard-stat-card card-orange">
                <div className="stat-card-header">
                    <div className="stat-icon-wrapper"><i className="fas fa-undo"></i></div>
                    <div className="stat-badge">Returns</div>
                </div>
                <div className="stat-card-body">
                    <h3 className="stat-number">12</h3>
                    <p className="stat-label">Pending Returns</p>
                </div>
                <div className="stat-card-footer">
                    <button className="stat-action-btn" onClick={() => setActiveTab('returns')}>
                        Manage Returns <i className="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            <div className="dashboard-stat-card card-red">
                <div className="stat-card-header">
                    <div className="stat-icon-wrapper"><i className="fas fa-shield-alt"></i></div>
                    <div className="stat-badge">Warranty</div>
                </div>
                <div className="stat-card-body">
                    <h3 className="stat-number">5</h3>
                    <p className="stat-label">Active Claims</p>
                </div>
                <div className="stat-card-footer">
                    <button className="stat-action-btn" onClick={() => setActiveTab('warranty')}>
                        Manage Warranty <i className="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

function OrdersTab({ platformName }: { platformName: string }) {
    return (
        <div className="table-container">
            <div className="table-header-ui">
                <h3>Recent Orders</h3>
                <button className="sync-btn">
                    <i className="fas fa-sync-alt"></i> Sync Data
                </button>
            </div>
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Mock Rows */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
                                <td className="order-id">#{platformName.substring(0, 2).toUpperCase()}-2024-{1000 + i}</td>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar-small">
                                            U{i}
                                        </div>
                                        <span>User {i}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${i % 2 === 0 ? 'delivered' : 'processing'}`}>
                                        {i % 2 === 0 ? 'Delivered' : 'Processing'}
                                    </span>
                                </td>
                                <td>AED {1500 + i * 100}</td>
                                <td>Dec {10 - i}, 2024</td>
                                <td>
                                    <button className="action-btn-cell"><i className="fas fa-eye"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ReturnsTab({ platformName }: { platformName: string }) {
    return (
        <div className="table-container">
            <div className="table-header-ui">
                <h3>Returns & Complaints</h3>
            </div>
            <div className="empty-tab-state">
                <i className="fas fa-undo empty-icon"></i>
                <p>No active return requests from {platformName} at the moment.</p>
            </div>
        </div>
    );
}

function WarrantyTab({ platformName }: { platformName: string }) {
    return (
        <div className="table-container">
            <div className="table-header-ui">
                <h3>Warranty Management</h3>
            </div>
            <div className="empty-tab-state">
                <i className="fas fa-shield-alt empty-icon"></i>
                <p>Warranty claims and extended service requests for {platformName} items will appear here.</p>
            </div>
        </div>
    );
}

function ReportsTab({ platformName }: { platformName: string }) {
    return (
        <div className="grid-2-col">
            <div className="report-card">
                <h3>Sales Performance</h3>
                <div className="chart-placeholder">
                    [Sales Chart Placeholder]
                </div>
            </div>
            <div className="report-card">
                <h3>Return Rate Analysis</h3>
                <div className="chart-placeholder">
                    [Return Rate Chart Placeholder]
                </div>
            </div>
        </div>
    );
}
