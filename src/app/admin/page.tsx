"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import DashboardOverview from "./components/DashboardOverview";
import LogoutModal from "./components/LogoutModal";

import UserManagement from "./components/UserManagement";
import RolesAndPermissions from "./components/RolesAndPermissions";
import InvoicingDashboard from "./components/InvoicingDashboard";
import CustomerList from "./components/CustomerList";
import AddCustomerForm from "./components/AddCustomerForm";
import ComingSoon from "./components/ComingSoon";
import CreateInvoice from "./components/CreateInvoice";
import InvoiceList from "./components/InvoiceList";
import InventoryDashboard from "./components/InventoryDashboard";
import ProductList from "./components/ProductList";
import AddProduct from "./components/AddProduct";
import ImportProducts from './components/ImportProducts';
import QuickActions from './components/QuickActions';
import OrderList from './components/OrderList';
import CreateOrder from './components/CreateOrder';
import ConfirmModal from './components/ConfirmModal';
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
    const initialProducts: any[] = [];
    const initialOrders: any[] = [];
    const initialCustomers: any[] = [];
    const initialUsers: any[] = [];

    // Roles state initialized empty, will fetch from API
    const [roles, setRoles] = useState<any[]>([]);

    const [products, setProducts] = useState(initialProducts);
    const [orders, setOrders] = useState(initialOrders);
    const [customers, setCustomers] = useState(initialCustomers);

    const [users, setUsers] = useState(initialUsers);

    const [productToEdit, setProductToEdit] = useState<any>(null);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<any>(null);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger' as 'danger' | 'info' | 'success',
        singleButton: false,
        onConfirm: () => { }
    });

    // --- generic Handlers ---
    const fetchCustomers = useCallback(async () => {
        setIsLoadingCustomers(true);
        try {
            const response = await fetch('/api/admin/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setIsLoadingCustomers(false);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        setIsLoadingOrders(true);
        try {
            const response = await fetch('/api/admin/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoadingOrders(false);
        }
    }, []);

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
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Failed to create role',
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error('Error creating role:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Error creating role',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
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
                        first_name: item.firstName,
                        last_name: item.lastName,
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
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: `Failed to update user: ${error.error}`,
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            } catch (error) {
                console.error('Error updating user:', error);
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Failed to update user',
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Info',
                message: `Edit ${type}: ${item.id || item.name} (Implementation Pending)`,
                type: 'info',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleDelete = async (item: any, type: string) => {
        setConfirmModal({
            isOpen: true,
            title: `Delete ${type}`,
            message: `Are you sure you want to delete ${type}: ${item.id || item.name || item.order_number}? This action cannot be undone.`,
            type: 'danger',
            singleButton: false,
            onConfirm: async () => {
                try {
                    if (type === 'User') {
                        const response = await fetch(`/api/admin/users?id=${item.id}`, { method: 'DELETE' });
                        if (response.ok) fetchUsers();
                        else {
                            const error = await response.json();
                            setConfirmModal(prev => ({
                                ...prev, // Keep existing modal open but switch to single button error? No, close and reopen or just update
                                isOpen: true,
                                title: 'Error',
                                message: `Failed to delete user: ${error.error}`,
                                type: 'danger',
                                singleButton: true,
                                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                            }));
                            return; // Don't close modal via logic below
                        }
                    } else if (type === 'Order') {
                        try {
                            const res = await fetch(`/api/admin/orders?id=${item.id}`, { method: 'DELETE' });
                            if (res.ok) {
                                fetchOrders();
                            } else {
                                const error = await res.json();
                                setConfirmModal(prev => ({
                                    ...prev,
                                    isOpen: true,
                                    title: 'Error',
                                    message: `Failed to delete order: ${error.error}`,
                                    type: 'danger',
                                    singleButton: true,
                                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                                }));
                                return;
                            }
                        } catch (err) {
                            console.error('Error deleting order:', err);
                            setConfirmModal(prev => ({
                                ...prev,
                                isOpen: true,
                                title: 'Error',
                                message: 'Error deleting order',
                                type: 'danger',
                                singleButton: true,
                                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                            }));
                            return;
                        }
                    } else if (type === 'Product') setProducts(prev => prev.filter(p => p.id !== item.id));
                    else if (type === 'Customer') setCustomers(prev => prev.filter(c => c.id !== item.id));

                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error(`Error deleting ${type}:`, error);
                }
            }
        });
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
        } else if (type === 'User') {
            setUsers([...users, { id: `U${Date.now()}`, phone: data.phone || '', ...data, status: 'Active' }]);
            setActiveSection('users-all');
        }
    };

    // Fetch users from database - defined before useEffect
    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
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
                    name: user.username, // Display the username handle in table as requested
                    username: user.username, // Keep original username/handle
                    firstName: user.first_name,
                    lastName: user.last_name,
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
        } finally {
            setIsLoadingUsers(false);
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
                            fetchCustomers();
                            fetchOrders();
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

    // Auto-refresh for Users and Customers every 10 minutes
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isAuthenticated && userRole?.toLowerCase() === 'admin') {
            interval = setInterval(() => {
                console.log('Auto-refreshing Users and Customers...');
                fetchUsers();
                fetchCustomers();
                fetchOrders();
            }, 600000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAuthenticated, userRole, fetchUsers, fetchCustomers]);

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
        if (activeSection.startsWith("orders") && !['orders-all', 'orders-create'].includes(activeSection)) {
            return <ComingSoon title="Order Management" description="Advanced order processing and tracking features will be available here." />;
        }
        if (activeSection.startsWith("products") && !['products-add', 'products-import', 'products-list', 'products-edit'].includes(activeSection)) {
            return <ComingSoon title="Product Management" description="Centralized product catalog and inventory management is under development." />;
        }
        if (activeSection.startsWith("accessories")) {
            return <ComingSoon title="Accessories" description="Management for accessories inventory and sales is coming soon." />;
        }
        if (activeSection.startsWith("reports")) {
            return <ComingSoon title="Reports & Analytics" description="Comprehensive data analytics and reporting features are coming soon." />;
        }

        // --- Active Sections ---
        switch (activeSection) {
            case "dashboard":
                return <DashboardOverview setActiveSection={setActiveSection} laptops={laptops} />;

            // --- Customers ---


            // --- Orders ---

            // In renderContent switch:
            case "orders-all":
                return <OrderList
                    orders={orders}
                    loading={isLoadingOrders}
                    onRefresh={fetchOrders}
                    onEdit={(order) => {
                        setOrderToEdit(order);
                        setActiveSection('orders-create');
                    }}
                    onDelete={(order) => handleDelete(order, 'Order')}
                />;
            case "orders-create":
                return <CreateOrder
                    initialData={orderToEdit}
                    onOrderCreated={() => {
                        fetchOrders();
                        setOrderToEdit(null); // Reset after create/update
                        // Optionally navigate to list: setActiveSection('orders-all');
                    }}
                />;
            case "customers-all":
                return <CustomerList
                    customers={customers}
                    loading={isLoadingCustomers}
                    onAdd={() => setActiveSection('customers-add')}
                    onNavigateToNewInvoice={() => setActiveSection('invoicing-new')}
                />;
            case "customers-add":
                return <AddCustomerForm
                    onCancel={() => setActiveSection('customers-all')}
                    onSubmit={async (data) => {
                        try {
                            console.log('Submitting Customer Data:', data);

                            let avatarUrl = null;

                            // If there's an image file, upload it to ImageKit
                            if (data.image && data.image instanceof File) {
                                try {
                                    const formData = new FormData();
                                    formData.append('file', data.image);
                                    formData.append('folder', 'Customer'); // Folder name
                                    formData.append('fileName', data.name.replace(/\s+/g, '_'));

                                    const uploadResponse = await fetch('/api/imagekit/upload', {
                                        method: 'POST',
                                        body: formData
                                    });

                                    if (uploadResponse.ok) {
                                        const uploadData = await uploadResponse.json();
                                        avatarUrl = uploadData.url;
                                        console.log('Image uploaded successfully:', avatarUrl);
                                    } else {
                                        console.error('Failed to upload image', await uploadResponse.text());
                                    }
                                } catch (uploadError) {
                                    console.error('Image upload error:', uploadError);
                                }
                            }

                            const payload = { ...data, avatar: avatarUrl };
                            delete payload.image; // Do not send File object to JSON API

                            const response = await fetch('/api/admin/customers', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });

                            if (response.ok) {
                                setConfirmModal({
                                    isOpen: true,
                                    title: 'Success',
                                    message: 'Customer created successfully!',
                                    type: 'success',
                                    singleButton: true,
                                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                                });
                                fetchCustomers();
                                setActiveSection('customers-all');
                            } else {
                                const err = await response.json();
                                setConfirmModal({
                                    isOpen: true,
                                    title: 'Error',
                                    message: 'Failed to create customer: ' + (err.error || 'Unknown error'),
                                    type: 'danger',
                                    singleButton: true,
                                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                                });
                            }
                        } catch (error) {
                            console.error('Error creating customer:', error);
                            setConfirmModal({
                                isOpen: true,
                                title: 'Error',
                                message: 'An error occurred while creating the customer.',
                                type: 'danger',
                                singleButton: true,
                                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                            });
                        }
                    }}
                />;

            // --- Quick Actions ---
            case "quick-actions":
                return <QuickActions setActiveSection={setActiveSection} />;

            // --- Inventory ---
            case "inventory-dashboard":
                return <InventoryDashboard setActiveSection={setActiveSection} />;
            case "products-add":
                return <AddProduct
                    onCancel={() => setActiveSection('inventory-dashboard')}
                    onSuccess={() => setActiveSection('inventory-dashboard')}
                />;
            case "products-edit":
                return <AddProduct
                    initialData={productToEdit}
                    onCancel={() => {
                        setProductToEdit(null);
                        setActiveSection('products-list');
                    }}
                    onSuccess={() => {
                        setProductToEdit(null);
                        setActiveSection('products-list');
                    }}
                />;
            case "products-list":
                return <ProductList
                    setActiveSection={setActiveSection}
                    onEdit={(product: any) => {
                        setProductToEdit(product);
                        setActiveSection('products-edit');
                    }}
                />;
            case "products-import":
                return <ImportProducts
                    onCancel={() => setActiveSection('inventory-dashboard')}
                    onSuccess={() => setActiveSection('inventory-dashboard')}
                />;

            // --- Invoicing (Billing) ---
            case "invoicing-dashboard":
                return <InvoicingDashboard setActiveSection={setActiveSection} />;
            case "invoicing-all":
                return <InvoiceList setActiveSection={setActiveSection} />;
            case "invoicing-new":
                return <CreateInvoice setActiveSection={setActiveSection} customers={customers} />;

            // --- Users ---
            case "users-all":
                return <UserManagement
                    users={users}
                    loading={isLoadingUsers}
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
                                    formData.append('fileName', userData.userName ? userData.userName.replace(/\s+/g, '_') : 'user_avatar');

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
                                    username: userData.userName || userData.name, // Handle or Name
                                    first_name: userData.firstName,
                                    last_name: userData.lastName,
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
                                setConfirmModal({
                                    isOpen: true,
                                    title: 'Error',
                                    message: `Failed to add user: ${error.error}\n${error.details || ''}`,
                                    type: 'danger',
                                    singleButton: true,
                                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                                });
                            }
                        } catch (error) {
                            console.error('Error adding user:', error);
                            setConfirmModal({
                                isOpen: true,
                                title: 'Error',
                                message: 'Failed to add user',
                                type: 'danger',
                                singleButton: true,
                                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                            });
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
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
