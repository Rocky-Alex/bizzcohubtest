import React, { useState, useEffect, useRef } from 'react';
import './SearchableDropdown.css';

interface SearchableDropdownProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: string[] | { label: string; value: string }[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    name,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Normalize options to { label, value } array
    const normalizedOptions = React.useMemo(() => {
        if (!Array.isArray(options)) return [];
        return options.map(opt => {
            if (typeof opt === 'string') return { label: opt, value: opt };
            if (opt && typeof opt === 'object' && 'value' in opt) {
                return {
                    label: (opt as any).label || opt.value,
                    value: opt.value
                };
            }
            return null;
        }).filter((opt): opt is { label: string; value: string } => opt !== null);
    }, [options]);

    // Find the label for the current value to display in the input when not focused/searching
    const currentOption = normalizedOptions.find(opt => opt.value === value);
    const displayValue = isOpen ? searchTerm : (currentOption?.label || value || "");

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // When opening, reset search term to empty or current value? 
    // Usually better to show current value but allow clearing.
    const handleFocus = () => {
        if (!disabled) {
            setIsOpen(true);
            setSearchTerm(""); // Clear search on focus to show all options initially
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);

        // Also fire onChange if user types something not in list? 
        // For some use cases (like Brand), we might want to allow custom values.
        onChange({ target: { name, value: e.target.value } });
    };

    const handleSelect = (option: { label: string; value: string }) => {
        onChange({ target: { name, value: option.value } });
        setIsOpen(false);
        setSearchTerm("");
    };

    const filteredOptions = normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`custom-combobox ${className}`} ref={wrapperRef}>
            <input
                type="text"
                name={name}
                value={displayValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
                className={`dropdown-input ${disabled ? 'disabled' : ''}`}
            />
            <i className={`fas fa-chevron-down dropdown-icon ${isOpen ? 'open' : ''}`}></i>

            {isOpen && !disabled && (
                <ul className="combobox-dropdown">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, idx) => (
                            <li
                                key={`${option.value}-${idx}`}
                                className={`combobox-item ${value === option.value ? 'active' : ''}`}
                                onClick={() => handleSelect(option)}
                            >
                                {option.label}
                                {value === option.value && <i className="fas fa-check"></i>}
                            </li>
                        ))
                    ) : (
                        <li className="combobox-no-results">No results found</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchableDropdown;
