
"use client";

import { useTheme } from '@/context/ThemeContext';

import React, { useEffect, useState, Suspense } from 'react';
import './profile.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { Country } from 'country-state-city';
import PhoneInputWithCountry from '@/components/ui/PhoneInputWithCountry';

// Consolidated Profile Management - Fixed Syntax Error
// Timestamp: 2025-12-23T22:30

// Dynamic imports for code splitting
const CustomerDashboard = dynamic(() => import('@/components/profile/CustomerDashboard'), {
    loading: () => <div className="loading-placeholder">Loading Dashboard...</div>
});
const ProfileOrders = dynamic(() => import('@/components/profile/ProfileOrders'), {
    loading: () => <div className="loading-placeholder">Loading Orders...</div>
});
const ProfileWishlist = dynamic(() => import('@/components/profile/ProfileWishlist'), {
    loading: () => <div className="loading-placeholder">Loading Wishlist...</div>
});
const AvatarUploader = dynamic(() => import('@/components/ui/AvatarUploader'), { ssr: false });

function ProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('dashboard');
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const view = searchParams.get('view');
        if (view) {
            setActiveView(view);
        }
    }, [searchParams]);

    // Profile Data State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        phoneCode: '971',
        image_url: '',
        currency: 'AED',

        billing_name: '',
        billing_address_1: '',
        billing_country: '',
        billing_state: '',
        billing_city: '',
        billing_zip: '',

        shipping_name: '',
        shipping_address_1: '',
        shipping_country: '',
        shipping_state: '',
        shipping_city: '',
        shipping_zip: ''
    });

    useEffect(() => {
        // Auth Check
        const storedUser = localStorage.getItem('customer_user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(storedUser);
        setUserId(user.id);
        setUserEmail(user.email);
        fetchProfile(user.id);
    }, [router]);

    const fetchProfile = async (id: number) => {
        try {
            const res = await fetch(`/api/customer/profile?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                const u = data.user;
                setFormData({
                    firstName: (u.name || '').split(' ')[0] || '',
                    lastName: (u.name || '').split(' ').slice(1).join(' ') || '',
                    username: u.username || '',
                    email: u.email || '',
                    phone: (() => {
                        const allC = Country.getAllCountries();
                        const sorted = [...allC].sort((a, b) => b.phonecode.length - a.phonecode.length);
                        const p = u.phone || '';
                        const clean = p.startsWith('+') ? p.slice(1) : p;
                        const match = sorted.find(c => clean.startsWith(c.phonecode));
                        return match ? clean.slice(match.phonecode.length) : clean;
                    })(),
                    phoneCode: (() => {
                        const p = u.phone || '';
                        if (!p) return '971';
                        const allC = Country.getAllCountries();
                        const sorted = [...allC].sort((a, b) => b.phonecode.length - a.phonecode.length);
                        const clean = p.startsWith('+') ? p.slice(1) : p;
                        const match = sorted.find(c => clean.startsWith(c.phonecode));
                        return match ? match.phonecode : '971';
                    })(),
                    image_url: u.image_url || '',
                    currency: u.currency || 'AED',

                    billing_name: u.billing_name || '',
                    billing_address_1: u.billing_address_1 || '',
                    billing_country: u.billing_country || '',
                    billing_state: u.billing_state || '',
                    billing_city: u.billing_city || '',
                    billing_zip: u.billing_zip || '',

                    shipping_name: u.shipping_name || '',
                    shipping_address_1: u.shipping_address_1 || '',
                    shipping_country: u.shipping_country || '',
                    shipping_state: u.shipping_state || '',
                    shipping_city: u.shipping_city || '',
                    shipping_zip: u.shipping_zip || ''
                });
            } else {
                console.error('Failed to load profile');
                if (res.status === 404 || res.status === 410) {
                    localStorage.removeItem('customer_user');
                    router.push('/login');
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarUpdate = async (blob: Blob) => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', blob, 'avatar.jpg');
        formDataUpload.append('folder', 'Profile_Pictures/Customers');
        formDataUpload.append('fileName', `${userId}_${Date.now()}_avatar.jpg`);

        try {
            const res = await fetch('/api/imagekit/upload', {
                method: 'POST',
                body: formDataUpload
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, image_url: data.url }));

                if (userId) {
                    await fetch('/api/customer/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: userId,
                            image_url: data.url
                        })
                    });

                    const storedUser = JSON.parse(localStorage.getItem('customer_user') || '{}');
                    storedUser.image_url = data.url;
                    localStorage.setItem('customer_user', JSON.stringify(storedUser));
                    window.dispatchEvent(new Event('user-login'));

                    if (formData.image_url && formData.image_url.includes('ik.imagekit.io')) {
                        fetch(`/api/imagekit/upload?url=${encodeURIComponent(formData.image_url)}`, {
                            method: 'DELETE',
                        }).catch(e => console.error('Old avatar cleanup failed:', e));
                    }
                }
                toast.success('Profile picture updated!');
            } else {
                toast.error("Failed to upload image");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Error uploading image");
        }
    };

    const handleDeactivate = async () => {
        if (!userId) return;
        if (!confirm('Are you sure you want to deactivate your account?')) return;
        try {
            const res = await fetch('/api/customer/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deactivate', customer_id: userId })
            });
            if (res.ok) {
                localStorage.removeItem('customer_user');
                window.location.href = '/login';
            }
        } catch (error) { console.error(error); }
    };

    const handleDelete = async () => {
        if (!userId) return;
        if (prompt('Type DELETE to confirm') !== 'DELETE') return;
        try {
            const res = await fetch('/api/customer/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', customer_id: userId })
            });
            if (res.ok) {
                localStorage.removeItem('customer_user');
                window.location.href = '/login';
            }
        } catch (error) { console.error(error); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { firstName, lastName, ...rest } = formData;
            const res = await fetch('/api/customer/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    name: `${firstName} ${lastName}`.trim(),
                    // Override phone with concatenated version
                    ...rest,
                    phone: `+${formData.phoneCode}${formData.phone}`,
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Profile updated successfully!');
                const storedUser = JSON.parse(localStorage.getItem('customer_user') || '{}');
                storedUser.name = data.user.name;
                localStorage.setItem('customer_user', JSON.stringify(storedUser));
                window.dispatchEvent(new Event('user-login'));
            } else {
                toast.error('Failed to update profile.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('An error occurred.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading Profile...</div>
            </div>
        );
    }

    return (
        <div className={`profile-container theme-${theme}`}>
            <div className="profile-layout">
                <div className="profile-sidebar-wrapper">
                    <ProfileSidebar
                        user={{
                            name: formData.firstName ? `${formData.firstName} ${formData.lastName}` : (formData.username || 'User'),
                            image_url: formData.image_url
                        }}
                        activeSection={activeView}
                        onNavigate={(section) => setActiveView(section)}
                        onLogout={() => {
                            localStorage.removeItem('customer_user');
                            window.location.href = '/login';
                        }}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                    />
                </div>

                <div className="profile-content">
                    {activeView === 'dashboard' && (
                        <CustomerDashboard
                            user={{ id: userId, email: userEmail }}
                            theme={theme}
                            onToggleTheme={toggleTheme}
                        />
                    )}

                    <form onSubmit={handleSave}>
                        {activeView === 'profile-info' && (
                            <div className="profile-card">
                                <div style={{ marginBottom: '24px' }}>
                                    <h2 className="section-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', margin: 0 }}>Manage Profile</h2>
                                </div>

                                <div className="form-grid">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">First Name</label>
                                            <input type="text" className="form-input" name="firstName" value={formData.firstName} onChange={handleChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Last Name</label>
                                            <input type="text" className="form-input" name="lastName" value={formData.lastName} onChange={handleChange} required />
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: '20px' }}>
                                        <label className="form-label">Email Address</label>
                                        <input type="email" className="form-input" name="email" value={formData.email} onChange={handleChange} required />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Mobile Number</label>
                                        <PhoneInputWithCountry
                                            value={formData.phone}
                                            countryCode={formData.phoneCode}
                                            onChange={(code, num) => setFormData(prev => ({ ...prev, phoneCode: code, phone: num }))}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Currency Preference</label>
                                        <select className="form-input" name="currency" value={formData.currency} onChange={handleChange as any}>
                                            <option value="AED">AED</option>
                                            <option value="USD">USD</option>
                                            <option value="INR">INR</option>
                                        </select>
                                    </div>

                                    <div className="avatar-section" style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                        <span className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Profile Picture</span>
                                        <AvatarUploader
                                            currentImage={formData.image_url}
                                            nameInitial={(formData.firstName || '').charAt(0)}
                                            onImageSelected={handleAvatarUpdate}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '40px' }}>
                                    <h2 className="section-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Address Management</h2>
                                </div>

                                <div className="address-section">
                                    <div className="address-header">Billing Address</div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Billing Name</label>
                                            <input type="text" className="form-input" name="billing_name" value={formData.billing_name} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Address Line 1</label>
                                            <input type="text" className="form-input" name="billing_address_1" value={formData.billing_address_1} onChange={handleChange} />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">City</label>
                                                <input type="text" className="form-input" name="billing_city" value={formData.billing_city} onChange={handleChange} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">State</label>
                                                <input type="text" className="form-input" name="billing_state" value={formData.billing_state} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Country</label>
                                                <input type="text" className="form-input" name="billing_country" value={formData.billing_country} onChange={handleChange} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">ZIP Code</label>
                                                <input type="text" className="form-input" name="billing_zip" value={formData.billing_zip} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="address-header" style={{ marginTop: '24px' }}>Shipping Address</div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Shipping Name</label>
                                            <input type="text" className="form-input" name="shipping_name" value={formData.shipping_name} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Address Line 1</label>
                                            <input type="text" className="form-input" name="shipping_address_1" value={formData.shipping_address_1} onChange={handleChange} />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">City</label>
                                                <input type="text" className="form-input" name="shipping_city" value={formData.shipping_city} onChange={handleChange} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">State</label>
                                                <input type="text" className="form-input" name="shipping_state" value={formData.shipping_state} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Country</label>
                                                <input type="text" className="form-input" name="shipping_country" value={formData.shipping_country} onChange={handleChange} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">ZIP Code</label>
                                                <input type="text" className="form-input" name="shipping_zip" value={formData.shipping_zip} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="save-btn" disabled={saving} style={{ width: 'auto', padding: '12px 32px' }}>
                                        {saving ? 'Saving...' : 'Save Profile Settings'}
                                    </button>
                                </div>

                                <div className="account-settings-section" style={{ marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Danger Zone</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Deactivate Account</span>
                                            <button type="button" onClick={handleDeactivate} style={{ color: 'var(--primary)' }}>Deactivate</button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#dc2626' }}>Delete Account</span>
                                            <button type="button" onClick={handleDelete} style={{ color: '#dc2626' }}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeView === 'orders' && (
                            <div className="profile-card">
                                <ProfileOrders filterType="all" user={{ id: userEmail }} />
                            </div>
                        )}

                        {activeView === 'delivered' && (
                            <div className="profile-card">
                                <ProfileOrders filterType="delivered" user={{ id: userEmail }} />
                            </div>
                        )}

                        {activeView === 'returns' && (
                            <div className="profile-card">
                                <ProfileOrders filterType="returns" user={{ id: userEmail }} />
                            </div>
                        )}

                        {activeView === 'cancelled' && (
                            <div className="profile-card">
                                <ProfileOrders filterType="cancelled" user={{ id: userEmail }} />
                            </div>
                        )}

                        {activeView === 'gift-cards' && (
                            <div className="profile-card">
                                <h2 className="section-title">Gift Cards</h2>
                                <div style={{ padding: '20px', textAlign: 'center' }}>No active gift cards.</div>
                            </div>
                        )}

                        {activeView === 'wishlist' && (
                            <div className="profile-card">
                                <ProfileWishlist user={{ id: userEmail }} />
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="loading-placeholder">Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
