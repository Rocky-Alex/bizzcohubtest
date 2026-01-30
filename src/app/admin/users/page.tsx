"use client";

import React, { useState, useEffect, useCallback } from "react";
import UserManagement from "./UserManagement";
import { toast } from "sonner";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                const transformedUsers = data.users.map((user: any) => ({
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
                }));
                setUsers(transformedUsers);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error("Failed to fetch users");
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
            let avatarUrl = item.avatar || null;
            if (item.image && item.image instanceof File) {
                const formData = new FormData();
                formData.append('file', item.image);
                formData.append('folder', 'Profile_Pictures/Users');
                formData.append('fileName', (item.name || 'user').replace(/\s+/g, '_'));

                const uploadResponse = await fetch('/api/imagekit/upload', {
                    method: 'POST',
                    body: formData
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    avatarUrl = uploadData.url;
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
                toast.success("User updated successfully");
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(`Failed to update user: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error("Failed to update user");
        }
    };

    const handleDelete = async (item: any) => {
        if (!confirm(`Are you sure you want to delete user ${item.name}?`)) return;

        try {
            const response = await fetch(`/api/admin/users?id=${item.id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success("User deleted successfully");
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(`Failed to delete user: ${error.error}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error("Failed to delete user");
        }
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
                const error = await response.json();
                toast.error(`Failed to add user: ${error.error}`);
            }
        } catch (error) {
            console.error('Error adding user:', error);
            toast.error("Failed to add user");
        }
    };

    return (
        <UserManagement
            users={users}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            availableRoles={roles}
            loading={isLoading}
        />
    );
}
