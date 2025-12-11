"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import DashboardOverview from "./components/DashboardOverview";
import LogoutModal from "./components/LogoutModal";
import PlatformDashboard from "./components/PlatformDashboard";
import AdminTable from "./components/AdminTable";
import AdminForm from "./components/AdminForm";
import UserManagement from "./components/UserManagement";
import RolesAndPermissions from "./components/RolesAndPermissions";
import InvoicingDashboard from "./components/InvoicingDashboard";
import CustomerList from "./components/CustomerList";
import ComingSoon from "./components/ComingSoon";
import "./styles/admin.css";
import "./styles/modern-sidebar.css";
import "./styles/dashboard.css";
import "./styles/admin-header.css";

export default function AdminPage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("dashboard");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState("accountant");
    const [username, setUsername] = useState("Admin");
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Placeholder data state (to be replaced with real data fetching)
    const [laptops, setLaptops] = useState<any[]>([]);

    // --- Mock Data for Tables ---
    const initialProducts = [
        { id: "P001", name: "MacBook Pro M3", category: "Laptop", stock: 12, price: "$1299" },
        { id: "P002", name: "Dell XPS 15", category: "Laptop", stock: 8, price: "$1199" },
        { id: "P003", name: "Logitech MX Master 3", category: "Accessory", stock: 45, price: "$99" },
    ];

    const initialOrders = [
        { id: "ORD-7829", customer: "John Doe", total: "$1299", status: "Processing", date: "2024-11-20" },
        { id: "ORD-7830", customer: "Jane Smith", total: "$99", status: "Shipped", date: "2024-11-21" },
    ];

    const initialCustomers = [
        { id: "C001", name: "John Doe", email: "john@example.com", group: "Retail", orders: 5 },
        { id: "C002", name: "Jane Smith", email: "jane@example.com", group: "Wholesale", orders: 12 },
    ];

    const initialProduction = [
        { id: "PRD-001", item: "Custom PC Build", stage: "Assembly", deadline: "2024-12-15", priority: "High" },
        { id: "PRD-002", item: "Laptop Refurbishment", stage: "Testing", deadline: "2024-12-10", priority: "Medium" },
    ];

    const initialInvoices = [
        { id: "INV-2024-001", customer: "John Doe", amount: "$1299", status: "Paid", dueDate: "2024-12-01" },
        { id: "INV-2024-002", customer: "Tech Corp", amount: "$5000", status: "Pending", dueDate: "2024-12-15" },
    ];

    const initialTransactions = [
        { id: "TRX-9988", type: "Income", amount: "$1299", category: "Sales", date: "2024-12-05" },
        { id: "TRX-9989", type: "Expense", amount: "$450", category: "Utilities", date: "2024-12-06" },
    ];

    const initialUsers: any[] = [];

    // Roles state initialized empty, will fetch from API
    const [roles, setRoles] = useState<any[]>([]);

    const [products, setProducts] = useState(initialProducts);
    const [orders, setOrders] = useState(initialOrders);
    const [customers, setCustomers] = useState(initialCustomers);
    const [production, setProduction] = useState(initialProduction);
    const [invoices, setInvoices] = useState(initialInvoices);
    const [transactions, setTransactions] = useState(initialTransactions);
    const [users, setUsers] = useState(initialUsers);

    // --- generic Handlers ---
    const fetchRoles = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/roles');
            if (response.ok) {
                const data = await response.json();
                // Transform if needed to match Role interface { id, name, createOn }
                const formattedRoles = data.roles.map((r: any) => ({
                    id: r.id.toString(),
                    name: r.name,
                    createOn: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                }));
                setRoles(formattedRoles);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    }, []);

    const handleAddRole = async (roleName: string) => {
        try {
            const response = await fetch('/api/admin/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: roleName })
            });

            if (response.ok) {
                fetchRoles(); // Refresh list
            } else {
                alert('Failed to create role');
            }
        } catch (error) {
            console.error('Error creating role:', error);
            alert('Error creating role');
        }
    };
    const handleEdit = async (item: any, type: string) => {
        if (type === 'User') {
            try {
                let avatarUrl = item.avatar || null;

                // If there's a new image file, try to upload it to ImageKit
                if (item.image && item.image instanceof File) {
                    try {
                        const formData = new FormData();
                        formData.append('file', item.image);
                        formData.append('folder', 'User Profile');
                        formData.append('fileName', item.name.replace(/\s+/g, '_'));

                        const uploadResponse = await fetch('/api/imagekit/upload', {
                            method: 'POST',
                            body: formData
                        });

                        if (uploadResponse.ok) {
                            const uploadData = await uploadResponse.json();
                            avatarUrl = uploadData.url;
                            console.log('Image uploaded successfully:', avatarUrl);
                        } else {
                            console.error('Failed to upload image, continuing with existing avatar');
                            // Continue with existing avatar
                        }
                    } catch (uploadError) {
                        console.error('Image upload error:', uploadError);
                        // Continue with existing avatar
                    }
                }

                const response = await fetch('/api/admin/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: item.id,
                        email: item.email,
                        phone: item.phone,
                        role: item.role,
                        status: item.status.toLowerCase(),
                        avatar: avatarUrl,
                        ...(item.password && { password: item.password })
                    })
                });

                if (response.ok) {
                    console.log('User updated successfully');
                    // Refresh users list
                    fetchUsers();
                } else {
                    const error = await response.json();
                    alert(`Failed to update user: ${error.error}`);
                }
            } catch (error) {
                console.error('Error updating user:', error);
                alert('Failed to update user');
            }
        } else {
            alert(`Edit ${type}: ${item.id || item.name} (Implementation Pending)`);
        }
    };

    const handleDelete = async (item: any, type: string) => {
        if (confirm(`Are you sure you want to delete ${type}: ${item.id || item.name}?`)) {
            if (type === 'User') {
                try {
                    const response = await fetch(`/api/admin/users?id=${item.id}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        // Refresh users list
                        fetchUsers();
                    } else {
                        const error = await response.json();
                        alert(`Failed to delete user: ${error.error}`);
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                    alert('Failed to delete user');
                }
            } else if (type === 'Product') setProducts(prev => prev.filter(p => p.id !== item.id));
            else if (type === 'Order') setOrders(prev => prev.filter(o => o.id !== item.id));
            else if (type === 'Customer') setCustomers(prev => prev.filter(c => c.id !== item.id));
            else if (type === 'Production') setProduction(prev => prev.filter(p => p.id !== item.id));
            else if (type === 'Invoice') setInvoices(prev => prev.filter(i => i.id !== item.id));
            else if (type === 'Transaction') setTransactions(prev => prev.filter(t => t.id !== item.id));
        }
    };

    const handleAddSubmit = (data: any, type: string) => {
        console.log("Adding", type, data);
        if (type === 'Product') {
            setProducts([...products, { id: `P${Date.now()}`, ...data, price: `$${data.price}`, stock: Number(data.stock) }]);
            setActiveSection('products-list');
        } else if (type === 'Order') {
            setOrders([...orders, { id: `ORD-${Math.floor(Math.random() * 1000)}`, ...data, date: new Date().toISOString().split('T')[0] }]);
            setActiveSection('orders-all');
        } else if (type === 'Customer') {
            setCustomers([...customers, { id: `C${Date.now()}`, ...data }]);
            setActiveSection('customers-all');
        } else if (type === 'Production') {
            setProduction([...production, { id: `PRD-${Date.now()}`, ...data }]);
            setActiveSection('production-pipeline');
        } else if (type === 'Invoice') {
            setInvoices([...invoices, { id: `INV-${Date.now()}`, ...data, status: 'Pending' }]);
            setActiveSection('invoicing-all');
        } else if (type === 'Transaction') {
            setTransactions([...transactions, { id: `TRX-${Date.now()}`, ...data }]);
            setActiveSection('accounting-transactions');
        } else if (type === 'User') {
            setUsers([...users, { id: `U${Date.now()}`, phone: data.phone || '', ...data, status: 'Active' }]);
            setActiveSection('users-all');
        }
    };

    // Fetch users from database - defined before useEffect
    const fetchUsers = useCallback(async () => {
        try {
            console.log('Fetching users from API...');
            const response = await fetch('/api/admin/users');
            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Fetched users data:', data);

                // Transform database users to match the UI format
                const transformedUsers = data.users.map((user: any) => ({
                    id: user.id.toString(),
                    name: user.username,
                    phone: user.phone || '',
                    email: user.email || '',
                    role: user.role,
                    status: user.status === 'active' ? 'Active' : 'Inactive',
                    avatar: user.avatar || undefined
                }));

                console.log('Transformed users:', transformedUsers);
                setUsers(transformedUsers);
            } else {
                console.error('Failed to fetch users, status:', response.status);
                try {
                    const errorData = await response.json();
                    console.error('Error data:', errorData);
                } catch (e) {
                    console.error('Could not parse error response');
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }, []);


    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('Checking authentication...');
                const response = await fetch('/api/auth/session');
                console.log('Auth response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Auth data:', data);
                    console.log('User role:', data.role);

                    if (data.authenticated) {
                        setIsAuthenticated(true);
                        setUserRole(data.role || 'accountant');
                        setUsername(data.user?.name || 'Admin');

                        if (data.role?.toLowerCase() === 'admin') {
                            console.log('User is admin, fetching users and roles...');
                            fetchUsers();
                            fetchRoles();
                        } else {
                            console.log('User is not admin, role is:', data.role);
                        }
                    } else {
                        console.log('Not authenticated, redirecting to login');
                        router.push('/admin/login');
                    }
                } else {
                    console.log('Auth check failed, redirecting to login');
                    router.push('/admin/login');
                }
            } catch (error) {
                console.error("Auth check failed", error);
                router.push('/admin/login');
            }
        };
        checkAuth();
    }, [router, fetchUsers, fetchRoles]);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/admin/login');
        }
    };

    if (!isAuthenticated) return null;

    const renderPlaceholder = (title: string, icon: string, description: string) => (
        <div className="admin-section active">
            <div className="section-header">
                <h2><i className={`fas ${icon}`}></i> {title}</h2>
                <p>{description}</p>
            </div>
            <div className="empty-state-dashboard">
                <i className={`fas ${icon}`}></i>
                <p>{title} module is currently under development.</p>
            </div>
        </div>
    );

    const renderContent = () => {
        // --- Under Construction Sections ---
        if (activeSection.startsWith("amazon")) {
            return <ComingSoon title="Amazon Integration" description="Amazon seller integration functionalities are coming soon." />;
        }
        if (activeSection.startsWith("noon")) {
            return <ComingSoon title="Noon Integration" description="Noon seller integration functionalities are coming soon." />;
        }
        if (activeSection.startsWith("orders")) {
            return <ComingSoon title="Order Management" description="Advanced order processing and tracking features will be available here." />;
        }
        if (activeSection.startsWith("products")) {
            return <ComingSoon title="Product Management" description="Centralized product catalog and inventory management is under development." />;
        }
        if (activeSection.startsWith("accessories")) {
            return <ComingSoon title="Accessories" description="Management for accessories inventory and sales is coming soon." />;
        }
        if (activeSection.startsWith("production")) {
            return <ComingSoon title="Production" description="Manufacturing pipeline and assembly tracking will be implemented here." />;
        }
        if (activeSection.startsWith("reports")) {
            return <ComingSoon title="Reports & Analytics" description="Comprehensive data analytics and reporting features are coming soon." />;
        }
        if (activeSection.startsWith("accounting")) {
            return <ComingSoon title="Accounting" description="Financial transactions and ledger management features are in progress." />;
        }

        // --- Active Sections ---
        switch (activeSection) {
            case "dashboard":
                return <DashboardOverview setActiveSection={setActiveSection} laptops={laptops} />;

            // --- Customers ---
            case "customers-all":
                return <CustomerList
                    onAdd={() => setActiveSection('customers-groups')}
                />;

            // --- Invoicing (Billing) ---
            case "invoicing-dashboard":
                return <InvoicingDashboard />;
            case "invoicing-all":
                return <AdminTable
                    title="All Invoices"
                    columns={["ID", "Customer", "Amount", "Status", "DueDate"]}
                    data={invoices}
                    onEdit={(item: any) => handleEdit(item, 'Invoice')}
                    onDelete={(item: any) => handleDelete(item, 'Invoice')}
                    onAdd={() => setActiveSection('invoicing-new')}
                    addLabel="Create Invoice"
                />;
            case "invoicing-new":
                return <AdminForm
                    title="Create Invoice"
                    fields={[
                        { name: "customer", label: "Customer", type: "text" },
                        { name: "amount", label: "Amount ($)", type: "number" },
                        { name: "dueDate", label: "Due Date", type: "date" }
                    ]}
                    onSubmit={(data) => handleAddSubmit(data, 'Invoice')}
                    onCancel={() => setActiveSection('invoicing-all')}
                />;

            // --- Users ---
            case "users-all":
                return <UserManagement
                    users={users}
                    onEdit={(item: any) => handleEdit(item, 'User')}
                    onDelete={(item: any) => handleDelete(item, 'User')}
                    onAdd={async (userData: any) => {
                        try {
                            console.log('Received userData:', userData);
                            console.log('Avatar from userData:', userData.avatar);

                            let avatarUrl = userData.avatar || null;

                            // If there's a new image file, try to upload it to ImageKit
                            if (userData.image && userData.image instanceof File) {
                                try {
                                    const formData = new FormData();
                                    formData.append('file', userData.image);
                                    formData.append('folder', 'User Profile');
                                    formData.append('fileName', userData.name.replace(/\s+/g, '_'));

                                    const uploadResponse = await fetch('/api/imagekit/upload', {
                                        method: 'POST',
                                        body: formData
                                    });

                                    if (uploadResponse.ok) {
                                        const uploadData = await uploadResponse.json();
                                        avatarUrl = uploadData.url;
                                        console.log('Image uploaded successfully:', avatarUrl);
                                    } else {
                                        console.error('Failed to upload image, continuing without uploaded image');
                                        // Continue without the uploaded image, use avatar URL if available
                                    }
                                } catch (uploadError) {
                                    console.error('Image upload error:', uploadError);
                                    // Continue without the uploaded image
                                }
                            }

                            console.log('Creating user with avatar:', avatarUrl);

                            const response = await fetch('/api/admin/users', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    username: userData.name,
                                    password: userData.password || 'defaultPassword123',
                                    email: userData.email,
                                    phone: userData.phone,
                                    role: userData.role.toLowerCase(),
                                    status: userData.status.toLowerCase(),
                                    avatar: avatarUrl
                                })
                            });

                            if (response.ok) {
                                console.log('User created successfully');
                                // Refresh users list
                                fetchUsers();
                            } else {
                                const error = await response.json();
                                console.error('API Error:', error);
                                alert(`Failed to add user: ${error.error}\n${error.details || ''}`);
                            }
                        } catch (error) {
                            console.error('Error adding user:', error);
                            alert('Failed to add user');
                        }
                    }}
                    availableRoles={roles.map(r => r.name)}
                />;

            case "users-roles":
                return <RolesAndPermissions
                    roles={roles}
                    onAddRole={handleAddRole}
                />;

            default:
                // Fallback for any other specific cases
                return <ComingSoon title={activeSection.replace('-', ' ').toUpperCase()} />;
        }
    };

    return (
        <div className="admin-body">
            <div className="admin-container">
                <AdminSidebar
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    onLogout={handleLogout}
                    userRole={userRole}
                    username={username}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <AdminHeader onLogout={handleLogout} />
                    <main className="admin-content">
                        {renderContent()}
                    </main>
                </div>
            </div>
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </div>
    );
}
