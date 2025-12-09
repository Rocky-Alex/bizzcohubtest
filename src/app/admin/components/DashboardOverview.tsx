import React from "react";

interface DashboardOverviewProps {
    setActiveSection: (section: string) => void;
    // Props for future real data
    orders?: any[];
    customers?: any[];
    laptops?: any[];
}

export default function DashboardOverview({
    setActiveSection,
    laptops = []
}: DashboardOverviewProps) {
    const stats = {
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        lowStockItems: laptops.filter(laptop => (laptop.stock || 0) < 5).length
    };

    return (
        <section className="admin-section active">
            <div className="section-header">
                <h2>
                    <i className="fas fa-tachometer-alt"></i> Dashboard Overview
                </h2>
                <p>Real-time overview of your business performance</p>
            </div>

            <div className="dashboard-stats-grid">
                <div className="dashboard-stat-card card-blue">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper"><i className="fas fa-shopping-cart"></i></div>
                        <div className="stat-badge">Orders</div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-number">{stats.totalOrders}</h3>
                        <p className="stat-label">Total Orders This Month</p>
                    </div>
                    <div className="stat-card-footer">
                        <button className="stat-action-btn" onClick={() => setActiveSection('orders')}>
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
                        <h3 className="stat-number">AED {stats.totalRevenue}</h3>
                        <p className="stat-label">Total Revenue This Month</p>
                    </div>
                    <div className="stat-card-footer">
                        <button className="stat-action-btn" onClick={() => setActiveSection('reports')}>
                            View Reports <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div className="dashboard-stat-card card-orange">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper"><i className="fas fa-users"></i></div>
                        <div className="stat-badge">Customers</div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-number">{stats.totalCustomers}</h3>
                        <p className="stat-label">Active Customers</p>
                    </div>
                    <div className="stat-card-footer">
                        <button className="stat-action-btn" onClick={() => setActiveSection('customers')}>
                            View Customers <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div className="dashboard-stat-card card-red">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper"><i className="fas fa-exclamation-triangle"></i></div>
                        <div className="stat-badge">Alerts</div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-number">{stats.lowStockItems}</h3>
                        <p className="stat-label">Low Stock Items</p>
                    </div>
                    <div className="stat-card-footer">
                        <button className="stat-action-btn" onClick={() => setActiveSection('products')}>
                            Manage Inventory <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-quick-actions">
                <div className="section-title">
                    <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                    <p>Fast access to common tasks</p>
                </div>
                <div className="quick-actions-grid">
                    <button className="quick-action-card action-primary" onClick={() => setActiveSection('orders')}>
                        <div className="action-icon"><i className="fas fa-plus-circle"></i></div>
                        <div className="action-content">
                            <h4>Create Order</h4>
                            <p>Process a new sale</p>
                        </div>
                    </button>
                    <button className="quick-action-card action-success" onClick={() => setActiveSection('products')}>
                        <div className="action-icon"><i className="fas fa-box"></i></div>
                        <div className="action-content">
                            <h4>Add Product</h4>
                            <p>Add new inventory item</p>
                        </div>
                    </button>
                    <button className="quick-action-card action-purple" onClick={() => setActiveSection('invoicing')}>
                        <div className="action-icon"><i className="fas fa-file-invoice"></i></div>
                        <div className="action-content">
                            <h4>New Invoice</h4>
                            <p>Generate customer invoice</p>
                        </div>
                    </button>
                    <button className="quick-action-card action-info" onClick={() => setActiveSection('reports')}>
                        <div className="action-icon"><i className="fas fa-download"></i></div>
                        <div className="action-content">
                            <h4>Export Report</h4>
                            <p>Download monthly data</p>
                        </div>
                    </button>
                </div>
            </div>
        </section>
    );
}
