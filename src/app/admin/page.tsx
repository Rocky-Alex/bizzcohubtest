"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import DashboardOverview from "./components/DashboardOverview";
// import LogoutModal from "./components/LogoutModal"; // Removed

import dynamic from "next/dynamic";
import LoadingSpinner from "../components/LoadingSpinner";

const UserManagement = dynamic(() => import("./components/UserManagement"), { loading: () => <LoadingSpinner /> });
const RolesAndPermissions = dynamic(() => import("./components/RolesAndPermissions"), { loading: () => <LoadingSpinner /> });
const InvoicingDashboard = dynamic(() => import("./components/InvoicingDashboard"), { loading: () => <LoadingSpinner /> });
const CustomerList = dynamic(() => import("./components/CustomerList"), { loading: () => <LoadingSpinner /> });
const AddCustomerForm = dynamic(() => import("./components/AddCustomerForm"), { loading: () => <LoadingSpinner /> });
const ComingSoon = dynamic(() => import("./components/ComingSoon"));
const CreateInvoice = dynamic(() => import("./components/CreateInvoice"), { loading: () => <LoadingSpinner /> });
const CreateQuotation = dynamic(() => import("./components/CreateQuotation"), { loading: () => <LoadingSpinner /> });
const InvoiceList = dynamic(() => import("./components/InvoiceList"), { loading: () => <LoadingSpinner /> });
const QuotationList = dynamic(() => import("./components/QuotationList"), { loading: () => <LoadingSpinner /> });
const PartialPaymentsList = dynamic(() => import("./components/PartialPaymentsList"), { loading: () => <LoadingSpinner /> });
const InventoryDashboard = dynamic(() => import("./components/InventoryDashboard"), { loading: () => <LoadingSpinner /> });
const ProductList = dynamic(() => import("./components/ProductList"), { loading: () => <LoadingSpinner /> });
const AddProduct = dynamic(() => import("./components/AddProduct"), { loading: () => <LoadingSpinner /> });
const ImportProducts = dynamic(() => import('./components/ImportProducts'), { loading: () => <LoadingSpinner /> });
const ImportCustomers = dynamic(() => import('./components/ImportCustomers'), { loading: () => <LoadingSpinner /> });
const QuickActions = dynamic(() => import('./components/QuickActions'), { loading: () => <LoadingSpinner /> });
const OrderList = dynamic(() => import('./components/OrderList'), { loading: () => <LoadingSpinner /> });
const CreateOrder = dynamic(() => import('./components/CreateOrder'), { loading: () => <LoadingSpinner /> });
const ConfirmModal = dynamic(() => import('./components/ConfirmModal'));
import "./styles/admin.css";
import "./styles/modern-sidebar.css";
import "./styles/dashboard.css";
import "./styles/admin-header.css";

import { useTheme } from "@/context/ThemeContext";

