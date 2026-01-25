"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './confirm-modal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="custom-modal-overlay">
            <div className={`custom-modal-content ${type}`}>
                <div className="icon-wrapper">
                    {type === 'danger' && <i className="fas fa-exclamation-triangle"></i>}
                    {type === 'info' && <i className="fas fa-info-circle"></i>}
                    {type === 'success' && <i className="fas fa-check-circle"></i>}
                </div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    {!singleButton && <button className="btn-cancel" onClick={onCancel}>{cancelText}</button>}
                    <button className={`btn-confirm ${type}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
