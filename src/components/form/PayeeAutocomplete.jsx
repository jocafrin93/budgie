import { useEffect, useRef, useState } from 'react';
import { TbChevronDown, TbPlus } from 'react-icons/tb';

const PayeeAutocomplete = ({
    label,
    value,
    onChange,
    payees = [],
    onAddPayee,
    placeholder = "Enter payee name...",
    required = false,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [filteredPayees, setFilteredPayees] = useState(payees);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Update input value when prop value changes
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Filter payees based on input
    useEffect(() => {
        if (!inputValue.trim()) {
            setFilteredPayees(payees);
        } else {
            const filtered = payees.filter(payee =>
                payee.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredPayees(filtered);
        }
    }, [inputValue, payees]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange?.(e); // Pass the event to parent
        setIsOpen(true);
    };

    const handleSelectPayee = (payee) => {
        setInputValue(payee);
        onChange?.({ target: { value: payee } }); // Simulate input event
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleAddNewPayee = () => {
        if (inputValue.trim() && !payees.includes(inputValue.trim())) {
            const newPayee = inputValue.trim();
            onAddPayee?.(newPayee);
            handleSelectPayee(newPayee);
        }
    };

    const handleKeyDown = (e) => {
        console.log('🔑 Key pressed:', e.key, {
            inputValue,
            filteredPayees,
            isOpen,
            filteredPayeesLength: filteredPayees.length
        });

        if (e.key === 'Enter') {
            console.log('✅ Enter key - processing...');
            e.preventDefault();

            // If there's an exact match, select it
            const exactMatch = filteredPayees.find(payee =>
                payee.toLowerCase() === inputValue.toLowerCase()
            );

            if (exactMatch) {
                console.log('✅ Exact match found:', exactMatch);
                handleSelectPayee(exactMatch);
            } else if (inputValue.trim() && filteredPayees.length === 0) {
                // If no matches and input has value, add as new payee
                console.log('✅ No matches, adding new payee:', inputValue.trim());
                handleAddNewPayee();
            } else if (filteredPayees.length > 0) {
                // Select first filtered option
                console.log('✅ Selecting first filtered option:', filteredPayees[0]);
                handleSelectPayee(filteredPayees[0]);
            }
        } else if (e.key === 'Tab') {
            console.log('🔥 TAB KEY DETECTED!', {
                filteredPayeesLength: filteredPayees.length,
                inputValueTrimmed: inputValue.trim(),
                isOpen,
                conditions: {
                    hasFilteredPayees: filteredPayees.length > 0,
                    hasInputValue: !!inputValue.trim(),
                    dropdownIsOpen: isOpen
                }
            });

            // Handle Tab key for autocomplete - improved logic
            if (filteredPayees.length > 0 && inputValue.trim() && isOpen) {
                console.log('🚀 TAB CONDITIONS MET - Processing autocomplete...');
                e.preventDefault();
                e.stopPropagation();

                // Find the best match (starts with the input)
                const startsWithMatch = filteredPayees.find(payee =>
                    payee.toLowerCase().startsWith(inputValue.toLowerCase())
                );

                // Use the best match or first filtered option
                const bestMatch = startsWithMatch || filteredPayees[0];
                console.log('🎯 Best match selected:', bestMatch, {
                    startsWithMatch,
                    firstFiltered: filteredPayees[0]
                });

                handleSelectPayee(bestMatch);

                // Ensure the dropdown closes and input loses focus
                setTimeout(() => {
                    console.log('🔄 Cleanup: closing dropdown and blurring input');
                    setIsOpen(false);
                    inputRef.current?.blur();
                }, 0);
            } else {
                console.log('❌ TAB CONDITIONS NOT MET:', {
                    hasFilteredPayees: filteredPayees.length > 0,
                    hasInputValue: !!inputValue.trim(),
                    dropdownIsOpen: isOpen
                });
            }
        } else if (e.key === 'Escape') {
            console.log('🔄 Escape key - closing dropdown');
            setIsOpen(false);
            inputRef.current?.blur();
        } else if (e.key === 'ArrowDown') {
            console.log('⬇️ Arrow down - opening dropdown');
            e.preventDefault();
            setIsOpen(true);
        } else if (e.key === 'ArrowUp') {
            console.log('⬆️ Arrow up - closing dropdown');
            e.preventDefault();
            setIsOpen(false);
        }
    };

    const showAddOption = inputValue.trim() &&
        !payees.some(payee => payee.toLowerCase() === inputValue.toLowerCase()) &&
        filteredPayees.length === 0;

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    required={required}
                    className="w-full px-3 py-2 pr-10 border border-gray-400 dark:border-gray-500 rounded-lg 
                             bg-white dark:bg-gray-800 
                             text-gray-900 dark:text-gray-100
                             placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             transition-colors"
                    {...props}
                />

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <TbChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Existing payees */}
                    {filteredPayees.length > 0 && (
                        <div>
                            {filteredPayees.map((payee, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectPayee(payee)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 
                                             text-gray-900 dark:text-gray-100 transition-colors
                                             first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {payee}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Add new payee option */}
                    {showAddOption && (
                        <button
                            type="button"
                            onClick={handleAddNewPayee}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 
                                     text-blue-600 dark:text-blue-400 transition-colors
                                     border-t border-gray-200 dark:border-gray-600 flex items-center space-x-2"
                        >
                            <TbPlus className="size-4" />
                            <span>Add "{inputValue}"</span>
                        </button>
                    )}

                    {/* No results */}
                    {filteredPayees.length === 0 && !showAddOption && inputValue.trim() && (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                            No payees found
                        </div>
                    )}

                    {/* Show all payees when input is empty */}
                    {!inputValue.trim() && payees.length === 0 && (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                            Start typing to add your first payee
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PayeeAutocomplete;
