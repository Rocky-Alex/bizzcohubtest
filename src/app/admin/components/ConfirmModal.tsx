import React from 'react';
import '../styles/confirm-modal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'success';
    singleButton?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    singleButton = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="admin-confirm-overlay">
            <div className={`admin-confirm-content ${type}`}>
                <div className="admin-confirm-icon">
                    {type === 'danger' && <i className="fas fa-exclamation-triangle"></i>}
                    {type === 'info' && <i className="fas fa-info-circle"></i>}
                    {type === 'success' && <i className="fas fa-check-circle"></i>}
                </div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="admin-modal-actions">
                    {!singleButton && <button className="admin-btn-cancel" onClick={onCancel}>{cancelText}</button>}
                    <button className={`admin-btn-confirm ${type}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
