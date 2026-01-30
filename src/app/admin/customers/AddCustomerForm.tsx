import React, { useState } from 'react';
import './AddCustomerForm.css';
import { Country, State, City } from 'country-state-city';
import AvatarUploader from '@/components/ui/AvatarUploader';
import PhoneInputWithCountry from '@/components/ui/PhoneInputWithCountry';

interface AddCustomerFormProps {
    onCancel: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

export default function AddCustomerForm({ onCancel, onSubmit, initialData }: AddCustomerFormProps) {
    const [formData, setFormData] = useState({
        // Basic
        firstName: initialData?.name ? initialData.name.split(' ')[0] : '',
        lastName: initialData?.name ? initialData.name.split(' ').slice(1).join(' ') : '',
        username: initialData?.username || '',
        password: '',
        confirmPassword: '',
        email: initialData?.email || '',
        phone: (() => {
            const p = initialData?.phone || '';
            const allC = Country.getAllCountries();
            // Sort by length desc to match longest code first
            const sorted = [...allC].sort((a, b) => b.phonecode.length - a.phonecode.length);
            const clean = p.startsWith('+') ? p.slice(1) : p;
            const match = sorted.find(c => clean.startsWith(c.phonecode));
            return match ? clean.slice(match.phonecode.length) : clean;
        })(),
        phoneCode: (() => {
            const p = initialData?.phone || '';
            if (!p) return '971'; // Default UAE
            const allC = Country.getAllCountries();
            const sorted = [...allC].sort((a, b) => b.phonecode.length - a.phonecode.length);
            const clean = p.startsWith('+') ? p.slice(1) : p;
            const match = sorted.find(c => clean.startsWith(c.phonecode));
            return match ? match.phonecode : '971';
        })(),
        currency: initialData?.currency || '',

        // Billing
        billingName: initialData?.billing_name || '',
        billingAddress1: initialData?.billing_address_1 || '',
        billingCountry: initialData?.billing_country || '',
        billingState: initialData?.billing_state || '',
        billingCity: initialData?.billing_city || '',

        // Shipping
        shippingName: initialData?.shipping_name || '',
        shippingAddress1: initialData?.shipping_address_1 || '',
        shippingCountry: initialData?.shipping_country || '',
        shippingState: initialData?.shipping_state || '',
        shippingCity: initialData?.shipping_city || ''
    });

    const [imageFile, setImageFile] = useState<File | null>(null);

    // Validation State
    const [isCheckingUser, setIsCheckingUser] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<'available' | 'taken' | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const checkTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const checkUsernameAvailability = async (username: string) => {
        if (!username.trim()) {
            setUsernameStatus(null);
            setIsCheckingUser(false);
            return;
        }

        // We already set checking=true in handleChange, keep it true until done.
        try {
            const excludeId = initialData?.id;
            const url = `/api/admin/customers/check-username?username=${encodeURIComponent(username)}${excludeId ? `&excludeId=${excludeId}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();

            if (res.ok) {
                if (!data.available) {
                    setUsernameStatus('taken');
                } else {
                    setUsernameStatus('available');
                }
            }
        } catch (error) {
            console.error("Error checking username:", error);
        } finally {
            setIsCheckingUser(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            if (name === 'billingCountry') {
                newData.billingState = '';
                newData.billingCity = '';
            } else if (name === 'billingState') {
                newData.billingCity = '';
            } else if (name === 'shippingCountry') {
                newData.shippingState = '';
                newData.shippingCity = '';
            } else if (name === 'shippingState') {
                newData.shippingCity = '';
            }

            return newData;
        });

        // Real-time Check for Username
        if (name === "username") {
            setUsernameStatus(null); // Reset status immediately on type
            setIsCheckingUser(true); // Show "Checking..." immediately

            if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

            checkTimeoutRef.current = setTimeout(() => {
                checkUsernameAvailability(value);
            }, 500); // 500ms delay for responsiveness
        }
    };

    // Derived state for dropdowns
    const billingCountries = Country.getAllCountries();
    const billingStates = formData.billingCountry ? State.getStatesOfCountry(formData.billingCountry) : [];
    const billingCities = formData.billingState ? City.getCitiesOfState(formData.billingCountry, formData.billingState) : [];

    const shippingCountries = Country.getAllCountries();
    const shippingStates = formData.shippingCountry ? State.getStatesOfCountry(formData.shippingCountry) : [];
    const shippingCities = formData.shippingState ? City.getCitiesOfState(formData.shippingCountry, formData.shippingState) : [];

    return (
        <div className="add-customer-container">
            <div className="add-customer-header">
                <h2>{initialData ? 'Edit Customer' : 'Add Customer'}</h2>
            </div>

            {/* Basic Details */}
            <div className="form-section">
                <h3 className="section-title">Basic Details</h3>

                <AvatarUploader
                    currentImage={initialData?.image_url}
                    onImageSelected={(file) => setImageFile(file)}
                    aspect={1}
                />

                <div className="form-grid-3">
                    <div>
                        <label className="input-label">First Name <span className="required">*</span></label>
                        <input type="text" name="firstName" className="input-field" value={formData.firstName} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="input-label">Last Name <span className="required">*</span></label>
                        <input type="text" name="lastName" className="input-field" value={formData.lastName} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="input-label">Username
                            {isCheckingUser && <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '5px' }}>(Checking...)</span>}
                        </label>
                        <input
                            type="text"
                            name="username"
                            className="input-field"
                            value={formData.username}
                            onChange={handleChange}
                            style={{
                                borderColor: usernameStatus === 'available' ? '#22c55e' : usernameStatus === 'taken' ? '#ef4444' : undefined,
                                color: usernameStatus === 'available' ? '#15803d' : usernameStatus === 'taken' ? '#b91c1c' : undefined
                            }}
                        />
                        {usernameStatus === 'taken' && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Username is already taken</span>}
                        {usernameStatus === 'available' && <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>Username is available</span>}
                    </div>
                </div>

