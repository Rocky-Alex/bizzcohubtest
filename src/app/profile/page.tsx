
"use client";

import React, { useEffect, useState } from 'react';
import './profile.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileOrders from '@/components/profile/ProfileOrders';

export default function ProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [activeView, setActiveView] = useState('profile-info');

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("File size too large (max 5MB)");
            return;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('folder', 'users/avatars');
        formDataUpload.append('fileName', `${userId}_${Date.now()}_${file.name} `);

        try {
            // Show loading state for image specifically if needed, or just rely on UI feedback
            const btn = document.getElementById('upload-btn-text');
            if (btn) btn.innerText = "Uploading...";

            const res = await fetch('/api/imagekit/upload', {
                method: 'POST',
                body: formDataUpload
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, image_url: data.url }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error("Failed to upload image");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Error uploading image");
        } finally {
            const btn = document.getElementById('upload-btn-text');
            if (btn) btn.innerText = "Change Photo";
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

                                    <div className="form-group">
                                        <label className="form-label">Your Gender</label>
                                        <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="radio" name="gender" value="male" disabled /> <span style={{ color: '#878787' }}>Male</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="radio" name="gender" value="female" disabled /> <span style={{ color: '#878787' }}>Female</span>
                                            </label>
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
                                        <span className="form-label" style={{ alignSelf: 'flex-start' }}>Profile Picture</span>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                                            <div className="avatar-wrapper" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('avatar-upload')?.click()}>
                                                {formData.image_url ? (
                                                    <img
                                                        src={formData.image_url}
                                                        alt="Profile"
                                                        className="avatar-circle"
                                                        style={{ width: '60px', height: '60px', fontSize: '1.5rem', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div className="avatar-circle" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                                                        {(formData.firstName || '').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('avatar-upload')?.click()}
                                                style={{ color: '#2874f0', background: 'white', border: '1px solid #e0e0e0', padding: '8px 16px', cursor: 'pointer', fontWeight: '500', borderRadius: '2px' }}
                                            >
                                                Change
                                            </button>
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '30px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>FAQs</h3>
                                        <div style={{ fontSize: '12px', color: '#1f2937' }}>
                                            <p style={{ fontWeight: '600', marginBottom: '4px' }}>What happens when I update my email address (or mobile number)?</p>
                                            <p style={{ marginBottom: '12px', color: '#666' }}>Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number).</p>
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
                                <ProfileOrders filterType="all" user={{ id: userId }} />
                            </div>
                        )}

                        {activeView === 'returns' && (
                            <div className="profile-card">
                                <ProfileOrders filterType="returns" user={{ id: userId }} />
                            </div>
                        )}

                        {activeView === 'cancelled' && (
                            <div className="profile-card">
                                <ProfileOrders filterType="cancelled" user={{ id: userId }} />
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
                                <h2 className="section-title">My Wishlist</h2>
                                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                    <p>Your wishlist is empty.</p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );

}
