"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import AdminSidebar from "../../components/admin/AdminSidebar";
import DashboardStats from "../../components/admin/DashboardStats";
import ProductForm from "../../components/admin/ProductForm";
import ProductList from "../../components/admin/ProductList";
import SettingsManager from "../../components/admin/SettingsManager";
import InventoryManager from "../../components/admin/InventoryManager";
import UserManager from "../../components/admin/UserManager";
import ProfileMenu from "../../components/admin/ProfileMenu";
import "./admin.css";
import "./admin-layout-fix.css";
import "./admin-modern.css";
import "./inventory.css";
import "./dashboard.css";
import "./inventory-modern.css";
import "./inventory-stats.css";
import "./inventory-filters.css";
import "./product-table.css";

export default function AdminPage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("dashboard");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState("accountant");
    const [username, setUsername] = useState("Admin");

    // Product Management State
    const [laptops, setLaptops] = useState<any[]>([]);
    const [accessories, setAccessories] = useState<any[]>([]);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    useEffect(() => {
        // Check authentication via API
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated) {
                        setIsAuthenticated(true);
                        const role = data.role || 'accountant';
                        setUserRole(role);

                        // Set default section based on role
                        if (role === 'accountant') {
                            setActiveSection('billing');
                            // If we are on the main admin page, we might want to redirect to /billing directly
                            // But since this is a single page app structure for admin, we just set the section
                            // However, the sidebar handles navigation to /billing for the billing item
                            // So we should probably just redirect to /billing if that's how it works
                            router.push('/billing');
                            return;
                        }

                        loadProducts();
                    } else {
                        router.push('/admin/login');
                    }
                } else {
                    router.push('/admin/login');
                }
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/admin/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                const loadedLaptops = data.products.filter((p: any) => p.type === 'laptop');
                const loadedAccessories = data.products.filter((p: any) => p.type === 'accessory');
                setLaptops(loadedLaptops);
                setAccessories(loadedAccessories);
            } else {
                console.error('Failed to load products from database');
                // Fallback to localStorage for backward compatibility
                const loadedLaptops = JSON.parse(localStorage.getItem("bchLaptops") || "[]");
                const loadedAccessories = JSON.parse(localStorage.getItem("bchAccessories") || "[]");
                setLaptops(loadedLaptops);
                setAccessories(loadedAccessories);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            alert('⚠️ Failed to load products from database. Check console for details.');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleLogout = async () => {
        if (confirm("Are you sure you want to logout?")) {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/admin/login');
            } catch (error) {
                console.error('Logout error:', error);
                router.push('/admin/login');
            }
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const handleDelete = async (code: string, type: "laptop" | "accessory") => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                const response = await fetch(`/api/products?code=${encodeURIComponent(code)}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    await loadProducts();
                    alert('✅ Product deleted successfully!');
                } else {
                    const error = await response.json();
                    alert(`⚠️ Failed to delete product: ${error.error}`);
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('⚠️ Failed to delete product. Check console for details.');
            }
        }
    };

    const handleClearAll = async (type: "laptop" | "accessory") => {
        if (
            confirm(
                `⚠️ WARNING: This will delete ALL ${type}s! This action cannot be undone. Are you sure?`
            )
        ) {
            try {
                const productsToDelete = type === "laptop" ? laptops : accessories;
                const deletePromises = productsToDelete.map(p =>
                    fetch(`/api/products?code=${encodeURIComponent(p.code)}`, {
                        method: 'DELETE',
                    })
                );
                await Promise.all(deletePromises);
                await loadProducts();
                alert(`✅ All ${type}s deleted successfully!`);
            } catch (error) {
                console.error('Error clearing products:', error);
                alert('⚠️ Failed to clear products. Check console for details.');
            }
        }
    };

    const handleSaveProduct = () => {
        loadProducts();
        setShowForm(false);
        setEditingItem(null);
        alert("✅ Product saved successfully!");
    };

    // --- LAPTOP FUNCTIONS ---
    const exportLaptops = () => {
        if (laptops.length === 0) {
            alert("No laptops to export!");
            return;
        }

        const data = laptops.map((p: any) => ({
            ID: p.code,
            Name: p.name,
            Brand: p.brand || "N/A",
            Price: p.price,
            OfferPrice: p.offerPrice || p.price,
            Stock: p.stock || 0,
            Condition: p.condition || "N/A",
            Category: "Laptop",
            Processor: p.processor || "N/A",
            RAM: p.ram || "N/A",
            Storage: p.storage || "N/A",
            Screen: p.screen || "N/A",
            Graphics: p.graphics || "N/A",
            GraphicsStorage: p.graphicsStorage || "N/A",
            Feature: p.feature || "N/A",
            About: p.about || "N/A",
            Features: p.features || "N/A",
            Badge: p.badge || "N/A",
            DateAdded: p.dateAdded || new Date().toISOString().split("T")[0],
            Image: p.image || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laptops");
        XLSX.writeFile(workbook, `laptops_${new Date().toISOString().split("T")[0]}.xlsx`);
        alert(`✅ Exported ${laptops.length} laptops successfully!`);
    };

    const downloadLaptopTemplate = () => {
        const demoData = [{
            ID: "LAP001",
            Name: "Dell Latitude 5420",
            Brand: "Dell",
            Price: 45000,
            OfferPrice: 40000,
            Stock: 10,
            Condition: "Refurbished",
            Processor: "Intel i5 11th Gen",
            RAM: "16GB",
            Storage: "512GB SSD",
            Screen: "14 inch FHD",
            Graphics: "Intel Iris Xe",
            GraphicsStorage: "Shared",
            Feature: "Touchscreen",
            About: "High performance business laptop",
            Features: "Backlit Keyboard, Fingerprint Reader",
            Badge: "Best Seller",
            DateAdded: new Date().toISOString().split("T")[0],
            Image: "https://example.com/image.jpg",
        }];

        const worksheet = XLSX.utils.json_to_sheet(demoData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laptops");
        XLSX.writeFile(workbook, "laptop_template.xlsx");
    };

    const importLaptops = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                const imported = jsonData.map((product: any, index: number) => ({
                    code: product.ID || `IMP${Date.now()}${index}`,
                    name: product.Name,
                    type: "laptop",
                    category: product.Brand || "Laptop",
                    brand: product.Brand,
                    price: parseFloat(product.Price) || 0,
                    offerPrice: parseFloat(product.OfferPrice) || parseFloat(product.Price) || 0,
                    stock: parseInt(product.Stock) || 0,
                    condition: product.Condition || "New",
                    processor: product.Processor || "",
                    ram: product.RAM || "",
                    storage: product.Storage || "",
                    screen: product.Screen || "",
                    graphics: product.Graphics || "",
                    graphicsStorage: product.GraphicsStorage || "",
                    feature: product.Feature || "",
                    about: product.About || "",
                    features: product.Features || "",
                    badge: product.Badge || product.Condition || "New",
                    image: product.Image || "",
                    discount: product.Discount ? parseInt(product.Discount) : Math.round(
                        ((parseFloat(product.Price) - (parseFloat(product.OfferPrice) || parseFloat(product.Price))) / parseFloat(product.Price)) * 100
                    ) || 0,
                }));

                const response = await fetch('/api/products/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ products: imported }),
                });

                if (response.ok) {
                    const result = await response.json();
                    await loadProducts();
                    alert(`✅ Successfully imported ${result.imported} laptops!`);
                } else {
                    const error = await response.json();
                    alert(`⚠️ Failed to import laptops: ${error.error}`);
                }
            } catch (error) {
                console.error('Error importing laptops:', error);
                alert('⚠️ Failed to import laptops. Check console for details.');
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = "";
    };

    // --- ACCESSORY FUNCTIONS ---
    const exportAccessories = () => {
        if (accessories.length === 0) {
            alert("No accessories to export!");
            return;
        }

        const data = accessories.map((p: any) => ({
            "ID": p.code,
            "Product Image": p.image || "",
            "Product Name": p.name,
            "Category": p.category || "Accessory",
            "Badge Type": p.badge || "N/A",
            "About This Item": p.about || "N/A",
            "Features (Optional)": p.features || "N/A",
            "Actual Price (AED)": p.price,
            "Offer Price (AED)": p.offerPrice || p.price,
            "Quantity in Stock": p.stock || 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Accessories");
        XLSX.writeFile(workbook, `accessories_${new Date().toISOString().split("T")[0]}.xlsx`);
        alert(`✅ Exported ${accessories.length} accessories successfully!`);
    };

    const downloadAccessoryTemplate = () => {
        const demoData = [{
            "ID": "ACC001",
            "Product Image": "https://example.com/image.jpg",
            "Product Name": "Wireless Mouse",
            "Category": "Mouse",
            "Badge Type": "Best Seller",
            "About This Item": "Ergonomic wireless mouse",
            "Features (Optional)": "Long battery life, High precision",
            "Actual Price (AED)": 500,
            "Offer Price (AED)": 450,
            "Quantity in Stock": 50,
        }];

        const worksheet = XLSX.utils.json_to_sheet(demoData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Accessories");
        XLSX.writeFile(workbook, "accessory_template.xlsx");
    };

    const importAccessories = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                const imported = jsonData.map((product: any, index: number) => ({
                    code: product["ID"] || `IMP${Date.now()}${index}`,
                    name: product["Product Name"],
                    type: "accessory",
                    category: product["Category"] || "Accessory",
                    brand: "N/A",
                    price: parseFloat(product["Actual Price (AED)"]) || 0,
                    offerPrice: parseFloat(product["Offer Price (AED)"]) || parseFloat(product["Actual Price (AED)"]) || 0,
                    stock: parseInt(product["Quantity in Stock"]) || 0,
                    condition: "New",
                    image: product["Product Image"] || "",
                    about: product["About This Item"] || "",
                    features: product["Features (Optional)"] || "",
                    badge: product["Badge Type"] || "New",
                    processor: "N/A",
                    ram: "N/A",
                    storage: "N/A",
                    screen: "N/A",
                    graphics: "N/A",
                    graphicsStorage: "N/A",
                    feature: "",
                    discount: Math.round(
                        ((parseFloat(product["Actual Price (AED)"]) - (parseFloat(product["Offer Price (AED)"]) || parseFloat(product["Actual Price (AED)"]))) / parseFloat(product["Actual Price (AED)"])) * 100
                    ) || 0,
                }));

                const response = await fetch('/api/products/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ products: imported }),
                });

                if (response.ok) {
                    const result = await response.json();
                    await loadProducts();
                    alert(`✅ Successfully imported ${result.imported} accessories!`);
                } else {
                    const error = await response.json();
                    alert(`⚠️ Failed to import accessories: ${error.error}`);
                }
            } catch (error) {
                console.error('Error importing accessories:', error);
                alert('⚠️ Failed to import accessories. Check console for details.');
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = "";
    };

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const renderContent = () => {
        switch (activeSection) {
            case "dashboard":
                return <DashboardStats setActiveSection={setActiveSection} />;
            case "users":
                return <UserManager />;
            case "inventory":
                return (
                    <div className="admin-section active">
                        <InventoryManager
                            onEdit={handleEdit}
                            onDelete={(code, type) => handleDelete(code, type)}
                        />
                    </div>
                );
            case "laptops":
                return (
                    <div className="admin-section active">
                        <div className="section-header">
                            <h2>
                                <i className="fas fa-laptop"></i> Laptop Management
                            </h2>
                            <p>Add, edit, or remove laptops from your inventory</p>
                        </div>
                        {showForm ? (
                            <ProductForm
                                type="laptop"
                                editItem={editingItem}
                                onSave={handleSaveProduct}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditingItem(null);
                                }}
                            />
                        ) : (
                            <>
                                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowForm(true)}
                                    >
                                        <i className="fas fa-plus"></i> Add New Laptop
                                    </button>

                                    <button
                                        className="btn btn-secondary"
                                        onClick={downloadLaptopTemplate}
                                    >
                                        <i className="fas fa-download"></i> Download Template
                                    </button>

                                    <label className="btn btn-success">
                                        <i className="fas fa-file-import"></i> Import Excel
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx"
                                            onChange={importLaptops}
                                            style={{ display: "none" }}
                                        />
                                    </label>

                                    <button
                                        className="btn btn-primary"
                                        onClick={exportLaptops}
                                    >
                                        <i className="fas fa-file-export"></i> Export Excel
                                    </button>
                                </div>
                                <ProductList
                                    type="laptop"
                                    products={laptops}
                                    onEdit={handleEdit}
                                    onDelete={(code) => handleDelete(code, "laptop")}
                                    onClearAll={() => handleClearAll("laptop")}
                                />
                            </>
                        )}
                    </div >
                );
            case "accessories":
                return (
                    <div className="admin-section active">
                        <div className="section-header">
                            <h2>
                                <i className="fas fa-keyboard"></i> Accessory Management
                            </h2>
                            <p>Add, edit, or remove accessories from your inventory</p>
                        </div>
                        {showForm ? (
                            <ProductForm
                                type="accessory"
                                editItem={editingItem}
                                onSave={handleSaveProduct}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditingItem(null);
                                }}
                            />
                        ) : (
                            <>
                                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => setShowForm(true)}
                                    >
                                        <i className="fas fa-plus"></i> Add New Accessory
                                    </button>

                                    <button
                                        className="btn btn-secondary"
                                        onClick={downloadAccessoryTemplate}
                                    >
                                        <i className="fas fa-download"></i> Download Template
                                    </button>

                                    <label className="btn btn-success">
                                        <i className="fas fa-file-import"></i> Import Excel
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx"
                                            onChange={importAccessories}
                                            style={{ display: "none" }}
                                        />
                                    </label>

                                    <button
                                        className="btn btn-primary"
                                        onClick={exportAccessories}
                                    >
                                        <i className="fas fa-file-export"></i> Export Excel
                                    </button>
                                </div>
                                <ProductList
                                    type="accessory"
                                    products={accessories}
                                    onEdit={handleEdit}
                                    onDelete={(code) => handleDelete(code, "accessory")}
                                    onClearAll={() => handleClearAll("accessory")}
                                />
                            </>
                        )}
                    </div>
                );
            default:
                return (
                    <div className="admin-section active">
                        <div className="section-header">
                            <h2>
                                <i className="fas fa-cogs"></i> Settings
                            </h2>
                            <p>Manage your site configuration</p>
                        </div>
                        <SettingsManager activeSection={activeSection} />
                    </div>
                );
        }
    };

    return (
        <div className="admin-body">


            <div className="admin-container">
                <AdminSidebar
                    activeSection={activeSection}
                    setActiveSection={(section) => {
                        setActiveSection(section);
                        setShowForm(false);
                        setEditingItem(null);
                    }}
                    onLogout={handleLogout}
                    userRole={userRole}
                />
                <main className="admin-content">{renderContent()}</main>
            </div>
        </div>
    );
}
