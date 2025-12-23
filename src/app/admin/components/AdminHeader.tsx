import React, { useState, useRef, useEffect } from "react";
import ViewUserModal from "./ViewUserModal";
import EditUserModal from "./EditUserModal";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

interface AdminHeaderProps {
    toggleSidebar?: () => void;
    onLogout?: () => void;
    roles?: string[];
}

export default function AdminHeader({ toggleSidebar, onLogout, roles = ['Administrator', 'Editor', 'Viewer'] }: AdminHeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
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

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = () => {
            const stored = localStorage.getItem('admin_user');
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse admin user", e);
                }
            }
        };
        loadUser();
        window.addEventListener('admin-login', loadUser);
        return () => window.removeEventListener('admin-login', loadUser);
    }, []);

    const userImage = user?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.username || 'Admin User')}&background=0D8ABC&color=fff`;
    const userName = user?.name || user?.username || 'Admin';

    const handleEditProfile = () => {
        setIsViewProfileOpen(false);
        setIsEditProfileOpen(true);
    };

    const handleSaveProfile = (updatedUser: any) => {
        // In a real app, you would make an API call here to update the user in the backend.
        // For now, we update the local state and localStorage.

        const mergedUser = { ...user, ...updatedUser };

        // Ensure image_url is preserved or updated if avatar is returned
        if (updatedUser.avatar && typeof updatedUser.avatar === 'string') {
            mergedUser.image_url = updatedUser.avatar;
        }

        localStorage.setItem('admin_user', JSON.stringify(mergedUser));
        setUser(mergedUser);
        toast.success("Profile updated successfully!");
        setIsEditProfileOpen(false);

        // Dispatch event to notify valid changes if needed
        window.dispatchEvent(new Event('admin-login'));
    };

    const { theme, toggleTheme } = useTheme();

    return (
        <header className="admin-header-nav">
            <div className="header-left">
                <button className="sidebar-toggle icon-btn" onClick={toggleSidebar} style={{ marginRight: '1rem' }}>
                    <i className="fas fa-bars"></i>
                </button>
                <div className="header-search">
                    <i className="fas fa-search search-icon"></i>
                    <input type="text" placeholder="Search..." className="search-input" />
                </div>
            </div>

            <div className="header-right">
                <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                    <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
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
                        src={userImage}
                        alt="User"
                        className="header-avatar"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        onError={(e) => {
                            // Fallback if image load fails
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;
                        }}
                    />

                    {isProfileOpen && (
                        <div className="profile-dropdown">
                            {user && (
                                <div className="profile-dropdown-header">
                                    <img
                                        src={userImage}
                                        alt="User"
                                        className="user-avatar-small"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;
                                        }}
                                    />
                                    <div className="user-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <span className="user-name" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{userName}</span>
                                        <span className="user-role" style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.role || 'Administrator'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="dropdown-item" onClick={() => {
                                setIsProfileOpen(false);
                                setIsEditProfileOpen(true);
                            }}>
                                <i className="fas fa-edit"></i> Profile Settings
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

            <ViewUserModal
                isOpen={isViewProfileOpen}
                onClose={() => setIsViewProfileOpen(false)}
                user={user}
                onEdit={handleEditProfile}
            />

            <EditUserModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                onSubmit={handleSaveProfile}
                user={user}
                roles={roles}
            />
        </header>
    );
}
