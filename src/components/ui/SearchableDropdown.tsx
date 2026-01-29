import React, { useState, useRef, useEffect } from 'react';

interface Option {
    label: string;
    value: string;
}

interface SearchableDropdownProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: (string | Option)[];
    placeholder?: string;
    disabled?: boolean;
    style?: React.CSSProperties;
}

const SearchableDropdown = ({
    name,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    style
}: SearchableDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Normalize options to Option[]
    const normalizedOptions: Option[] = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    // Find current label for display
    const currentOption = normalizedOptions.find(opt => opt.value === value);
    const displayValue = isOpen ? searchTerm : (currentOption?.label || value || '');

    const filteredOptions = normalizedOptions.filter(opt =>
        (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.value || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: Option) => {
        onChange({ target: { name, value: option.value } });
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div
            className="custom-combobox"
            ref={wrapperRef}
            style={{
                position: 'relative',
                width: '100%',
                ...style
            }}
        >
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    name={name}
                    value={displayValue}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (!disabled) {
                            setIsOpen(true);
                            setSearchTerm(''); // Clear search on focus to show all
                        }
                    }}
                    placeholder={placeholder}
                    autoComplete="off"
                    disabled={disabled}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingRight: '2.5rem',
                        borderRadius: '12px',
                        border: `2px solid ${isOpen ? '#3b82f6' : '#e2e8f0'}`,
                        outline: 'none',
                        color: '#1e293b',
                        backgroundColor: disabled ? '#f8fafc' : 'white',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isOpen ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                />
                <i
                    className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                    style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                        pointerEvents: 'none',
                        transition: 'transform 0.2s'
                    }}
                ></i>
            </div>

            {isOpen && !disabled && (
                <ul
                    className="combobox-dropdown"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        maxHeight: '250px',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '8px',
                        listStyle: 'none',
                        animation: 'dropdownFadeIn 0.2s ease-out'
                    }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, idx) => (
                            <li
                                key={idx}
                                className="combobox-item"
                                onClick={() => handleSelect(option)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    color: value === option.value ? '#3b82f6' : '#475569',
                                    backgroundColor: value === option.value ? '#eff6ff' : 'transparent',
                                    fontWeight: value === option.value ? 700 : 500,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== option.value) {
                                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== option.value) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <div style={{ width: '18px', display: 'flex', justifyContent: 'center' }}>
                                    {value === option.value && <i className="fas fa-check" style={{ fontSize: '0.8rem' }}></i>}
                                </div>
                                <div style={{ flex: 1 }}>{option.label}</div>
                            </li>
                        ))
                    ) : (
                        <li style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-search" style={{ color: '#cbd5e1', fontSize: '1.2rem' }}></i>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>No results for "{searchTerm}"</span>
                        </li>
                    )}
                </ul>
            )}
            <style jsx>{`
                @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .combobox-dropdown::-webkit-scrollbar {
                    width: 6px;
                }
                .combobox-dropdown::-webkit-scrollbar-track {
                    background: transparent;
                }
                .combobox-dropdown::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .combobox-dropdown::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default SearchableDropdown;
