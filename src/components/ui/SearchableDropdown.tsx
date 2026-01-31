import React, { useState, useEffect, useRef } from 'react';

interface SearchableDropdownOption {
    label: string;
    value: string;
}

interface SearchableDropdownProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: (string | SearchableDropdownOption)[];
    placeholder?: string;
    className?: string; // Added optional className
    disabled?: boolean;
}

const SearchableDropdown = ({
    name,
    value,
    onChange,
    options,
    placeholder,
    className = "co-input",
    disabled = false
}: SearchableDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<typeof options>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Helper to get display label safely
    const getLabel = (opt: string | SearchableDropdownOption): string => {
        if (!opt) return '';
        if (typeof opt === 'object') return opt.label || '';
        return String(opt);
    };

    // Helper to get value safey
    const getValue = (opt: string | SearchableDropdownOption): string => {
        if (!opt) return '';
        if (typeof opt === 'object') return opt.value || '';
        return String(opt);
    };

    useEffect(() => {
        // If value changes, we might want to find the corresponding label to display? 
        // Actually, the input displays the 'value' prop directly in the current implementation.
        // But for object options, the 'value' prop usually matches option.value, but we want to display option.label in the input if selected?
        // Wait, standard behavior for this component (as seen in previous version) was:
        // Input value IS the display value. 
        // onChange returns the selected string.

        // HOWEVER, for QCChecking, we are passing IDs as values but want to display Names.
        // If 'value' prop is "123" (ID), the input should show "Lot #123".

        // If the component is purely a text input with autocomplete, 'value' matches the text.
        // If it's a "Select" style, 'value' is internal ID, identifying the selected option.

        // Looking at the legacy implementation:
        // <input value={value} ... />
        // It treats 'value' as the text to display in the input.

        // If QCChecking connects `value={selectedLotId}` (which is "123"),
        // the input will show "123". This is probably NOT what looks good if options are "Lot #123 - Supplier".

        // Refactoring to a true ComboBox (display text != value) is risky for other components (AddProduct) which might rely on text.
        // But AddProduct passes `string[]` options, so value == label.

        // Let's implement a hybrid approach:
        // Use a local 'searchTerm' state for the input.
        // Sync 'searchTerm' with 'value' prop:
        // If options are objects, find option where option.value === props.value, and set searchTerm = option.label.
        // If options are strings, searchTerm = props.value.

        // But wait, if user types to search, searchTerm changes, but props.value doesn't until selection.

        // Let's look at how QCChecking uses it:
        // contains `value={selectedLotId}` (the ID).
        // contains `options={[{ label: "...", value: "..." }]}`.

        // If I keep <input value={value} />, it will show the ID.
        // I should decouple the input display value from the underlying value if they differ.
    }, [value, options]);

    // Local state for the input text
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        // When external value changes, update internal input text
        // Check if value matches an option
        const matchedOption = options.find(opt => getValue(opt) === value);
        if (matchedOption) {
            setInputValue(getLabel(matchedOption));
        } else {
            setInputValue(value);
        }
    }, [value, options]);


    useEffect(() => {
        if (!isOpen) {
            // Refill all options when closed, or maybe keep filtered?
            // Usually reset to all options when opening or value empty.
            // But here we filter based on inputValue.
        }

        const search = inputValue.toLowerCase();
        const filtered = options.filter(opt =>
            getLabel(opt).toLowerCase().includes(search)
        );
        setFilteredOptions(filtered);

    }, [inputValue, options, isOpen]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // On blur, if exact match not found, what do we do?
                // If strictly selecting, maybe revert? 
                // For now, let's leave it flexible.
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: string | SearchableDropdownOption) => {
        const val = getValue(option);
        // We notify parent of the VALUE
        onChange({ target: { name, value: val } });

        // Update local input immediately for better UX
        setInputValue(getLabel(option));
        setIsOpen(false);
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputValue(text);
        setIsOpen(true);

        // Should we trigger onChange with the text? 
        // If treating as a search/autocomplete where text is valid value (like AddProduct manual entry):
        // AddProduct expects to type free text often?
        // In AddProduct: `onChange={(e) => handleChange(fieldKey, e.target.value)}`
        // In QCChecking: `onChange={(e) => setSelectedLotId(e.target.value)}` -> expects ID.

        // If user types "Lot 5", and no match, passing "Lot 5" as ID is probably wrong for QCChecking.
        // But valid for string-based fields (Brand, Model).

        // We can distinguish based on option type? 
        // If options are objects, we likely enforce selection? Or we pass text?

        // Let's pass text to onChange as well, to support free-typing.
        onChange({ target: { name, value: text } });
    };

    return (
        <div className="custom-combobox" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                name={name}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                autoComplete="off"
                className={className}
                disabled={disabled}
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul className="combobox-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '0 0 6px 6px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {filteredOptions.map((option, idx) => (
                        <li
                            key={idx}
                            onClick={() => handleSelect(option)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                color: '#334155',
                                fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            {getLabel(option)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchableDropdown;
