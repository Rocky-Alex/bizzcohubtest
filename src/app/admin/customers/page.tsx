"use client";

import React, { useState, useEffect, useCallback } from "react";
import CustomerList from "./CustomerList";
import AddCustomerForm from "./AddCustomerForm";
import ImportCustomers from "./ImportCustomers";
import { toast } from "sonner";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'list' | 'add' | 'edit' | 'import'>('list');
    const [customerToEdit, setCustomerToEdit] = useState<any>(null);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.customers || []);
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

    const handleAdd = () => setView('add');
    const handleImport = () => setView('import');
    const handleEdit = (customer: any) => {
        setCustomerToEdit(customer);
        setView('edit');
    };

    const handleDelete = async (customer: any) => {
        if (!confirm(`Are you sure you want to delete customer ${customer.name}?`)) return;
        try {
            const res = await fetch(`/api/admin/customers?id=${customer.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Customer deleted");
                fetchCustomers();
            }
        } catch (error) {
            toast.error("Failed to delete customer");
        }
    };

    const handleArchive = async (customer: any) => {
        try {
            const currentStatus = (customer.status || 'Active').toLowerCase();
            const newStatus = currentStatus === 'archived' ? 'Active' : 'Archived';
            const response = await fetch('/api/admin/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: customer.id, status: newStatus })
            });
            if (response.ok) fetchCustomers();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (view === 'add' || view === 'edit') {
        return (
            <AddCustomerForm
                onCancel={() => { setView('list'); setCustomerToEdit(null); }}
                onSubmit={() => { setView('list'); setCustomerToEdit(null); fetchCustomers(); }}
                editData={customerToEdit}
            />
        );
    }

    if (view === 'import') {
        return <ImportCustomers onBack={() => setView('list')} />;
    }

    return (
        <CustomerList
            customers={customers}
            loading={isLoading}
            onAdd={handleAdd}
            onImportExport={handleImport}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onArchive={handleArchive}
        />
    );
}
