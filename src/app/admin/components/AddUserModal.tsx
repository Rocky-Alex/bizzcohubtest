"use client";

import React, { useState } from "react";
import "./AddUserModal.css";

interface User {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    status: string;
    image: string | null;
    avatar: string | null;
}

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: any) => void;
    roles: string[];
}

export default function AddUserModal({ isOpen, onClose, onSubmit, roles }: AddUserModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        status: true,
        image: null as File | null
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<any>({});
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Professional Business Avatars organized by category
    const avatarCategories = {
        "Formal Business": [
            "https://api.dicebear.com/7.x/personas/svg?seed=Felix&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Aneka&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Oliver&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Jasmine&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Mason&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Emma&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Ethan&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Aria&backgroundColor=b6e3f4"
        ],
        "Business Casual": [
            "https://api.dicebear.com/7.x/personas/svg?seed=Sophie&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Lucy&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Leo&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Ava&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Ella&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Grace&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Lily&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Noah&backgroundColor=b6e3f4"
        ],
        "Smart Casual": [
            "https://api.dicebear.com/7.x/personas/svg?seed=Max&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Jack&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Mia&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Zoe&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Liam&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=James&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Charlie&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/personas/svg?seed=Logan&backgroundColor=b6e3f4"
        ]
    };

    // Roles now passed as prop
    // const roles = ["Admin", "Salesman", "Accountant"]; (removed)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSelectSuggestedAvatar = (avatarUrl: string) => {
        setImagePreview(avatarUrl);
        setFormData(prev => ({ ...prev, image: avatarUrl as any }));
        setShowSuggestions(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                alert("File size must be less than 2MB");
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

        if (!formData.name.trim()) {
            newErrors.name = "User name is required";
        }

        if (!formData.role) {
            newErrors.role = "Role is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone is required";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            // Determine avatar: if image is a string (URL), use it as avatar; if File, send as image
            const isAvatarUrl = typeof formData.image === 'string';

            onSubmit({
                name: formData.name,
                role: formData.role,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                status: formData.status ? "Active" : "Inactive",
                image: isAvatarUrl ? null : formData.image,  // Only send File objects
                avatar: isAvatarUrl ? formData.image : imagePreview  // Send URL if available
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            name: "",
            role: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            status: true,
            image: null
        });
        setImagePreview(null);
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Add User</h2>
                    <button className="close-btn" onClick={handleClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Image Upload */}
                    <div className="image-upload-section">
                        <div className="image-preview-container">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="image-preview" />
                            ) : (
                                <div className="image-placeholder">
                                    <i className="fas fa-plus"></i>
                                    <span>Add Image</span>
                                </div>
                            )}
                        </div>
                        <div className="upload-btn-wrapper">
                            <label htmlFor="image-upload" className="upload-btn">
                                Upload Image
                            </label>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className="suggestions-btn"
                                onClick={() => setShowSuggestions(!showSuggestions)}
                            >
                                <i className="fas fa-images"></i> Avatar Suggestions
                            </button>
                            <p className="upload-hint">JPEG, PNG up to 2 MB</p>
                        </div>

                        {/* Categorized Avatar Suggestions */}
                        {showSuggestions && (
                            <div className="avatar-suggestions">
                                {Object.entries(avatarCategories).map(([category, avatars]) => (
                                    <div key={category} className="avatar-category">
                                        <h4 className="category-title">{category}</h4>
                                        <div className="avatar-grid">
                                            {avatars.map((avatar, index) => (
                                                <div
                                                    key={index}
                                                    className="avatar-option"
                                                    onClick={() => handleSelectSuggestedAvatar(avatar)}
                                                    title={`Select ${category} avatar ${index + 1}`}
                                                >
                                                    <img src={avatar} alt={`${category} ${index + 1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="form-group">
                        <label>
                            User <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={errors.name ? "error" : ""}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label>
                            Role <span className="required">*</span>
                        </label>
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
                        {errors.role && <span className="error-message">{errors.role}</span>}
                    </div>

                    <div className="form-group">
                        <label>
                            Email <span className="required">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={errors.email ? "error" : ""}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label>
                            Phone <span className="required">*</span>
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={errors.phone ? "error" : ""}
                        />
                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>
                                Password <span className="required">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={errors.password ? "error" : ""}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                </button>
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label>
                                Confirm Password <span className="required">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={errors.confirmPassword ? "error" : ""}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    <div className="form-group status-group">
                        <label>Status</label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked }))}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={handleClose}>
                        Cancel
                    </button>
                    <button className="submit-btn" onClick={handleSubmit}>
                        Add User
                    </button>
                </div>
            </div>
        </div>
    );
}
