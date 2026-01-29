"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toast } from "sonner";

const RolesAndPermissions = dynamic(() => import("../../components/RolesAndPermissions"), { loading: () => <LoadingSpinner /> });

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);

    const fetchRoles = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/roles');
            if (response.ok) {
                const data = await response.json();
                const formattedRoles = data.roles.map((r: any) => ({
                    id: r.id.toString(),
                    name: r.name,
                    createOn: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                }));
                setRoles(formattedRoles);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error("Failed to load roles");
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleAddRole = async (roleName: string) => {
        try {
            const response = await fetch('/api/admin/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: roleName })
            });

            if (response.ok) {
                toast.success("Role created");
                fetchRoles();
            } else {
                toast.error("Failed to create role");
            }
        } catch (error) {
            console.error('Error creating role:', error);
            toast.error("An error occurred");
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <RolesAndPermissions
                roles={roles}
                onAddRole={handleAddRole}
            />
        </div>
    );
}
