"use client";

import React, { useState } from "react";
import "./AddUserModal.css"; // Reuse valid styles

interface AddRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (roleName: string) => void;
}

export default function AddRoleModal({ isOpen, onClose, onSubmit }: AddRoleModalProps) {
    const [roleName, setRoleName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (!roleName.trim()) {
            setError("Role name is required");
            return;
        }
        onSubmit(roleName);
        setRoleName("");
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-user-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Role</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Role Name <span className="required">*</span></label>
                        <input
                            type="text"
                            value={roleName}
                            onChange={(e) => {
                                setRoleName(e.target.value);
                                setError("");
                            }}
                            placeholder="e.g. Supervisor"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                        {error && <span className="error-message">{error}</span>}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="submit-btn" onClick={handleSubmit}>Create Role</button>
                </div>
            </div>
        </div>
    );
}