export default function AdminPage() {
    const { theme } = useTheme();
    const router = useRouter();

    const [activeSection, setActiveSection] = useState("dashboard");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState("accountant");
    const [username, setUsername] = useState("Admin");
    // const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // Removed

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
    const [customerToEdit, setCustomerToEdit] = useState<any>(null);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<any>(null);
    const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null);
    const [quotationToEdit, setQuotationToEdit] = useState<any>(null);

    React.useEffect(() => {
        if (activeSection !== 'create-quotation' && activeSection !== 'quotations-all') {
            setQuotationToEdit(null);
        }
        if (activeSection !== 'invoicing-new' && activeSection !== 'invoicing-edit' && activeSection !== 'invoicing-all') {
            setInvoiceToEdit(null);
        }
    }, [activeSection]);

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
    const [currentUser, setCurrentUser] = useState<any>(null);

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
                        setCurrentUser(data.user);

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

    // Sync current user with latest DB data when users list is fetched
    useEffect(() => {
        if (currentUser && users.length > 0) {
            // Find the current user in the fresh users list
            const freshUserData = users.find((u: any) =>
                String(u.id) === String(currentUser.id) ||
                u.email === currentUser.email
            );

            if (freshUserData) {
                // Construct the storage object format
                const updatedUserForStorage = {
                    ...currentUser,
                    ...freshUserData,
                    // Ensure naming consistency for header
                    name: freshUserData.firstName && freshUserData.lastName
                        ? `${freshUserData.firstName} ${freshUserData.lastName}`
                        : freshUserData.name || freshUserData.username,
                    image_url: freshUserData.avatar,
                    avatar: freshUserData.avatar
                };

                // Compare with current storage to avoid infinite loops/unnecessary writes
                const stored = localStorage.getItem('admin_user');
                const storedUser = stored ? JSON.parse(stored) : null;

                // Simple check if avatar or name changed
                const hasChanged = !storedUser ||
                    storedUser.avatar !== updatedUserForStorage.avatar ||
                    storedUser.name !== updatedUserForStorage.name;

                if (hasChanged) {
                    console.log('Syncing fresh DB user data to local storage/header...');
                    localStorage.setItem('admin_user', JSON.stringify(updatedUserForStorage));
                    // Update local state is optional since Header reads from LS, 
                    // but keeping them in sync is good.
                    // setCurrentUser(updatedUserForStorage); // Avoid this if it causes re-renders loop

                    window.dispatchEvent(new Event('admin-login'));
                }
            }
        }
    }, [users, currentUser]);

    // Handle Edit
    const handleEdit = async (item: any, type: string) => {
        if (type === 'User') {
            try {
                let avatarUrl = item.avatar || null;

                // If there's a new image file, try to upload it to ImageKit
                if (item.image && item.image instanceof File) {
                    try {
                        const formData = new FormData();
                        formData.append('file', item.image);
                        formData.append('folder', 'Profile_Pictures/Users');
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

                    // Check for old avatar deletion
                    const originalUser = users.find((u: any) => u.id === item.id);
                    const oldAvatarUrl = originalUser?.avatar;

                    if (oldAvatarUrl && avatarUrl && oldAvatarUrl !== avatarUrl && oldAvatarUrl.includes('ik.imagekit.io')) {
                        console.log(`Deleting old avatar: ${oldAvatarUrl}`);
                        fetch(`/api/imagekit/upload?url=${encodeURIComponent(oldAvatarUrl)}`, { method: 'DELETE' })
                            .catch(e => console.error('Failed to delete old avatar:', e));
                    }

                    // Refresh users list
                    fetchUsers();

                    // Update Header/Local Storage if the edited user is the current user
                    if (currentUser && String(currentUser.id) === String(item.id)) {
                        const updatedUserForStorage = {
                            ...currentUser,
                            name: `${item.firstName} ${item.lastName}`,
                            first_name: item.firstName,
                            last_name: item.lastName,
                            email: item.email,
                            phone: item.phone,
                            image_url: avatarUrl,
                            avatar: avatarUrl
                        };
                        localStorage.setItem('admin_user', JSON.stringify(updatedUserForStorage));
                        // Update local state to reflect immediately in other components if passed down, 
                        // though AdminHeader reads from localStorage on event.
                        setCurrentUser(updatedUserForStorage);
                        window.dispatchEvent(new Event('admin-login'));
                    }

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

    const handleArchiveCustomer = async (customer: any) => {
        try {
            const currentStatus = (customer.status || 'Active').toLowerCase();
            const newStatus = currentStatus === 'archived' ? 'Active' : 'Archived';

            const response = await fetch('/api/admin/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: customer.id,
                    status: newStatus
                })
            });

            if (response.ok) {
                fetchCustomers();
            } else {
                console.error('Failed to archive customer');
            }
        } catch (error) {
            console.error('Error modifying customer status:', error);
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
                                // Trigger global update
                                window.dispatchEvent(new Event('dashboard-updated'));
                                localStorage.setItem('dashboardLastUpdated', Date.now().toString());
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
                    else if (type === 'Customer') {
                        const res = await fetch(`/api/admin/customers?id=${item.id}`, { method: 'DELETE' });
                        if (res.ok) fetchCustomers();
                        else console.error('Failed to delete customer customers');
                    }

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



    // Auto-refresh for Users and Customers
    const refreshData = useCallback(() => {
        if (isAuthenticated && userRole?.toLowerCase() === 'admin') {
            console.log('Auto-refreshing Users, Customers, and Orders...');
            fetchUsers();
            fetchCustomers();
            fetchOrders();
        }
    }, [isAuthenticated, userRole, fetchUsers, fetchCustomers, fetchOrders]);

    // Listen for user updates from Header (Profile Edit)
    useEffect(() => {
        const handleUserUpdated = () => {
            console.log("User updated event received, refreshing users list...");
            fetchUsers();
        };

        window.addEventListener('user-updated', handleUserUpdated);
        return () => window.removeEventListener('user-updated', handleUserUpdated);
    }, [fetchUsers]);

    useAutoRefresh(refreshData);

    const handleLogout = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out of the admin panel?',
            type: 'danger',
            singleButton: false,
            onConfirm: confirmLogout
        });
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

    const getBreadcrumbs = () => {
        const mapping: Record<string, string[]> = {
            'dashboard': ['Dashboard'],
            'users-all': ['Users', 'All Users'],
            'users-roles': ['Users', 'Roles & Permissions'],
            'customers-all': ['Customers', 'All Customers'],
            'customers-add': ['Customers', 'Add Customer'],
            'customers-edit': ['Customers', 'Edit Customer'],
            'customers-import': ['Customers', 'Import Customers'],
            'orders-all': ['Orders', 'All Orders'],
            'orders-returns': ['Orders', 'Return Requests'],
            'orders-create': ['Orders', orderToEdit ? 'Edit Order' : 'Create Order'],
            'products-list': ['Inventory', 'Product List'],
            'products-add': ['Inventory', 'Add Product'],
            'products-edit': ['Inventory', 'Edit Product'],
            'products-import': ['Inventory', 'Import Products'],
            'inventory-dashboard': ['Inventory', 'Dashboard'],
            'invoicing-dashboard': ['Invoicing', 'Dashboard'],
            'invoicing-all': ['Invoicing', 'All Invoices'],
            'invoicing-new': ['Invoicing', 'Create Invoice'],
            'invoicing-edit': ['Invoicing', 'Edit Invoice'],
            'quotations-all': ['Quotations', 'All Quotations'],
            'create-quotation': ['Quotations', quotationToEdit ? 'Edit Quotation' : 'New Quotation'],
            'quotations-new': ['Quotations', 'New Quotation'],
            'payments-all': ['Invoicing', 'Partial Payments'],
            'quick-actions': ['Quick Actions'],
        };

        let path = mapping[activeSection];
        if (!path) {
            // Fallback for sections not explicitly mapped
            const formatted = activeSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            path = [formatted];
        }
        return ['Home', ...path];
    };

    const renderContent = () => {
        // --- Under Construction Sections ---
        if (activeSection.startsWith("orders") && !['orders-all', 'orders-create', 'orders-returns'].includes(activeSection)) {
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
            case "orders-returns":
                return <OrderList
                    orders={orders.filter(o => ['Return Requested', 'Returned'].includes(o.status))}
                    loading={isLoadingOrders}
                    onRefresh={fetchOrders}
                    title="Return Requests"
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
                    onAdd={() => {
                        setCustomerToEdit(null);
                        setActiveSection('customers-add');
                    }}
                    onNavigateToNewInvoice={() => setActiveSection('invoicing-new')}
                    onImportExport={() => setActiveSection('customers-import')}
                    onEdit={(c) => {
                        setCustomerToEdit(c);
                        setActiveSection('customers-edit');
                    }}
                    onDelete={(c) => handleDelete(c, 'Customer')}
                    onArchive={handleArchiveCustomer}
                    onView={(c) => {
                        console.log("View customer:", c);
                        setCustomerToEdit(c);
                        setActiveSection('customers-edit'); // Treating view as edit for now
                    }}
                />;
            case "customers-import":
                return <ImportCustomers
                    onCancel={() => setActiveSection('customers-all')}
                    onSuccess={() => {
                        fetchCustomers();
                        setActiveSection('customers-all');
                    }}
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
                                    formData.append('folder', 'Profile_Pictures/Customers'); // Folder name
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
                                // Trigger global update
                                window.dispatchEvent(new Event('dashboard-updated'));
                                localStorage.setItem('dashboardLastUpdated', Date.now().toString());
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

            case "customers-edit":
                return <AddCustomerForm
                    initialData={customerToEdit}
                    onCancel={() => {
                        setCustomerToEdit(null);
                        setActiveSection('customers-all');
                    }}
                    onSubmit={async (data) => {
                        try {
                            let avatarUrl = customerToEdit?.image_url;

                            if (data.image && data.image instanceof File) {
                                // Upload new image logic ... (copy from create)
                                try {
                                    const formData = new FormData();
                                    formData.append('file', data.image);
                                    formData.append('folder', 'Profile_Pictures/Customers');
                                    formData.append('fileName', data.name.replace(/\s+/g, '_'));
                                    const uploadResponse = await fetch('/api/imagekit/upload', { method: 'POST', body: formData });
                                    if (uploadResponse.ok) {
                                        const uploadData = await uploadResponse.json();
                                        avatarUrl = uploadData.url;
                                    }
                                } catch (e) {
                                    console.error("Upload error", e);
                                }
                            }

                            const payload = {
                                ...data,
                                id: customerToEdit.id,
                                image_url: avatarUrl // Match DB field name
                            };
                            delete payload.image;

                            const response = await fetch('/api/admin/customers', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });

                            if (response.ok) {
                                fetchCustomers();
                                setCustomerToEdit(null);
                                setActiveSection('customers-all');
                            } else {
                                console.error('Failed to update customer');
                            }
                        } catch (error) {
                            console.error('Error updating customer:', error);
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
                return <InvoiceList
                    setActiveSection={setActiveSection}
                    onEdit={(invoice) => {
                        setInvoiceToEdit(invoice);
                        setActiveSection('invoicing-edit');
                    }}
                />;
            case "invoicing-new":
                return <CreateInvoice setActiveSection={setActiveSection} customers={customers} />;
            case "invoicing-edit":
                return <CreateInvoice
                    setActiveSection={setActiveSection}
                    customers={customers}
                    initialData={invoiceToEdit}
                />;

            case "create-quotation":
                return <CreateQuotation
                    setActiveSection={setActiveSection}
                    customers={customers}
                    initialData={quotationToEdit}
                />;

            case "quotations-new":
                return <CreateQuotation
                    setActiveSection={setActiveSection}
                    customers={customers}
                    initialData={null}
                />;

            case "quotations-all":
                return <QuotationList
                    setActiveSection={setActiveSection}
                    onEdit={(quotation: any) => {
                        setQuotationToEdit(quotation);
                        setActiveSection('create-quotation');
                    }}
                />;

            case "payments-all":
                return <PartialPaymentsList setActiveSection={setActiveSection} />;

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
                                    formData.append('folder', 'Profile_Pictures/Users');
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
        <div className={`admin-body ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="admin-container">
                <AdminSidebar
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    onLogout={handleLogout}
                    userRole={userRole}
                    username={username}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <AdminHeader onLogout={handleLogout} roles={roles.map(r => r.name)} />
                    <main className="admin-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Breadcrumbs */}
                        <div className="admin-breadcrumbs" style={{ padding: '0 0.5rem', display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {getBreadcrumbs().map((item, index, arr) => (
                                <React.Fragment key={index}>
                                    {index === 0 && <i className="fas fa-home" style={{ marginRight: '0.5rem' }}></i>}
                                    <span
                                        onClick={() => index === 0 ? setActiveSection('dashboard') : null}
                                        style={{
                                            fontWeight: index === arr.length - 1 ? 600 : 400,
                                            color: index === arr.length - 1 ? 'var(--text-primary)' : (index === 0 ? 'var(--primary, #2563eb)' : 'var(--text-secondary)'),
                                            cursor: index === 0 ? 'pointer' : 'default'
                                        }}
                                        className={index === 0 ? "breadcrumb-link" : ""}
                                    >
                                        {item}
                                    </span>
                                    {index < arr.length - 1 && (
                                        <span style={{ margin: '0 0.5rem', color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>
                                            <i className="fas fa-chevron-right"></i>
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        {renderContent()}
                    </main>
                </div>
            </div>
            {/* LogoutModal Removed */}
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
