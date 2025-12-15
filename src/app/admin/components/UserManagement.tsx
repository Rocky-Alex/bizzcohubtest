"use client";

import React, { useState } from "react";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./UserManagement.css";

interface User {
    id: string;
    name: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    email: string;
    role: string;
    status: "Active" | "Inactive";
    avatar?: string;
}

interface UserManagementProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onAdd: (userData: any) => void;
    availableRoles: string[];
    loading?: boolean;
}

export default function UserManagement({ users, onEdit, onDelete, onAdd, availableRoles, loading = false }: UserManagementProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const itemsPerPage = 10;

    const handleAddUser = (userData: any) => {
        // Call the onAdd prop with the user data
        onAdd(userData);
    };

    const handleEditUser = (userData: any) => {
        // Call the onEdit prop with the updated user data
        onEdit(userData);
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    // Filter users based on search and status
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone.includes(searchTerm) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "All" || user.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // Generate avatar initials
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate random avatar color
    const getAvatarColor = (name: string) => {
        const colors = [
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
            "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <div className="user-management-container">
            {/* Header */}
            <div className="user-header">
                <div className="user-header-left">
                    <h1>Users</h1>
                    <p>Manage your users</p>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="user-controls">
                <div className="user-controls-left">
                    <div className="search-input-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="user-controls-right">
                    <button className="icon-btn">
                        <i className="fas fa-file-pdf" style={{ color: '#dc2626' }}></i>
                    </button>
                    <button className="icon-btn">
                        <i className="fas fa-file-excel" style={{ color: '#16a34a' }}></i>
                    </button>
                    <button className="icon-btn">
                        <i className="fas fa-redo"></i>
                    </button>
                    <button className="icon-btn">
                        <i className="fas fa-ellipsis-h"></i>
                    </button>
                    <select
                        className="status-dropdown"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                    <button className="add-user-btn" onClick={() => setIsModalOpen(true)}>
                        <i className="fas fa-plus"></i>
                        Add User
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="user-table-wrapper">
                {loading ? (
                    <LoadingSpinner fullScreen />
                ) : (
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>User Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th className="actions-header">
                                    <button className="settings-icon">
                                        <i className="fas fa-cog"></i>
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-name-cell">
                                                <div
                                                    className="user-avatar"
                                                    style={{
                                                        backgroundColor: user.avatar ? 'transparent' : getAvatarColor(user.name),
                                                        padding: user.avatar ? '0' : undefined
                                                    }}
                                                >
                                                    {user.avatar ? (
                                                        <img
                                                            src={user.avatar}
                                                            alt={user.name}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                borderRadius: '50%'
                                                            }}
                                                        />
                                                    ) : (
                                                        getInitials(user.name)
                                                    )}
                                                </div>
                                                <span>{user.name}</span>
                                            </div>
                                        </td>
                                        <td>{user.phone}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td>
                                            <span className={`status-badge ${user.status.toLowerCase()}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn view-btn"
                                                    title="View"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => openEditModal(user)}
                                                    title="Edit"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => onDelete(user)}
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="no-data">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="user-pagination">
                <div className="pagination-info">
                    Rows Per Page: {itemsPerPage}
                </div>
                <div className="pagination-controls">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <span className="pagination-number">{currentPage}</span>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            {/* Add User Modal */}
            <AddUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddUser}
                roles={availableRoles}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditUser}
                user={selectedUser}
                roles={availableRoles}
            />
        </div >
    );
}
