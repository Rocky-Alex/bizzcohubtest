"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const CustomerList = dynamic(() => import("../components/CustomerList"), { loading: () => <LoadingSpinner /> });
const AddCustomerForm = dynamic(() => import("../components/AddCustomerForm"), { loading: () => <LoadingSpinner /> });
const ImportCustomers = dynamic(() => import("../components/ImportCustomers"), { loading: () => <LoadingSpinner /> });

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'import'>('list');
    const [customerToEdit, setCustomerToEdit] = useState<any>(null);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.customers || []);
            } else {
                toast.error("Failed to fetch customers");
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error("Failed to fetch customers");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleAdd = () => {
        setCustomerToEdit(null);
        setViewMode('add');
    };

    const handleEdit = (customer: any) => {
        setCustomerToEdit(customer);
        setViewMode('edit');
    };

    const handleDelete = async (customer: any) => {
        if (!confirm(`Are you sure you want to delete ${customer.name}?`)) return;

        try {
            const res = await fetch(`/api/admin/customers?id=${customer.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Customer deleted");
                fetchCustomers();
            } else {
                toast.error("Failed to delete customer");
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error("Error deleting customer");
        }
    };

    const handleArchive = async (customer: any) => {
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
                toast.success(`Customer ${newStatus.toLowerCase()}`);
                fetchCustomers();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error('Error modifying customer status:', error);
            toast.error("Error updating status");
        }
    };

    const handleImportExport = () => {
        setViewMode('import');
    };

    const handleCustomerSubmit = async (data: any) => {
        try {
            let avatarUrl = customerToEdit?.image_url || null;

            // Image Upload
            if (data.image && data.image instanceof File) {
                try {
                    const formData = new FormData();
                    formData.append('file', data.image);
                    formData.append('folder', 'Profile_Pictures/Customers');
                    formData.append('fileName', (data.name || 'customer').replace(/\s+/g, '_'));

                    const uploadResponse = await fetch('/api/imagekit/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json();
                        avatarUrl = uploadData.url;
                    } else {
                        console.error('Failed to upload image');
                        toast.error("Failed to upload image, continuing...");
                    }
                } catch (uploadError) {
                    console.error('Image upload error:', uploadError);
                    toast.error("Image upload error");
                }
            }

            const payload = { ...data, avatar: avatarUrl };
            if (customerToEdit) {
                payload.id = customerToEdit.id;
                payload.image_url = avatarUrl; // API seems to expect image_url or avatar depending on endpoint, using both/matching existing
                delete payload.image;
            } else {
                delete payload.image;
            }

            const method = customerToEdit ? 'PUT' : 'POST';
            const response = await fetch('/api/admin/customers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(customerToEdit ? "Customer updated" : "Customer created");
                setViewMode('list');
                fetchCustomers();
            } else {
                const err = await response.json();
                toast.error(err.error || "Failed to save customer");
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            toast.error("Error saving customer");
        }
    };

    if (viewMode === 'add' || viewMode === 'edit') {
        return (
            <div style={{ padding: '1rem' }}>
                <AddCustomerForm
                    initialData={customerToEdit}
                    onCancel={() => setViewMode('list')}
                    onSubmit={handleCustomerSubmit}
                />
            </div>
        );
    }

    if (viewMode === 'import') {
        return (
            <div style={{ padding: '1rem' }}>
                <ImportCustomers
                    onCancel={() => setViewMode('list')}
                    onSuccess={() => {
                        setViewMode('list');
                        fetchCustomers();
                    }}
                />
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            <CustomerList
                customers={customers}
                loading={isLoading}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onImportExport={handleImportExport}
                onNavigateToNewInvoice={() => router.push('/admin/billing/invoices/new')}
            />
        </div>
    );
}
