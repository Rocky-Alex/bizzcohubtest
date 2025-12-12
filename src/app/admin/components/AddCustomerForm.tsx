import React, { useState } from 'react';
import './AddCustomerForm.css';
import { Country, State, City } from 'country-state-city';

interface AddCustomerFormProps {
    onCancel: () => void;
    onSubmit: (data: any) => void;
}

export default function AddCustomerForm({ onCancel, onSubmit }: AddCustomerFormProps) {
    const [formData, setFormData] = useState({
        // Basic
        name: '',
        email: '',
        phone: '',
        currency: '',

        // Billing
        billingName: '',
        billingAddress1: '',
        billingCountry: '',
        billingState: '',
        billingCity: '',

        // Shipping
        shippingName: '',
        shippingAddress1: '',
        shippingCountry: '',
        shippingState: '',
        shippingCity: ''
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Reset dependent fields
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
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
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
                <h2>Add Customer</h2>
            </div>

            {/* Basic Details */}
            <div className="form-section">
                <h3 className="section-title">Basic Details</h3>

                <div className="image-upload-area">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="image-preview-box">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <i className="far fa-image"></i>
                            )}
                        </div>
                        <div className="upload-btn-wrapper">
                            <label className="btn-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                                <i className="fas fa-file-upload"></i> Upload Image
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <span className="upload-help-text">JPG or PNG format, not exceeding 5MB.</span>
                        </div>
                    </div>
                </div>

                <div className="form-grid-3">
                    <div>
                        <label className="input-label">Name <span className="required">*</span></label>
                        <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="input-label">Email <span className="required">*</span></label>
                        <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="input-label">Phone Number <span className="required">*</span></label>
                        <input type="text" name="phone" className="input-field" value={formData.phone} onChange={handleChange} />
                    </div>
                </div>

                <div className="form-grid-3">
                    <div>
                        <label className="input-label">Currency</label>
                        <select name="currency" className="select-field" value={formData.currency} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="INR">INR</option>
                        </select>
                    </div>
                </div>
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
                <button className="btn-create-submit" onClick={() => onSubmit({ ...formData, image: imageFile })}>Create New</button>
            </div>
        </div>
    );
}