                <div className="form-grid-3">
                    <div>
                        <label className="input-label">Email <span className="required">*</span></label>
                        <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="input-label">Phone Number <span className="required">*</span></label>
                        <PhoneInputWithCountry
                            value={formData.phone}
                            countryCode={formData.phoneCode}
                            onChange={(code, num) => setFormData(prev => ({ ...prev, phoneCode: code, phone: num }))}
                            required
                        />
                    </div>
                    <div>
                        <label className="input-label">Currency</label>
                        <select name="currency" className="select-field" value={formData.currency} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="INR">INR</option>
                            <option value="AED">AED</option>
                        </select>
                    </div>
                </div>

                {!initialData && (
                    <div className="form-grid-3">
                        <div>
                            <label className="input-label">Password <span className="required">*</span></label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="input-field"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Confirm Password <span className="required">*</span></label>
                            <div className="password-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    className="input-field"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="address-grid">
                {/* Billing Address */}
                <div className="form-section">
                    <h3 className="section-title">Billing Address</h3>
                    <div className="form-full-width">
                        <label className="input-label">Name</label>
                        <input type="text" name="billingName" className="input-field" value={formData.billingName} onChange={handleChange} />
                    </div>
                    <div className="form-full-width">
                        <label className="input-label">Address Line 1</label>
                        <input type="text" name="billingAddress1" className="input-field" value={formData.billingAddress1} onChange={handleChange} />
                    </div>

                    <div className="form-grid-2">
                        <div>
                            <label className="input-label">Country</label>
                            <select name="billingCountry" className="select-field" value={formData.billingCountry} onChange={handleChange}>
                                <option value="">Select Country</option>
                                {billingCountries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="input-label">State</label>
                            <select name="billingState" className="select-field" value={formData.billingState} onChange={handleChange} disabled={!formData.billingCountry}>
                                <option value="">Select State</option>
                                {billingStates.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-grid-2">
                        <div>
                            <label className="input-label">City</label>
                            <select name="billingCity" className="select-field" value={formData.billingCity} onChange={handleChange} disabled={!formData.billingState}>
                                <option value="">Select City</option>
                                {billingCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="form-section">
                    <div className="section-title flex-between">
                        <h3>Shipping Address</h3>
                    </div>
                    <div className="form-full-width">
                        <label className="input-label">Name</label>
                        <input type="text" name="shippingName" className="input-field" value={formData.shippingName} onChange={handleChange} />
                    </div>
                    <div className="form-full-width">
                        <label className="input-label">Address Line 1</label>
                        <input type="text" name="shippingAddress1" className="input-field" value={formData.shippingAddress1} onChange={handleChange} />
                    </div>

                    <div className="form-grid-2">
                        <div>
                            <label className="input-label">Country</label>
                            <select name="shippingCountry" className="select-field" value={formData.shippingCountry} onChange={handleChange}>
                                <option value="">Select Country</option>
                                {shippingCountries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="input-label">State</label>
                            <select name="shippingState" className="select-field" value={formData.shippingState} onChange={handleChange} disabled={!formData.shippingCountry}>
                                <option value="">Select State</option>
                                {shippingStates.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-grid-2">
                        <div>
                            <label className="input-label">City</label>
                            <select name="shippingCity" className="select-field" value={formData.shippingCity} onChange={handleChange} disabled={!formData.shippingState}>
                                <option value="">Select City</option>
                                {shippingCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="form-footer">
                <button className="btn-cancel-form" onClick={onCancel}>Cancel</button>
                <button className="btn-create-submit" onClick={() => {
                    // Validation
                    if (!initialData) {
                        if (formData.password !== formData.confirmPassword) {
                            alert("Passwords do not match!");
                            return;
                        }
                    }

                    if (usernameStatus === 'taken') {
                        alert("Please choose a different username.");
                        return;
                    }

                    // Combine First and Last Name
                    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
                    const fullPhone = `+${formData.phoneCode}${formData.phone}`;
                    onSubmit({ ...formData, name: fullName, phone: fullPhone, image: imageFile });
                }}>
                    {initialData ? 'Save Changes' : 'Create New'}
                </button>
            </div>
        </div>
    );
}
