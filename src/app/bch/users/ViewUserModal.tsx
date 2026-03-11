"use client";

import React from "react";
import "./EditUserModal.css"; // Reuse styling

interface ViewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onEdit?: () => void;
}

export default function ViewUserModal({ isOpen, onClose, user, onEdit }: ViewUserModalProps) {
    if (!isOpen || !user) return null;

    const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    const avatarUrl = user.image_url || user.avatar || user.avatar_url;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="view-user-modal animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Profile Details</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Profile Header Block */}
                    <div className="profile-header-block">
                        <div className="profile-avatar-wrapper">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user.name} className="profile-avatar-img" />
                            ) : (
                                <div className="profile-avatar-placeholder">{initials}</div>
                            )}
                        </div>

                        <div className="profile-title-section">
                            <h3 className="profile-name">{user.name}</h3>
                            <div className="profile-badges">
                                <span className={`role-badge ${user.role?.toLowerCase() || 'admin'}`}>
                                    {user.role || 'Administrator'}
                                </span>
                                <span className="status-badge active">
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></span>
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    {/* Details Grid */}
                    <div className="details-grid-container">
                        <div className="detail-item">
                            <label>Username</label>
                            <div className="detail-value">
                                <i className="fas fa-user-tag"></i>
                                {user.username}
                            </div>
                        </div>

                        <div className="detail-item">
                            <label>Email Address</label>
                            <div className="detail-value">
                                <i className="fas fa-envelope"></i>
                                {user.email || 'Not provided'}
                            </div>
                        </div>

                        <div className="detail-item">
                            <label>Phone Number</label>
                            <div className="detail-value">
                                <i className="fas fa-phone"></i>
                                {user.phone || 'Not provided'}
                            </div>
                        </div>

                        <div className="detail-item">
                            <label>Member Since</label>
                            <div className="detail-value">
                                <i className="fas fa-calendar-alt"></i>
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Dec 2025'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="close-action-btn" onClick={onClose}>
                        Close
                    </button>
                    {onEdit && (
                        <button className="edit-action-btn" onClick={onEdit}>
                            <i className="fas fa-pen"></i> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .view-user-modal {
                    background: white;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 550px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .modal-header {
                    padding: 1.5rem 2rem;
                    background: linear-gradient(to right, #ffffff, #f9fafb);
                    border-bottom: 1px solid #f3f4f6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #111827;
                    margin: 0;
                    letter-spacing: -0.025em;
                }

                .close-btn {
                    background: white;
                    border: 1px solid #e5e7eb;
                    color: #6b7280;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }

                .close-btn:hover {
                    background: #f9fafb;
                    color: #111827;
                    border-color: #d1d5db;
                }

                .modal-body {
                    padding: 2.5rem 2rem;
                }

                .profile-header-block {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .profile-avatar-wrapper {
                    position: relative;
                    margin-bottom: 1.25rem;
                    display: inline-block;
                }

                .profile-avatar-img {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid white;
                    box-shadow: 0 0 0 1px #e5e7eb, 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }

                .profile-avatar-placeholder {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: 700;
                    border: 4px solid white;
                    box-shadow: 0 0 0 1px #e5e7eb, 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }

                .profile-name {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #111827;
                    margin: 0 0 0.75rem 0;
                    letter-spacing: -0.025em;
                }

                .profile-badges {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: center;
                    align-items: center;
                }

                .role-badge {
                    width: 150px;
                    height: 44px;
                    border-radius: 9999px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #dbeafe;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .role-badge.admin {
                    background: #eff6ff;
                    color: #2563eb;
                }

                .status-badge {
                    width: 150px;
                    height: 44px;
                    border-radius: 9999px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #dbeafe;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .status-badge.active {
                    background: #ecfdf5;
                    color: #059669;
                    border: 1px solid #d1fae5;
                }

                .divider {
                    height: 1px;
                    background: #f3f4f6;
                    margin: 0 -2rem 2.5rem -2rem;
                }

                .details-grid-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .detail-item label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.5rem;
                }

                .detail-value {
                    background: white;
                    padding: 0.875rem 1rem;
                    border-radius: 12px;
                    color: #1f2937;
                    font-size: 0.95rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    transition: border-color 0.2s;
                }
                
                .detail-value:hover {
                    border-color: #d1d5db;
                }

                .detail-value i {
                    color: #9ca3af;
                    font-size: 1.1rem;
                }

                .modal-footer {
                    padding: 1.5rem 2rem;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .close-action-btn {
                    padding: 0.75rem 1.5rem;
                    border: 1px solid #d1d5db;
                    background: white;
                    color: #374151;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }

                .close-action-btn:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                    color: #111827;
                }

                .edit-action-btn {
                    padding: 0.75rem 1.5rem;
                    background: #111827;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }

                .edit-action-btn:hover {
                    background: #000;
                    transform: translateY(-1px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }

                @media (max-width: 640px) {
                    .details-grid-container {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
