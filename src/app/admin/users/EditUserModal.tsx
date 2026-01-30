"use client";

import React, { useState, useEffect } from "react";
import "./EditUserModal.css";
import ConfirmModal from '../shared/ConfirmModal';
import AvatarUploader from '../shared/AvatarUploader';
import { Country } from 'country-state-city';
import PhoneInputWithCountry from "@/components/ui/PhoneInputWithCountry";

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

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: any) => void;
    user: User | null;
    roles: string[];
}

export default function EditUserModal({ isOpen, onClose, onSubmit, user, roles }: EditUserModalProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        phone: "",
        phoneCode: "971",
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

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
        singleButton?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    // Populate form when user changes
    useEffect(() => {
        if (user) {
            // Determine initial values
            // firstName/lastName might be missing if user was created before schema update
            let initialFirstName = user.firstName || "";
            let initialLastName = user.lastName || "";

            // Fallback: splitting name if firstName is empty
            if (!initialFirstName && user.name) {
                const nameParts = user.name.split(' ');
                initialFirstName = nameParts[0] || "";
                initialLastName = nameParts.slice(1).join(' ') || "";
            }

            // Parse Phone Number
            let initialPhone = user.phone || "";
            let initialCode = "971";

            if (initialPhone) {
                // If starts with +, remove it temporarily for matching
                const cleanPhone = initialPhone.startsWith('+') ? initialPhone.substring(1) : initialPhone;

                const allCountries = Country.getAllCountries();
                // Sort by length desc to match longest code first (e.g. 1 340 vs 1)
                const sortedCountries = allCountries.sort((a, b) => b.phonecode.length - a.phonecode.length);

                const match = sortedCountries.find(c => cleanPhone.startsWith(c.phonecode));
                if (match) {
                    initialCode = match.phonecode;
                    initialPhone = cleanPhone.substring(match.phonecode.length);
                } else {
                    // Fallback, assume default code or just put everything in phone input if no match
                    // This is tricky if no match found. 
                    // Assume user entered raw number without code?
                    initialPhone = cleanPhone;
                }
            }

            setFormData({
                firstName: initialFirstName,
                lastName: initialLastName,
                userName: user.username || user.name, // Prefer username field, fallback to name
                email: user.email || "",
                phone: initialPhone,
                phoneCode: initialCode,
                password: "",
                confirmPassword: "",
                role: user.role,
                status: user.status === "Active",
                image: null
            });
            setImagePreview(user.avatar || null);
            setErrors({});
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [user, isOpen]);

    // VALIDATION LOGIC
    const [isCheckingUser, setIsCheckingUser] = useState(false);
    const checkTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const checkUsernameAvailability = async (username: string) => {
        if (!username.trim()) return;

        // If username hasn't changed from original, it's valid (it's their own)
        // However, we still check via API with excludeId to be safe and consistent

        setIsCheckingUser(true);
        try {
            // Pass excludeId to ignore the current user's record
            const res = await fetch(`/api/admin/users/check-username?username=${encodeURIComponent(username)}&excludeId=${user?.id}`);
            const data = await res.json();

            if (res.ok) {
                if (!data.available) {
                    setErrors((prev: any) => ({ ...prev, userName: "Username is already taken" }));
                } else {
                    // Valid
                    setErrors((prev: any) => {
                        const newErrors = { ...prev };
                        delete newErrors.userName;
                        return newErrors;
                    });
                }
            }
        } catch (error) {
            console.error("Error checking username:", error);
        } finally {
            setIsCheckingUser(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => ({ ...prev, [name]: "" }));
        }

        // Real-time Check for Username
        if (name === "userName") {
            if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
            checkTimeoutRef.current = setTimeout(() => {
                checkUsernameAvailability(value);
            }, 500);
        }
    };

    const handleAvatarChange = (file: File, previewUrl: string) => {
        setFormData(prev => ({ ...prev, image: file }));
        setImagePreview(previewUrl);
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
        if (!formData.userName.trim()) {
            newErrors.userName = "User Name is required";
        } else if (errors.userName === "Username is already taken") {
            newErrors.userName = "Username is already taken";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!formData.phone.trim()) newErrors.phone = "Phone Number is required";

        if (formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = "Password must be at least 6 characters";
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        }

        if (!formData.role) newErrors.role = "Role is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            // Determine avatar: if image is a string (URL), use it as avatar; if File, send as image
            const isAvatarUrl = typeof formData.image === 'string';

            const updatedData: any = {
                id: user?.id,
                firstName: formData.firstName,
                lastName: formData.lastName,
                userName: formData.userName,
                username: formData.userName, // Explicit mapping
                name: `${formData.firstName} ${formData.lastName}`, // Combine as per requirement
                role: formData.role,
                email: formData.email,
                phone: `+${formData.phoneCode}${formData.phone}`,
                status: formData.status ? "Active" : "Inactive",
                image: formData.image, // File object if present
                avatar: imagePreview // Current preview (URL or base64)
            };

            // Only include password if it was changed
            if (formData.password) {
                updatedData.password = formData.password;
            }

            onSubmit(updatedData);
            onClose();
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="edit-user-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Edit User</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <div className="form-section">
                        <label className="section-label">Image</label>
                        <AvatarUploader
                            currentImage={imagePreview}
                            onImageChange={handleAvatarChange}
                            imageName={user.name}
                        />
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
                        <label>User Name <span className="required">*</span> {isCheckingUser && <span style={{ fontSize: '0.8rem', color: '#666' }}>(Checking...)</span>}</label>
                        <input
                            type="text"
                            name="userName"
                            value={formData.userName}
                            onChange={handleInputChange}
                            className={errors.userName ? "error" : ""}
                        />
                        {errors.userName && <span className="error-message" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.userName}</span>}
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
                            <PhoneInputWithCountry
                                value={formData.phone}
                                countryCode={formData.phoneCode}
                                onChange={(code, num) => {
                                    setFormData(prev => ({ ...prev, phoneCode: code, phone: num }));
                                    if (errors.phone) setErrors((prev: any) => ({ ...prev, phone: "" }));
                                }}
                                error={!!errors.phone}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Password <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '12px' }}>(Optional)</span></label>
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
                                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
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
                                    <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
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
                    <button className="save-btn" onClick={handleSubmit}>
                        Save Changes
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />
        </div>
    );
}
