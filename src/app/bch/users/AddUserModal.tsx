"use client";

import React, { useState, useEffect } from "react";
import "./AddUserModal.css";
import ConfirmModal from '../shared/ConfirmModal';
import { Country } from 'country-state-city';
import PhoneInputWithCountry from "@/components/ui/PhoneInputWithCountry";
import AvatarUploader from "../shared/AvatarUploader";

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
        phoneCode: "971",
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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
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
                image: null
            });
            setImagePreview(null);
            setErrors({});
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen]);

    const [isCheckingUser, setIsCheckingUser] = useState(false);
    const checkTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const checkUsernameAvailability = async (username: string) => {
        if (!username.trim()) return;

        setIsCheckingUser(true);
        try {
            const res = await fetch(`/api/bch/users/check-username?username=${encodeURIComponent(username)}`);
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (5MB limit as per design)
            if (file.size > 5 * 1024 * 1024) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: "File size must be less than 5MB",
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                return;
            }

            // Check file type
            if (!file.type.match(/image\/(jpeg|png)/)) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: "Only JPEG and PNG files are allowed",
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
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
                phone: `+${formData.phoneCode}${formData.phone}`,
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
                            <AvatarUploader
                                currentImage={imagePreview}
                                onImageChange={(file, url) => {
                                    setFormData(prev => ({ ...prev, image: file }));
                                    setImagePreview(url);
                                }}
                                imageName={formData.firstName || 'User'}
                            />
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
                            <label>Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete="new-password"
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
                            <label>Confirm Password <span className="required">*</span></label>
                            <div className="password-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    autoComplete="new-password"
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
                    <button className="create-btn" onClick={handleSubmit}>
                        Create
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

