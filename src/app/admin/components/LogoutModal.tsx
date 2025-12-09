import React from 'react';
import '../styles/logout-modal.css';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
    if (!isOpen) return null;

    return (
        <div className="logout-modal-overlay" onClick={onClose}>
            <div className="logout-modal-content" onClick={e => e.stopPropagation()}>
                <div className="logout-modal-icon">
                    <i className="fas fa-sign-out-alt"></i>
                </div>
                <h3 className="logout-modal-title">Confirm Logout</h3>
                <p className="logout-modal-description">
                    Are you sure you want to log out of the admin panel?
                </p>
                <div className="logout-modal-actions">
                    <button className="logout-btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="logout-btn-confirm" onClick={onConfirm}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
