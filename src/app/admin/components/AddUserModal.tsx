"use client";

import React, { useState, useEffect } from "react";
import "./AddUserModal.css";

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: any) => void;
    roles: string[];
}

export default function AddUserModal({ isOpen, onClose, onSubmit, roles }: AddUserModalProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "",
        status: true,
        image: null as File | null
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<any>({});

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                firstName: "",
                lastName: "",
                userName: "",
                email: "",
                phone: "",
                password: "",
                confirmPassword: "",
                role: "",
                status: true,
                image: null
            });
            setImagePreview(null);
            setErrors({});
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => ({ ...prev, [name]: "" }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (5MB limit as per design)
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                return;
            }

            // Check file type
            if (!file.type.match(/image\/(jpeg|png)/)) {
                alert("Only JPEG and PNG files are allowed");
                return;
            }

            setFormData(prev => ({ ...prev, image: file }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
        if (!formData.userName.trim()) newErrors.userName = "User Name is required";

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!formData.phone.trim()) newErrors.phone = "Phone Number is required";

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Wait, confirm password is required if password is present, assuming logic here
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Confirm Password is required";
        }

        if (!formData.role) newErrors.role = "Role is required";


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit({
                firstName: formData.firstName,
                lastName: formData.lastName,
                userName: formData.userName,
                username: formData.userName, // Explicitly for backend compatibility
                name: `${formData.firstName} ${formData.lastName}`, // Combining for legacy Name field
                role: formData.role,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                status: formData.status ? "Active" : "Inactive",
                image: formData.image,
                avatar: imagePreview // For preview if needed
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Add New User</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <div className="form-section">
                        <label className="section-label">Image</label>
                        <div className="image-upload-row">
                            <div className="image-preview-box">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" />
                                ) : (
                                    <div className="placeholder-icon">
                                        <i className="far fa-image"></i>
                                    </div>
                                )}
                            </div>
                            <div className="upload-controls">
                                <label htmlFor="image-upload" className="upload-btn-purple">
                                    <i className="fas fa-upload"></i> Upload Image
                                </label>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <p className="upload-help-text">JPG or PNG format, not exceeding 5MB.</p>
                            </div>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>First Name <span className="required">*</span></label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className={errors.firstName ? "error" : ""}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name <span className="required">*</span></label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className={errors.lastName ? "error" : ""}
                            />
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>User Name <span className="required">*</span></label>
                        <input
                            type="text"
                            name="userName"
                            value={formData.userName}
                            onChange={handleInputChange}
                            className={errors.userName ? "error" : ""}
                        />
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Email <span className="required">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={errors.email ? "error" : ""}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number <span className="required">*</span></label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={errors.phone ? "error" : ""}
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={errors.password ? "error" : ""}
                                />
                                <button
                                    type="button"
                                    className="eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye-slash"}`}></i>
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password <span className="required">*</span></label>
                            <div className="password-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={errors.confirmPassword ? "error" : ""}
                                />
                                <button
                                    type="button"
                                    className="eye-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye-slash"}`}></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className={errors.role ? "error" : ""}
                            >
                                <option value="">Select</option>
                                {roles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="statusSelect"
                                value={formData.status ? "Active" : "Inactive"}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value === "Active" }))}
                            >
                                <option value="">Select</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="create-btn" onClick={handleSubmit}>
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}

