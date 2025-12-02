import React, { useEffect, useState } from "react";

export default function DashboardStats({
    setActiveSection,
}: {
    setActiveSection: (section: string) => void;
}) {
    const [stats, setStats] = useState({
        laptops: 0,
        accessories: 0,
        totalStock: 0,
        lowStock: 0,
    });
    const [recentProducts, setRecentProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    const laptops = data.products.filter((p: any) => p.type === 'laptop');
                    const accessories = data.products.filter((p: any) => p.type === 'accessory');

                    const totalStock =
                        laptops.reduce((sum: number, p: any) => sum + (p.stock || 0), 0) +
                        accessories.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);

                    const lowStockLaptops = laptops.filter(
                        (p: any) => p.stock > 0 && p.stock <= 5
                    ).length;
                    const lowStockAccessories = accessories.filter(
                        (p: any) => p.stock > 0 && p.stock <= 10
                    ).length;

                    setStats({
                        laptops: laptops.length,
                        accessories: accessories.length,
                        totalStock,
                        lowStock: lowStockLaptops + lowStockAccessories,
                    });

                    const allProducts = [
                        ...laptops.map((p: any) => ({ ...p, type: "Laptop" })),
                        ...accessories.map((p: any) => ({ ...p, type: "Accessory" })),
                    ];

                    allProducts.sort(
                        (a, b) =>
                            new Date(b.date_added || b.created_at).getTime() - new Date(a.date_added || a.created_at).getTime()
                    );
                    setRecentProducts(allProducts.slice(0, 5));
                } else {
                    console.error('Failed to fetch products from API');
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);

    return (
        <section id="dashboard" className="admin-section active">
            <div className="section-header">
                <h2>
                    <i className="fas fa-tachometer-alt"></i> Dashboard Overview
                </h2>
                <p>  </p>
            </div>

            {/* Enhanced Statistics Cards */}
            <div className="dashboard-stats-grid">
                <div className="dashboard-stat-card card-blue">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper">
                            <i className="fas fa-laptop"></i>
                        </div>
                        <div className="stat-badge">Products</div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-number">{stats.laptops}</h3>
                        <p className="stat-label">Laptop Models</p>
                    </div>
                    <div className="stat-card-footer">
                        <button
                            className="stat-action-btn"
                            onClick={() => setActiveSection("laptops")}
                        >
                            Manage <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div className="dashboard-stat-card card-green">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper">
                            <i className="fas fa-keyboard"></i>
                        </div>
                        <div className="stat-badge">Products</div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-number">{stats.accessories}</h3>
                        <p className="stat-label">Accessory Models</p>
                    </div>
                    <div className="stat-card-footer">
                        <button
                            className="stat-action-btn"
                            onClick={() => setActiveSection("accessories")}
                        >
                            Manage <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div className="dashboard-stat-card card-orange">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper">
                            <i className="fas fa-box"></i>
                        </div>
                        <div className="stat-badge">Inventory</div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-number">{stats.totalStock}</h3>
                        <p className="stat-label">Total Stock Items</p>
                    </div>
                    <div className="stat-card-footer">
                        <button
                            className="stat-action-btn"
                            onClick={() => setActiveSection("inventory")}
                        >
                            View All <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div className="dashboard-stat-card card-red">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div className="stat-badge">Alerts</div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-number">{stats.lowStock}</h3>
                        <p className="stat-label">Low Stock Items</p>
                    </div>
                    <div className="stat-card-footer">
                        <button
                            className="stat-action-btn"
                            onClick={() => setActiveSection("inventory")}
                        >
                            Review <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Quick Actions */}
            <div className="dashboard-quick-actions">
                <div className="section-title">
                    <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                    <p>Frequently used operations</p>
                </div>
                <div className="quick-actions-grid">
                    <button
                        className="quick-action-card action-primary"
                        onClick={() => setActiveSection("laptops")}
                    >
                        <div className="action-icon">
                            <i className="fas fa-plus-circle"></i>
                        </div>
                        <div className="action-content">
                            <h4>Add Laptop</h4>
                            <p>Create new laptop listing</p>
                        </div>
                    </button>

                    <button
                        className="quick-action-card action-success"
                        onClick={() => setActiveSection("accessories")}
                    >
                        <div className="action-icon">
                            <i className="fas fa-plus-circle"></i>
                        </div>
                        <div className="action-content">
                            <h4>Add Accessory</h4>
                            <p>Create new accessory listing</p>
                        </div>
                    </button>

                    <button
                        className="quick-action-card action-purple"
                        onClick={() => setActiveSection("branding")}
                    >
                        <div className="action-icon">
                            <i className="fas fa-palette"></i>
                        </div>
                        <div className="action-content">
                            <h4>Customize Theme</h4>
                            <p>Change colors & branding</p>
                        </div>
                    </button>

                    <button
                        className="quick-action-card action-info"
                        onClick={() => window.open("/", "_blank")}
                    >
                        <div className="action-icon">
                            <i className="fas fa-external-link-alt"></i>
                        </div>
                        <div className="action-content">
                            <h4>View Website</h4>
                            <p>Preview live site</p>
                        </div>
                    </button>

                    {/* <button
                        className="quick-action-card action-warning"
                        onClick={() => setActiveSection("inventory")}
                    >
                        <div className="action-icon">
                            <i className="fas fa-warehouse"></i>
                        </div>
                        <div className="action-content">
                            <h4>Manage Inventory</h4>
                            <p>Stock & product management</p>
                        </div>
                    </button> */}

                    <button
                        className="quick-action-card action-dark"
                        onClick={() => setActiveSection("settings")}
                    >
                        <div className="action-icon">
                            <i className="fas fa-cog"></i>
                        </div>
                        <div className="action-content">
                            <h4>Settings</h4>
                            <p>Configure site settings</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Enhanced Recent Products */}
            <div className="dashboard-recent-products">
                <div className="section-title">
                    <h3><i className="fas fa-clock"></i> Recently Added Products</h3>
                    <p>Latest additions to your catalog</p>
                </div>
                <div className="recent-products-list">
                    {recentProducts.length > 0 ? (
                        recentProducts.map((p, index) => (
                            <div key={index} className="recent-product-card">
                                <div className="product-image-wrapper">
                                    <img src={p.image} alt={p.name} />
                                    <span className={`product-type-badge ${p.type.toLowerCase()}`}>
                                        {p.type}
                                    </span>
                                </div>
                                <div className="product-details">
                                    <h4 className="product-name">{p.name}</h4>
                                    <div className="product-meta">
                                        <span className="product-code">
                                            <i className="fas fa-barcode"></i> {p.code}
                                        </span>
                                        <span className="product-stock">
                                            <i className="fas fa-box"></i> Stock: {p.stock}
                                        </span>
                                    </div>
                                </div>
                                <div className="product-price-section">
                                    <span className="product-price">
                                        AED {(p.offer_price || 0).toLocaleString("en-IN")}
                                    </span>
                                    <button
                                        className="product-edit-btn"
                                        onClick={() => setActiveSection(p.type === "Laptop" ? "laptops" : "accessories")}
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-dashboard">
                            <i className="fas fa-inbox"></i>
                            <p>No products added yet</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setActiveSection("laptops")}
                            >
                                Add Your First Product
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
