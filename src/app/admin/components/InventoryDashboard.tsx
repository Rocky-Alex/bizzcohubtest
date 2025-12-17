import React from 'react';
import './InvoicingDashboard.css'; // Reusing the same styles for consistency

interface InventoryDashboardProps {
    setActiveSection: (section: string) => void;
}

export default function InventoryDashboard({ setActiveSection }: InventoryDashboardProps) {
    const [stats, setStats] = React.useState({
        totalProducts: 0,
        totalAccessories: 0,
        lowStockItems: 0,
        totalValue: 0,
        trends: {
            products: 0,
            accessories: 0,
            stock: 0,
            value: 0
        }
    });

    const fetchStats = React.useCallback(async () => {
        try {
            const response = await fetch('/api/admin/inventory/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching inventory stats:', error);
        }
    }, []);

    // Initial Fetch
    React.useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Auto Refresh Logic
    React.useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const setupAutoRefresh = () => {
            const enabled = localStorage.getItem('autoRefreshEnabled') === 'true';
            if (!enabled) {
                if (intervalId) clearInterval(intervalId);
                return;
            }

            const h = parseInt(localStorage.getItem('autoRefreshHours') || '0');
            const m = parseInt(localStorage.getItem('autoRefreshMinutes') || '0');
            const s = parseInt(localStorage.getItem('autoRefreshSeconds') || '0');
            const totalMs = (h * 3600 + m * 60 + s) * 1000;

            if (totalMs > 0) {
                if (intervalId) clearInterval(intervalId);
                intervalId = setInterval(() => {
                    fetchStats();
                    // Update timestamp so settings component knows
                    localStorage.setItem('lastAutoRefresh', Date.now().toString());
                }, totalMs);
            }
        };

        setupAutoRefresh();

        const handleSettingsChange = () => {
            setupAutoRefresh();
        };

        window.addEventListener('autoRefreshSettingsChanged', handleSettingsChange);
        return () => {
            window.removeEventListener('autoRefreshSettingsChanged', handleSettingsChange);
            if (intervalId) clearInterval(intervalId);
        };
    }, [fetchStats]);

    const renderTrend = (value: number) => {
        if (!value) return (
            <div className="stat-trend neutral">
                <i className="fas fa-minus"></i> 0%
            </div>
        );
        if (value > 0) return (
            <div className="stat-trend positive" style={{ color: '#16a34a', background: '#dcfce7' }}>
                <i className="fas fa-arrow-up"></i> {value.toFixed(1)}%
            </div>
        );
        return (
            <div className="stat-trend negative" style={{ color: '#dc2626', background: '#fee2e2' }}>
                <i className="fas fa-arrow-down"></i> {Math.abs(value).toFixed(1)}%
            </div>
        );
    };

    return (
        <div className="billing-dashboard-container">
            {/* Stats Overview */}
            <div className="billing-stats-grid">
                {/* Total Products */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                            <i className="fas fa-box-open"></i>
                        </div>
                        {renderTrend(stats.trends.products)}
                    </div>
                    <div className="stat-content">
                        <h3>Total Products</h3>
                        <p className="stat-value">{stats.totalProducts}</p>
                    </div>
                </div>

                {/* Total Accessories */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
                            <i className="fas fa-keyboard"></i>
                        </div>
                        {renderTrend(stats.trends.accessories)}
                    </div>
                    <div className="stat-content">
                        <h3>Total Accessories</h3>
                        <p className="stat-value">{stats.totalAccessories}</p>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                        {renderTrend(stats.trends.stock)}
                    </div>
                    <div className="stat-content">
                        <h3>Low Stock Items</h3>
                        <p className="stat-value">{stats.lowStockItems}</p>
                    </div>
                </div>

                {/* Total Inventory Value */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
                            <i className="fas fa-coins"></i>
                        </div>
                        {renderTrend(stats.trends.value)}
                    </div>
                    <div className="stat-content">
                        <h3>Est. Value</h3>
                        <p className="stat-value">AED {stats.totalValue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <h3 className="quick-actions-header">Quick Actions</h3>
                <div className="quick-actions-grid">
                    <div className="quick-action-card" onClick={() => setActiveSection('products-add')}>
                        <div className="quick-action-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                            <i className="fas fa-plus"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Add Product</span>
                            <span className="quick-action-desc">Add new item to inventory</span>
                        </div>
                    </div>



                    <div className="quick-action-card" onClick={() => setActiveSection('products-list')}>
                        <div className="quick-action-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                            <i className="fas fa-list"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Product List</span>
                            <span className="quick-action-desc">View all products</span>
                        </div>
                    </div>

                    <div className="quick-action-card" onClick={() => setActiveSection('reports-inventory')}>
                        <div className="quick-action-icon" style={{ background: '#ffedd5', color: '#c2410c' }}>
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Inventory Report</span>
                            <span className="quick-action-desc">View stock analytics</span>
                        </div>
                    </div>

                    <div className="quick-action-card" onClick={() => setActiveSection('products-import')}>
                        <div className="quick-action-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                            <i className="fas fa-file-import"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Import Products</span>
                            <span className="quick-action-desc">Upload from CSV/Excel</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
