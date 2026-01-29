"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "sonner";

const UserManagement = dynamic(() => import("../components/UserManagement"), { loading: () => <LoadingSpinner /> });

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger' as 'danger' | 'info' | 'success',
        singleButton: false,
        onConfirm: () => { }
    });

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users.map((user: any) => ({
                    id: user.id.toString(),
                    name: user.username,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone || '',
                    email: user.email || '',
                    role: user.role,
                    status: user.status === 'active' ? 'Active' : 'Inactive',
                    avatar: user.avatar || undefined
                })));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data.roles.map((r: any) => r.name));
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers, fetchRoles]);

    const handleEdit = async (item: any) => {
        try {
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
                    avatar: item.avatar,
                    ...(item.password && { password: item.password })
                })
            });

            if (response.ok) {
                toast.success("User updated successfully");
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error("An error occurred");
        }
    };

    const handleDelete = (item: any) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete User',
            message: `Are you sure you want to delete user: ${item.name}? This action cannot be undone.`,
            type: 'danger',
            singleButton: false,
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/admin/users?id=${item.id}`, { method: 'DELETE' });
                    if (response.ok) {
                        toast.success("User deleted");
                        fetchUsers();
                    } else {
                        const error = await response.json();
                        toast.error(`Error: ${error.error}`);
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                    toast.error("An error occurred");
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleAdd = async (data: any) => {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                toast.success("User added successfully");
                fetchUsers();
            } else {
                const err = await response.json();
                toast.error(err.error || "Failed to add user");
            }
        } catch (error) {
            console.error("Error adding user:", error);
            toast.error("Internal server error");
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <UserManagement
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleAdd}
                availableRoles={roles}
                loading={isLoading}
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
