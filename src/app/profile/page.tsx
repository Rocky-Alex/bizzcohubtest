
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import './profile.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import CustomerDashboard from '@/components/profile/CustomerDashboard';
import ProfileOrders from '@/components/profile/ProfileOrders';
import ProfileWishlist from '@/components/profile/ProfileWishlist';
import AvatarUploader from '@/components/ui/AvatarUploader';

function ProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('dashboard');

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
                    phone: u.phone || '',
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
        formDataUpload.append('file', blob, 'avatar.jpg'); // ImageKit expects a file/blob
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

                // Immediately update user profile in DB with new image to save user from clicking "Save" again?
                // Or just keep it in state. Let's update DB too for instant gratification/persistence.
                if (userId) {
                    await fetch('/api/customer/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: userId,
                            image_url: data.url
                        })
                    });

                    // Update local storage
                    const storedUser = JSON.parse(localStorage.getItem('customer_user') || '{}');
                    storedUser.image_url = data.url;
                    localStorage.setItem('customer_user', JSON.stringify(storedUser));

                    // Notify components
                    window.dispatchEvent(new Event('user-login'));

                    // Delete old image to save storage
                    if (formData.image_url && formData.image_url.includes('ik.imagekit.io')) {
                        fetch(`/api/imagekit/upload?url=${encodeURIComponent(formData.image_url)}`, {
                            method: 'DELETE',
                        }).then(r => r.json()).then(d => console.log('Old avatar cleanup:', d)).catch(e => console.error('Old avatar cleanup failed:', e));
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
        if (!confirm('Are you sure you want to deactivate your account? It will be preserved for 60 days, then permanently deleted if you do not login.')) {
            return;
        }

        try {
            toast.loading('Deactivating account...');
            const res = await fetch('/api/customer/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deactivate', customer_id: userId })
            });

            const data = await res.json();

            if (res.ok) {
                toast.dismiss();
                toast.success(data.message);

                // Logout flow
                localStorage.removeItem('customer_user');
                window.dispatchEvent(new Event('user-logout'));
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                toast.dismiss();
                toast.error(data.error || 'Failed to deactivate account');
            }
        } catch (error) {
            console.error('Deactivation Error:', error);
            toast.error('An error occurred');
        }
    };

    const handleDelete = async () => {
        if (!userId) return;
        if (!confirm('WARNING: Are you sure you want to PERMANENTLY delete your account? This action CANNOT be undone and will delete all your orders, wishlist, and personal data immediately.')) {
            return;
        }

        const doubleConfirm = prompt('Type "DELETE" to confirm permanent deletion:');
        if (doubleConfirm !== 'DELETE') {
            if (doubleConfirm !== null) toast.error('Incorrect confirmation text. Deletion cancelled.');
            return;
        }

        try {
            toast.loading('Deleting account...');
            const res = await fetch('/api/customer/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', customer_id: userId })
            });

            const data = await res.json();

            if (res.ok) {
                toast.dismiss();
                toast.success(data.message);

                // Logout flow
                localStorage.removeItem('customer_user');
                window.dispatchEvent(new Event('user-logout'));
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                toast.dismiss();
                toast.error(data.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Deletion Error:', error);
            toast.error('An error occurred');
        }
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
                    name: `${firstName} ${lastName} `.trim(),
                    ...rest
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Profile updated successfully!');
                // Update local storage name if changed
                const storedUser = JSON.parse(localStorage.getItem('customer_user') || '{}');
                storedUser.name = data.user.name;
                storedUser.username = data.user.username;
                if (data.user.image_url) storedUser.image_url = data.user.image_url; // Update image in storage too

                localStorage.setItem('customer_user', JSON.stringify(storedUser));
                // Notify Header
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
        <div className="profile-container">
            {/* Title can be removed or kept, user image showed it inside the sidebar mainly, but usually a page has a title or breadcrumb */}

            <div className="profile-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 3fr', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Sidebar */}
                <div className="profile-sidebar-wrapper">
                    <ProfileSidebar
                        user={{
                            name: formData.firstName ? `${formData.firstName} ${formData.lastName} ` : (formData.username || 'User'),
                            image_url: formData.image_url
                        }}
                        activeSection={activeView}
                        onNavigate={(section) => setActiveView(section)}
                        onLogout={() => {
                            localStorage.removeItem('customer_user');
                            window.location.href = '/login';
                        }}
                    />
                </div>

                {/* Main Content Area */}
                <div className="profile-content">
                    {activeView === 'dashboard' && (
                        <CustomerDashboard user={{ id: userId, email: userEmail }} />
                    )}
                    <form onSubmit={handleSave}>
                        {activeView === 'profile-info' && (
                            <div className="profile-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h2 className="section-title" style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Personal Information</h2>
                                    <button type="submit" disabled={saving} style={{ color: '#2874f0', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {saving ? 'Saving...' : 'Edit'}
                                    </button>
                                </div>

                                <div className="form-grid">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">First Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Last Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>



                                    <div className="form-group" style={{ marginTop: '20px' }}>
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Mobile Number</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Currency Preference</label>
                                        <select
                                            className="form-input"
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleChange as any}
                                        >
                                            <option value="AED">AED</option>
                                            <option value="USD">USD</option>
                                            <option value="INR">INR</option>
                                        </select>
                                    </div>

                                    <div className="avatar-section" style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                                        <span className="form-label" style={{ alignSelf: 'flex-start', marginBottom: '1rem', display: 'block' }}>Profile Picture</span>
                                        <AvatarUploader
                                            currentImage={formData.image_url}
                                            nameInitial={(formData.firstName || '').charAt(0)}
                                            onImageSelected={handleAvatarUpdate}
                                        />
                                    </div>

                                    {/* Account Settings Section */}
                                    <div className="account-settings-section" style={{ marginTop: '30px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Account Settings</h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>Deactivate Account</div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                        Deactivating your account is temporary. Your account will only be permanently deleted if you do not login within 60 days.
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleDeactivate}
                                                    style={{ color: '#2874f0', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                                                >
                                                    Deactivate
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626' }}>Delete Account</div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                        Permanently delete your account and all associated data. This action cannot be undone.
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleDelete}
                                                    style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>



                                    <button type="submit" className="save-btn" disabled={saving}>
                                        {saving ? 'Saving Changes...' : 'Save Personal Information'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeView === 'addresses' && (
                            <div className="profile-card">
                                <h2 className="section-title">Manage Addresses</h2>

                                <div className="address-section">
                                    <div className="address-header">Billing Address</div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Billing Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="billing_name"
                                                value={formData.billing_name}
                                                onChange={handleChange}
                                                placeholder="Same as Full Name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Address Line 1</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="billing_address_1"
                                                value={formData.billing_address_1}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">City</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    name="billing_city"
                                                    value={formData.billing_city}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">State</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    name="billing_state"
                                                    value={formData.billing_state}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Country</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    name="billing_country"
                                                    value={formData.billing_country}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">ZIP / Postal Code</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    name="billing_zip"
                                                    value={formData.billing_zip}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="address-section" style={{ marginTop: '24px' }}>
                                    <div className="address-header">Shipping Address</div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Shipping Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="shipping_name"
                                                value={formData.shipping_name}
                                                onChange={handleChange}
                                                placeholder="Recipient Name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Address Line 1</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="shipping_address_1"
                                                value={formData.shipping_address_1}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">City</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    name="shipping_city"
                                                    value={formData.shipping_city}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">State</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    name="shipping_state"
                                                    value={formData.shipping_state}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Country</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    name="shipping_country"
                                                    value={formData.shipping_country}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">ZIP / Postal Code</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    name="shipping_zip"
                                                    value={formData.shipping_zip}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="save-btn" disabled={saving}>
                                    {saving ? 'Saving Changes...' : 'Save Addresses'}
                                </button>
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
                                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                    <p>You have no active gift cards.</p>
                                </div>
                            </div>
                        )}

                        {activeView === 'saved-upi' && (
                            <div className="profile-card">
                                <h2 className="section-title">Saved UPI</h2>
                                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                    <p>No UPI IDs saved.</p>
                                </div>
                            </div>
                        )}

                        {activeView === 'saved-cards' && (
                            <div className="profile-card">
                                <h2 className="section-title">Saved Cards</h2>
                                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                    <p>Save your credit/debit cards for faster checkout.</p>
                                </div>
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
        <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading...</div></div>}>
            <ProfileContent />
        </Suspense>
    );
}
