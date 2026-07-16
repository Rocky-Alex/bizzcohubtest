import React from 'react';
import Link from 'next/link';
import { User, Package, Wallet, Folder, ChevronRight, Power } from 'lucide-react';
import Image from 'next/image';
import imageKitLoader from '@/utils/imageLoader';
import './ProfileSidebar.css';

interface ProfileSidebarProps {
    user: {
        name: string;
        image_url?: string;
    };
    activeSection?: string;
    onLogout?: () => void;
    onNavigate?: (section: string) => void;
    theme?: 'light' | 'dark';
    onToggleTheme?: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    user,
    activeSection = 'profile-info',
    onLogout,
    onNavigate,
    theme = 'dark'
}) => {

    const handleNav = (section: string, e: React.MouseEvent) => {
        if (onNavigate) {
            e.preventDefault();
            onNavigate(section);
        }
    };

    return (
        <div className="profile-sidebar">
            {/* User Greeting Card */}
            <div className="sidebar-user-card">
                <div className="user-avatar-container">
                    {user.image_url ? (
                        <div className="sidebar-avatar-wrapper" style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden' }}>
                            <Image
                                loader={imageKitLoader}
                                src={user.image_url}
                                alt="Profile"
                                fill
                                style={{ objectFit: 'cover' }}
                                className="sidebar-avatar"
                            />
                        </div>
                    ) : (
                        <div className="sidebar-avatar-placeholder">
                            <User size={24} />
                        </div>
                    )}
                </div>
                <div className="user-greeting">
                    <span className="greeting-text">Hello,</span>
                    <span className="user-name">{user.name || 'User'}</span>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="sidebar-menu">
                {/* Account Settings */}
                <div className="menu-group active-group">
                    <div className="menu-header">
                        <div className="menu-icon text-blue">
                            <User size={20} />
                        </div>
                        <span className="menu-title">ACCOUNT SETTINGS</span>
                    </div>
                    <div className="submenu">
                        <a href="#" onClick={(e) => handleNav('dashboard', e)} className={`submenu-item ${activeSection === 'dashboard' ? 'active' : ''}`}>
                            Dashboard
                        </a>
                        <a href="#" onClick={(e) => handleNav('profile-info', e)} className={`submenu-item ${activeSection === 'profile-info' ? 'active' : ''}`}>
                            Manage Profile
                        </a>
                        <a href="#" onClick={(e) => handleNav('qc-user-management', e)} className={`submenu-item ${activeSection === 'qc-user-management' ? 'active' : ''}`}>
                            QC User Management
                        </a>
                        <a href="#" onClick={(e) => handleNav('qc-management', e)} className={`submenu-item ${activeSection === 'qc-management' ? 'active' : ''}`}>
                            QC Management
                        </a>
                    </div>
                </div>

                {/* My Orders */}
                <div className="menu-group">
                    <div className="menu-header">
                        <div className="menu-icon text-blue">
                            <Package size={20} />
                        </div>
                        <span className="menu-title">MY ORDERS</span>
                    </div>
                    <div className="submenu">
                        <a href="#" onClick={(e) => handleNav('orders', e)} className={`submenu-item ${activeSection === 'orders' ? 'active' : ''}`}>
                            All Orders
                        </a>
                        <a href="#" onClick={(e) => handleNav('delivered', e)} className={`submenu-item ${activeSection === 'delivered' ? 'active' : ''}`}>
                            Delivered Orders
                        </a>
                        <a href="#" onClick={(e) => handleNav('returns', e)} className={`submenu-item ${activeSection === 'returns' ? 'active' : ''}`}>
                            Returns
                        </a>
                        <a href="#" onClick={(e) => handleNav('cancelled', e)} className={`submenu-item ${activeSection === 'cancelled' ? 'active' : ''}`}>
                            Cancelled Orders
                        </a>
                    </div>
                </div>

                {/* Payments */}
                <div className="menu-group">
                    <div className="menu-header">
                        <div className="menu-icon text-blue">
                            <Wallet size={20} />
                        </div>
                        <span className="menu-title">PAYMENTS</span>
                    </div>
                    <div className="submenu">
                        <a href="#" onClick={(e) => handleNav('gift-cards', e)} className={`submenu-item ${activeSection === 'gift-cards' ? 'active' : ''}`}>
                            Gift Cards <span className="balance">₹0</span>
                        </a>
                        <a href="#" onClick={(e) => handleNav('saved-upi', e)} className={`submenu-item ${activeSection === 'saved-upi' ? 'active' : ''}`}>
                            Saved UPI
                        </a>
                        <a href="#" onClick={(e) => handleNav('saved-cards', e)} className={`submenu-item ${activeSection === 'saved-cards' ? 'active' : ''}`}>
                            Saved Cards
                        </a>
                    </div>
                </div>

                {/* My Stuff */}
                <div className="menu-group">
                    <div className="menu-header">
                        <div className="menu-icon text-blue">
                            <Folder size={20} />
                        </div>
                        <span className="menu-title">MY STUFF</span>
                    </div>
                    <div className="submenu">

                        <a href="#" onClick={(e) => handleNav('wishlist', e)} className={`submenu-item ${activeSection === 'wishlist' ? 'active' : ''}`}>
                            My Wishlist
                        </a>
                    </div>
                </div>

                {/* Logout - Added for convenience */}
                <div className="menu-group">
                    <button onClick={onLogout} className="menu-header logout-btn">
                        <div className="menu-icon text-gray">
                            <Power size={20} />
                        </div>
                        <span className="menu-title">LOGOUT</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProfileSidebar;
