import React, { useState, useRef, useEffect } from "react";

interface AdminHeaderProps {
    toggleSidebar?: () => void;
    onLogout?: () => void;
}

export default function AdminHeader({ toggleSidebar, onLogout }: AdminHeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="admin-header-nav">
            <div className="header-left">
                <div className="header-search">
                    <i className="fas fa-search search-icon"></i>
                    <input type="text" placeholder="Search" className="search-input" />
                    <span className="search-shortcut">⌘ K</span>
                </div>
            </div>

            <div className="header-right">
                <button className="icon-btn">
                    <i className="fas fa-expand"></i>
                </button>

                <button className="icon-btn notification-btn">
                    <i className="fas fa-envelope"></i>
                    <span className="badge-count">1</span>
                </button>

                <button className="icon-btn">
                    <i className="fas fa-bell"></i>
                </button>

                <button className="icon-btn">
                    <i className="fas fa-cog"></i>
                </button>

                <div className="header-profile" ref={dropdownRef}>
                    <img
                        src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
                        alt="User"
                        className="header-avatar"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    />

                    {isProfileOpen && (
                        <div className="profile-dropdown">
                            <div className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                                <i className="fas fa-user-circle"></i> Profile View
                            </div>
                            <div className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                                <i className="fas fa-sliders-h"></i> Profile Settings
                            </div>
                            <div className="dropdown-item text-red" onClick={() => {
                                setIsProfileOpen(false);
                                if (onLogout) onLogout();
                            }}>
                                <i className="fas fa-sign-out-alt"></i> Log Out
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
