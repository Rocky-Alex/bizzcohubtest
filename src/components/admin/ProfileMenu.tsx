import React, { useState, useRef, useEffect } from 'react';
import './ProfileMenu.css';

interface ProfileMenuProps {
    username?: string;
    userRole: string;
    onLogout: () => void;
}

export default function ProfileMenu({ username = 'Admin', userRole, onLogout }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getRoleDisplay = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return '#10b981'; // Green
            case 'accountant':
                return '#3b82f6'; // Blue
            default:
                return '#6b7280'; // Gray
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="profile-menu-container" ref={menuRef}>
            <button
                className="profile-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Profile menu"
            >
                <div className="profile-avatar" style={{ borderColor: getRoleColor(userRole) }}>
                    {getInitials(username)}
                </div>
                <span className="profile-username">{username}</span>
            </button>

            {isOpen && (
                <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                        <div className="profile-avatar-large" style={{ borderColor: getRoleColor(userRole) }}>
                            {getInitials(username)}
                        </div>
                        <div className="profile-details">
                            <h4>{username}</h4>
                            <span className="role-badge" style={{ backgroundColor: getRoleColor(userRole) }}>
                                {getRoleDisplay(userRole)}
                            </span>
                        </div>
                    </div>

                    <div className="profile-dropdown-divider"></div>

                    <div className="profile-dropdown-menu">
                        <button className="profile-menu-item" onClick={() => {
                            setIsOpen(false);
                            // Navigate to profile settings if needed
                        }}>
                            <i className="fas fa-user"></i>
                            <span>My Profile</span>
                        </button>

                        <button className="profile-menu-item" onClick={() => {
                            setIsOpen(false);
                            // Navigate to settings if needed
                        }}>
                            <i className="fas fa-cog"></i>
                            <span>Settings</span>
                        </button>

                        {userRole === 'admin' && (
                            <button className="profile-menu-item" onClick={() => {
                                setIsOpen(false);
                                window.open('/', '_blank');
                            }}>
                                <i className="fas fa-external-link-alt"></i>
                                <span>View Site</span>
                            </button>
                        )}
                    </div>

                    <div className="profile-dropdown-divider"></div>

                    <div className="profile-dropdown-footer">
                        <button className="profile-menu-item logout" onClick={() => {
                            setIsOpen(false);
                            onLogout();
                        }}>
                            <i className="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
