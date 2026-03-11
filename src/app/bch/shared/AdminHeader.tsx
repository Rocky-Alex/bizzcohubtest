"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ViewUserModal from "../users/ViewUserModal";
import EditUserModal from "../users/EditUserModal";
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

    // Auto Refresh Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState({ h: 0, m: 1, s: 0 });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Load initial settings
    useEffect(() => {
        const enabled = localStorage.getItem('autoRefreshEnabled') !== 'false';
        const h = parseInt(localStorage.getItem('autoRefreshHours') || '0');
        const m = parseInt(localStorage.getItem('autoRefreshMinutes') || '0');
        const s = parseInt(localStorage.getItem('autoRefreshSeconds') || (enabled ? '5' : '0'));

        setAutoRefreshEnabled(enabled);
        setRefreshInterval({ h, m, s: (h === 0 && m === 0 && s === 0) ? 0 : s });
    }, []);

    const saveSettings = () => {
        localStorage.setItem('autoRefreshEnabled', String(autoRefreshEnabled));
        localStorage.setItem('autoRefreshHours', String(refreshInterval.h));
        localStorage.setItem('autoRefreshMinutes', String(refreshInterval.m));
        localStorage.setItem('autoRefreshSeconds', String(refreshInterval.s));
        window.dispatchEvent(new Event('autoRefreshSettingsChanged'));
        toast.success("Settings saved");
        setIsSettingsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
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

    const handleSaveProfile = async (updatedUser: any) => {
        try {
            if (!user?.id) {
                toast.error("Please Log Out and Log In to update your session.");
                return;
            }

            let avatarUrl = updatedUser.avatar || null;

            // If there's a new image file, try to upload it to ImageKit
            if (updatedUser.image && updatedUser.image instanceof File) {
                try {
                    const formData = new FormData();
                    formData.append('file', updatedUser.image);
                    formData.append('folder', 'Profile_Pictures/Users');
                    const extension = updatedUser.image.name.split('.').pop();
                    const baseName = updatedUser.username ? updatedUser.username.replace(/\s+/g, '_') : 'user_avatar';
                    const fileName = extension ? `${baseName}.${extension}` : baseName;

                    formData.append('fileName', fileName);

                    const uploadResponse = await fetch('/api/imagekit/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json();
                        avatarUrl = uploadData.url;
                        console.log('Image uploaded successfully:', avatarUrl);
                    } else {
                        console.error('Failed to upload image, continuing with existing avatar');
                    }
                } catch (uploadError) {
                    console.error('Image upload error:', uploadError);
                }
            }

            // Prepare payload for API
            const payload = {
                id: user.id, // Ensure we use the current user's ID
                first_name: updatedUser.firstName,
                last_name: updatedUser.lastName,
                username: updatedUser.username || updatedUser.userName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                status: (updatedUser.status || 'active').toLowerCase(),
                avatar: avatarUrl,
                ...(updatedUser.password && { password: updatedUser.password })
            };

            const response = await fetch('/api/bch/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Update local state and storage
                const mergedUser = {
                    ...user,
                    ...updatedUser,
                    image_url: avatarUrl, // Update image_url for local usage
                    avatar: avatarUrl
                };

                // Cleanup unnecessary fields from merge if needed, but keeping them is generally fine for local storage wrapper

                localStorage.setItem('admin_user', JSON.stringify(mergedUser));
                setUser(mergedUser);
                toast.success("Profile updated successfully!");
                setIsEditProfileOpen(false);

                // Dispatch events
                window.dispatchEvent(new Event('admin-login')); // Update other header components if any
                window.dispatchEvent(new Event('user-updated')); // Signal AdminPage to refetch users
            } else {
                const errorData = await response.json();
                toast.error(`Failed to update profile: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error("An error occurred while updating profile.");
        }
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

            <div className="header-toggle-wrapper">
                <div className="workspace-toggle-container">
                    {(() => {
                        const isProduction = searchParams?.get('workspace') === 'production' ||
                            pathname?.startsWith('/bch/production') ||
                            pathname?.startsWith('/bch/purchase') ||
                            pathname?.startsWith('/bch/inventory');

                        return (
                            <>
                                <button
                                    onClick={() => router.push('/bch/dashboard')}
                                    className={`workspace-toggle-btn ${!isProduction ? 'active' : ''}`}
                                >
                                    Admin Panel
                                </button>
                                <button
                                    onClick={() => router.push('/bch/dashboard?workspace=production')}
                                    className={`workspace-toggle-btn ${isProduction ? 'active' : ''}`}
                                >
                                    Production
                                </button>
                            </>
                        );
                    })()}
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

                <div className="icon-btn-wrapper" ref={settingsRef} style={{ position: 'relative' }}>
                    <button className="icon-btn" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                        <i className={`fas fa-cog ${isSettingsOpen ? 'fa-spin' : ''}`} style={{ transition: 'transform 0.5s' }}></i>
                    </button>
                    {isSettingsOpen && (
                        <div className="profile-dropdown" style={{ width: '260px', right: '-50px', top: '120%', cursor: 'default' }}>
                            <div className="profile-dropdown-header">
                                <span className="user-name">Auto Refresh Settings</span>
                            </div>
                            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={autoRefreshEnabled}
                                        onChange={e => setAutoRefreshEnabled(e.target.checked)}
                                        id="enableAutoRefresh"
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="enableAutoRefresh" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Enable Auto Refresh</label>
                                </div>

                                {autoRefreshEnabled && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hours</label>
                                            <input type="number" min="0" value={refreshInterval.h} onChange={e => setRefreshInterval(prev => ({ ...prev, h: Number(e.target.value) }))} style={{ width: '100%', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mins</label>
                                            <input type="number" min="0" value={refreshInterval.m} onChange={e => setRefreshInterval(prev => ({ ...prev, m: Number(e.target.value) }))} style={{ width: '100%', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Secs</label>
                                            <input type="number" min="0" value={refreshInterval.s} onChange={e => setRefreshInterval(prev => ({ ...prev, s: Number(e.target.value) }))} style={{ width: '100%', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={saveSettings}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <i className="fas fa-save"></i> Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
                                        <span className="user-name" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{userName}</span>
                                        <span className="user-role" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role || 'Administrator'}</span>
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
