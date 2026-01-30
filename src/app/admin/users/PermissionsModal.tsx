"use client";

import React, { useState, useEffect } from "react";
import "./PermissionsModal.css";

interface PermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleName: string;
    initialPermissions?: Record<string, any>;
    onSave: (permissions: Record<string, any>) => void;
}

// Define the precise structure based on the User's request
const SECTIONS = [
    {
        title: "Dashboard",
        modules: [
            { id: "dashboard_view", name: "Dashboard Overview" }
        ]
    },
    {
        title: "User Management",
        modules: [
            { id: "user_list", name: "All Users" },
            { id: "user_roles", name: "Roles & Permissions" }
        ]
    },
    {
        title: "Order Management",
        modules: [
            { id: "orders_all", name: "All Orders" },
            { id: "orders_create", name: "Create Order" },
            { id: "orders_returns", name: "Returns" }
        ]
    },
    {
        title: "Billing",
        modules: [
            { id: "invoices_all", name: "All Invoices" },
            { id: "invoices_create", name: "New Invoice" }
        ]
    },
    {
        title: "Reports",
        modules: [
            { id: "reports_sales", name: "Sales Report" },
            { id: "reports_inventory", name: "Inventory Report" }
        ]
    },
    {
        title: "Customer Management",
        modules: [
            { id: "customers_all", name: "All Customers" },
            { id: "customers_groups", name: "Groups" }
        ]
    },
    {
        title: "Accessories",
        modules: [
            { id: "accessories_list", name: "Accessory List" },
            { id: "accessories_add", name: "Add Accessory" }
        ]
    },
    {
        title: "Laptop Gaming Refurbished Laptop",
        modules: [
            { id: "products_list", name: "Product List" },
            { id: "products_add", name: "Add Product" }
        ]
    }
];

export default function PermissionsModal({ isOpen, onClose, roleName, initialPermissions, onSave }: PermissionsModalProps) {
    // State to store permissions: { [moduleId]: { create: bool, edit: bool, delete: bool, view: bool, all: bool } }
    const [permissions, setPermissions] = useState<Record<string, any>>({});

    useEffect(() => {
        if (isOpen) {
            // Load initial permissions or defaults
            // If no initial, default to empty/false
            setPermissions(initialPermissions || {});
        }
    }, [isOpen, initialPermissions]);

    const handleCheckboxChange = (moduleId: string, type: string, checked: boolean) => {
        setPermissions(prev => {
            const modulePerms = prev[moduleId] || { create: false, edit: false, delete: false, view: false, all: false };

            let updatedModulePerms = { ...modulePerms };

            if (type === 'all') {
                // If 'All Allow' is toggled
                updatedModulePerms = {
                    create: checked,
                    edit: checked,
                    delete: checked,
                    view: checked,
                    all: checked
                };
            } else {
                // Toggle specific permission
                updatedModulePerms[type] = checked;

                // Update 'all' status based on others
                const allOthersTrue =
                    updatedModulePerms.create &&
                    updatedModulePerms.edit &&
                    updatedModulePerms.delete &&
                    updatedModulePerms.view;

                updatedModulePerms.all = allOthersTrue;
            }

            return {
                ...prev,
                [moduleId]: updatedModulePerms
            };
        });
    };

    const handleSave = () => {
        onSave(permissions);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="permissions-modal-overlay">
            <div className="permissions-modal">
                <div className="permissions-modal-header">
                    <h2>Permissions for <span style={{ color: '#8b5cf6' }}>{roleName}</span></h2>
                    <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
                </div>

                <div className="permissions-modal-content">
                    {SECTIONS.map((section, sIndex) => (
                        <div key={sIndex} className="permission-section">
                            <div className="section-title">
                                <i className="fas fa-layer-group" style={{ color: '#8b5cf6', fontSize: '0.875rem' }}></i>
                                {section.title}
                            </div>
                            <table className="permissions-table">
                                <thead>
                                    <tr>
                                        <th>Module Name</th>
                                        <th className="checkbox-col">Create</th>
                                        <th className="checkbox-col">Edit</th>
                                        <th className="checkbox-col">Delete</th>
                                        <th className="checkbox-col">View</th>
                                        <th className="checkbox-col">All Allow</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.modules.map((module) => {
                                        const perms = permissions[module.id] || { create: false, edit: false, delete: false, view: false, all: false };
                                        return (
                                            <tr key={module.id}>
                                                <td>{module.name}</td>
                                                <td className="checkbox-col">
                                                    <div className="checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-checkbox"
                                                            checked={perms.create}
                                                            onChange={(e) => handleCheckboxChange(module.id, 'create', e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="checkbox-col">
                                                    <div className="checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-checkbox"
                                                            checked={perms.edit}
                                                            onChange={(e) => handleCheckboxChange(module.id, 'edit', e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="checkbox-col">
                                                    <div className="checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-checkbox"
                                                            checked={perms.delete}
                                                            onChange={(e) => handleCheckboxChange(module.id, 'delete', e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="checkbox-col">
                                                    <div className="checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-checkbox"
                                                            checked={perms.view}
                                                            onChange={(e) => handleCheckboxChange(module.id, 'view', e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="checkbox-col">
                                                    <div className="checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-checkbox"
                                                            checked={perms.all}
                                                            onChange={(e) => handleCheckboxChange(module.id, 'all', e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                <div className="permissions-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-save" onClick={handleSave}>Save Permissions</button>
                </div>
            </div>
        </div>
    );
}
