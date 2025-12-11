"use client";

import React, { useState } from "react";
import PermissionsModal from "./PermissionsModal";
import AddRoleModal from "./AddRoleModal";
import "./RolesAndPermissions.css";

interface Role {
    id: string;
    name: string;
    createOn: string;
    permissionsCount?: number; // Optional, maybe for future
}

interface RolesAndPermissionsProps {
    roles: Role[];
    onAddRole: (roleName: string) => void;
}

export default function RolesAndPermissions({ roles, onAddRole }: RolesAndPermissionsProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<{ name: string, id: string } | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Mock data removed in favor of props


    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="roles-permission-container">
            {/* Header */}
            <div className="roles-header">
                <h2>Roles & Permission</h2>
                <div className="roles-actions">

                    <button className="btn-new-role" onClick={() => setIsAddRoleModalOpen(true)}>
                        <i className="fas fa-plus-circle"></i>
                        New Role
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-bar-container">
                <div className="search-input-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <table className="roles-table">
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Create On</th>
                        <th></th> {/* Actions column */}
                    </tr>
                </thead>
                <tbody>
                    {filteredRoles.map((role) => (
                        <tr key={role.id}>
                            <td className="role-name">{role.name}</td>
                            <td>{role.createOn}</td>
                            <td>
                                <div className="action-cell">
                                    {/* Only show Permissions button for non-Admin if desired, or all. 
                                        The image shows Admin ROW but no Permissions button? 
                                        Actually Admin row is just empty on the rightside in my reading of "Make like this", 
                                        Wait, let's re-examine the image.
                                        Row 1: Admin | 22 Feb 2025 | (Empty space?)
                                        Row 2: Customer | 07 Feb 2025 | [Shield] Permissions | (...)
                                        Row 3: Shop Owner ... | [Shield] Permissions | (...)
                                        Row 4: Receptionist ... | [Shield] Permissions | (...)
                                        
                                        Ah, interesting. Admin might not be editable.
                                    */}
                                    {role.name !== "Admin" && (
                                        <>
                                            <button
                                                className="btn-permissions"
                                                onClick={() => {
                                                    setSelectedRole(role);
                                                    setIsPermissionsModalOpen(true);
                                                }}
                                            >
                                                <i className="fas fa-shield-alt"></i>
                                                Permissions
                                            </button>

                                            <div className="action-menu-container">
                                                <button
                                                    className={`btn-more ${activeDropdown === role.id ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === role.id ? null : role.id);
                                                    }}
                                                >
                                                    <i className="fas fa-ellipsis-h"></i>
                                                </button>

                                                {activeDropdown === role.id && (
                                                    <div className="role-dropdown-menu">
                                                        <button
                                                            className="dropdown-item"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                console.log("Edit role:", role.name);
                                                                setActiveDropdown(null);
                                                            }}
                                                        >
                                                            <i className="fas fa-edit"></i> Edit
                                                        </button>
                                                        <button
                                                            className="dropdown-item delete"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                console.log("Delete role:", role.name);
                                                                setActiveDropdown(null);
                                                            }}
                                                        >
                                                            <i className="fas fa-trash-alt"></i> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredRoles.length === 0 && (
                        <tr>
                            <td colSpan={3} style={{ textAlign: "center", padding: "2rem" }}>
                                No roles found
                            </td>
                        </tr>
                    )}

                </tbody>
            </table>

            {/* Permissions Modal */}
            {selectedRole && (
                <PermissionsModal
                    isOpen={isPermissionsModalOpen}
                    onClose={() => setIsPermissionsModalOpen(false)}
                    roleName={selectedRole.name}
                    onSave={(perms) => {
                        console.log("Saving permissions for", selectedRole.name, perms);
                        // Here you would save to backend
                        setIsPermissionsModalOpen(false);
                    }}
                />
            )}

            {/* Add Role Modal */}
            <AddRoleModal
                isOpen={isAddRoleModalOpen}
                onClose={() => setIsAddRoleModalOpen(false)}
                onSubmit={(roleName) => {
                    onAddRole(roleName);
                }}
            />
        </div>
    );
}
