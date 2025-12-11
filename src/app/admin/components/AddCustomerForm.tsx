import React, { useState } from 'react';
import './AddCustomerForm.css';

interface AddCustomerFormProps {
    onCancel: () => void;
    onSubmit: (data: any) => void;
}

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
    "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Holy See", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
    "Vanuatu", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
];

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                            <i className="far fa-image"></i>
                        </div>
                        <div className="upload-btn-wrapper">
                            <button className="btn-upload">
                                <i className="fas fa-file-upload"></i> Upload Image
                            </button>
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
                                <option value="">Select</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="input-label">State</label>
                            <select name="billingState" className="select-field" value={formData.billingState} onChange={handleChange}>
                                <option value="">Select</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grid-2">
                        <div>
                            <label className="input-label">City</label>
                            <select name="billingCity" className="select-field" value={formData.billingCity} onChange={handleChange}>
                                <option value="">Select</option>
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
                                <option value="">Select</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="input-label">State</label>
                            <select name="shippingState" className="select-field" value={formData.shippingState} onChange={handleChange}>
                                <option value="">Select</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grid-2">
                        <div>
                            <label className="input-label">City</label>
                            <select name="shippingCity" className="select-field" value={formData.shippingCity} onChange={handleChange}>
                                <option value="">Select</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="form-footer">
                <button className="btn-cancel-form" onClick={onCancel}>Cancel</button>
                <button className="btn-create-submit" onClick={() => onSubmit(formData)}>Create New</button>
            </div>
        </div>
    );
}
