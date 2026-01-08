import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Country } from 'country-state-city';
import './PhoneInputWithCountry.css';

interface PhoneInputProps {
    value: string; // The phone number content
    countryCode: string; // The dial code (e.g. '971')
    onChange: (code: string, number: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    error?: boolean;
}

export default function PhoneInputWithCountry({
    value,
    countryCode,
    onChange,
    placeholder = "(000) 000-0000",
    required = false,
    disabled = false,
    className = "",
    error = false
}: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const allCountries = useMemo(() => {
        return Country.getAllCountries();
    }, []);

    // Find selected country object based on code
    // Prioritize exact match if possible, or just first one
    const selectedCountry = useMemo(() => {
        // Remove + if present
        const cleanCode = countryCode.replace('+', '');
        // Sort countries to find exact match if multiple share code (though this logic is loose without ISO)
        // If we only have code, we take the first match.
        // Usually US is first for +1.
        return allCountries.find(c => c.phonecode === cleanCode) || allCountries.find(c => c.phonecode === '971');
    }, [countryCode, allCountries]);

    // Filter logic
    const filteredCountries = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return allCountries.filter(c =>
            c.name.toLowerCase().includes(term) ||
            c.phonecode.includes(term) ||
            c.isoCode.toLowerCase().includes(term)
        );
    }, [searchTerm, allCountries]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (c: any) => {
        onChange(c.phonecode, value);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Optional: formatting logic here
        onChange(countryCode, val);
    };

    return (
        <div className={`phone-input-container ${className}`} ref={dropdownRef}>
            <div className={`phone-input-wrapper ${error ? 'border-red-500' : ''}`} style={error ? { borderColor: '#ef4444' } : {}}>
                {/* Trigger */}
                <div
                    className="country-trigger"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    title={selectedCountry?.name}
                >
                    <img
                        src={`https://flagcdn.com/w40/${selectedCountry?.isoCode.toLowerCase() || 'ae'}.png`}
                        alt={selectedCountry?.name}
                        width="20"
                        style={{ borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <span className="selected-iso">{selectedCountry?.isoCode}</span>
                    <span className="selected-dial">+{selectedCountry?.phonecode}</span>
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} dropdown-arrow`}></i>
                </div>

                {/* Input */}
                <input
                    type="tel"
                    className="phone-input-field"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleInputChange}
                    disabled={disabled}
                    required={required}
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="country-dropdown-menu">
                    <div className="country-search-box">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search for countries"
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="countries-list">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <div
                                    key={country.isoCode}
                                    className={`country-item ${country.isoCode === selectedCountry?.isoCode ? 'selected' : ''}`}
                                    onClick={() => handleSelect(country)}
                                >
                                    <img
                                        src={`https://flagcdn.com/w40/${country.isoCode.toLowerCase()}.png`}
                                        alt={country.name}
                                        width="24"
                                        style={{ borderRadius: '4px', objectFit: 'cover' }}
                                    />
                                    <span className="item-name">{country.name}</span>
                                    <span className="item-code">+{country.phonecode}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
