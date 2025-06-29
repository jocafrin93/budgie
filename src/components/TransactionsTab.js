
import {
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
    Edit2,
    Plus,
    Search,
    Split,
    Trash2,
    X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CurrencyField } from './form';

// Helper function to get today's date in local timezone (most reliable method)
const getTodaysDate = () => {
    // Get today's date and ensure it's in local timezone
    const now = new Date();
    // Offset timezone difference to get true local date
    const timezoneOffset = now.getTimezoneOffset() * 60000; // Convert to milliseconds
    const localDate = new Date(now.getTime() - timezoneOffset);
    const result = localDate.toISOString().split('T')[0];

    console.log('TransactionEditRow - getTodaysDate():', {
        now: now,
        timezoneOffset: timezoneOffset,
        localDate: localDate,
        result: result,
        expectedToday: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    });
    return result;
};

const TransactionEditRow = ({
    transaction,
    setTransaction,
    accounts,
    categories,
    onSave,
    onSaveAndAddAnother,
    onCancel,
    isNew,
    addSplit,
    removeSplit,
    updateSplit,
    columnWidths,
    viewAccount
}) => {
    const handleSplitUpdate = (splitId, field, value) => {
        console.log(`handleSplitUpdate called:`, { splitId, field, value });
        console.log('Current transaction splits before update:', JSON.stringify(transaction.splits, null, 2));

        // Handle calls from parent's updateSplit function
        if (updateSplit) {
            console.log('Using parent updateSplit function');
            updateSplit(splitId, field, value);
        } else {
            console.log('Using fallback updateSplit');
            // Fallback: update splits directly in transaction state
            const currentSplits = transaction.splits || [];
            const updatedSplits = currentSplits.map(split => {
                if (split.id === splitId) {
                    const updatedSplit = { ...split, [field]: value };
                    console.log(`Updating split ${splitId}:`, split, '→', updatedSplit);
                    return updatedSplit;
                } else {
                    console.log(`Keeping split ${split.id} unchanged:`, split);
                    return split;
                }
            });

            console.log('Updated splits array:', JSON.stringify(updatedSplits, null, 2));

            setTransaction(prev => ({
                ...prev,
                splits: updatedSplits
            }));
        }
    };

    const handleAddSplit = () => {
        if (addSplit) {
            addSplit();
        } else {
            // Fallback: add split directly
            const newSplit = {
                id: Date.now(),
                amount: '',
                categoryId: '',
                memo: ''
            };
            const currentSplits = transaction.splits || [];
            setTransaction(prev => ({
                ...prev,
                splits: [...currentSplits, newSplit],
                isSplit: true
            }));
        }
    };

    const handleRemoveSplit = (splitId) => {
        if (removeSplit) {
            removeSplit(splitId);
        } else {
            // Fallback: remove split directly
            const currentSplits = transaction.splits || [];
            const updatedSplits = currentSplits.filter(split => split.id !== splitId);
            setTransaction(prev => ({
                ...prev,
                splits: updatedSplits,
                isSplit: updatedSplits.length > 0
            }));
        }
    };

    const handleInputChange = (field, value) => {
        setTransaction(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleTransfer = () => {
        if (transaction.isTransfer) {
            // Turning off transfer mode
            setTransaction(prev => ({
                ...prev,
                isTransfer: false,
                transferAccountId: '',
                payee: ''
            }));
        } else {
            // Turning on transfer mode
            const fromAccount = accounts.find(acc => acc.id === parseInt(transaction.accountId));
            const defaultPayee = fromAccount ? `Transfer from ${fromAccount.name}` : 'Transfer';
            setTransaction(prev => ({
                ...prev,
                isTransfer: true,
                payee: defaultPayee,
                categoryId: '' // Clear category for transfers
            }));
        }
    };

    const toggleSplit = () => {
        if (transaction.isSplit) {
            // Turning off split mode
            setTransaction(prev => ({
                ...prev,
                isSplit: false,
                splits: [],
                categoryId: ''
                // DON'T clear the payee when turning off split mode
            }));
        } else {
            // Turning on split mode - create first split
            const newSplit = {
                id: Date.now(),
                amount: '',
                categoryId: '',
                memo: ''
            };
            setTransaction(prev => ({
                ...prev,
                isSplit: true,
                isTransfer: false,
                transferAccountId: '',
                categoryId: '',
                splits: [newSplit]
                // DON'T clear the payee when turning on split mode - PRESERVE IT
            }));
        }
    };

    // Calculate split totals for validation
    const totalAmount = Math.abs(parseFloat(transaction.outflow) || parseFloat(transaction.inflow) || 0);
    const splitTotal = (transaction.splits || []).reduce((sum, split) => {
        const amount = typeof split.amount === 'string' ? parseFloat(split.amount) || 0 : parseFloat(split.amount) || 0;
        return sum + Math.abs(amount);
    }, 0);
    const splitDifference = Math.abs(totalAmount - splitTotal);

    const outflowAmount = parseFloat(transaction.outflow) || 0;
    const inflowAmount = parseFloat(transaction.inflow) || 0;

    // Helper function to get today's date in local timezone (most reliable method)
    const getTodaysDate = () => {
        // Get today's date and ensure it's in local timezone
        const now = new Date();
        // Offset timezone difference to get true local date
        const timezoneOffset = now.getTimezoneOffset() * 60000; // Convert to milliseconds
        const localDate = new Date(now.getTime() - timezoneOffset);
        const result = localDate.toISOString().split('T')[0];

        console.log('TransactionEditRow - getTodaysDate():', {
            now: now,
            timezoneOffset: timezoneOffset,
            localDate: localDate,
            result: result,
            expectedToday: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        });
        return result;
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            console.log('KeyDown event detected:', e.key, 'Shift:', e.shiftKey, 'Target:', e.target.tagName);

            // Only handle if the focused element is within this component's form fields
            const isInTransactionForm = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT';

            if (isInTransactionForm) {
                console.log('Event is in transaction form field');

                if (e.key === 'Escape') {
                    console.log('Escape pressed, calling onCancel');
                    e.preventDefault();
                    e.stopPropagation();
                    onCancel();
                } else if (e.key === 'Enter') {
                    console.log('Enter pressed, shift:', e.shiftKey, 'isNew:', isNew);
                    e.preventDefault();
                    e.stopPropagation();

                    if (e.shiftKey && isNew && onSaveAndAddAnother) {
                        console.log('Calling onSaveAndAddAnother');
                        onSaveAndAddAnother();
                    } else {
                        console.log('Calling onSave');
                        onSave();
                    }
                }
            }
        };

        // Add event listener to document
        document.addEventListener('keydown', handleKeyDown, true); // Use capture phase

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [onSave, onSaveAndAddAnother, onCancel, isNew]);

    return (
        <>
            {/* Main Transaction Row */}
            <tr className="bg-theme-secondary">
                {/* Bulk Select */}
                <td className="px-1 py-2 text-center" style={{ width: columnWidths.select }}>
                    {/* Empty for new transactions */}
                </td>

                {/* Date */}
                <td className="px-2 py-2" style={{ width: columnWidths.date }}>
                    <input
                        type="date"
                        value={transaction.date || getTodaysDate()}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                    />
                </td>

                {/* Payee */}
                <td className="px-2 py-2" style={{ width: columnWidths.payee }}>
                    {transaction.isTransfer ? (
                        <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-theme-secondary" />
                            <span className="text-sm text-theme-secondary">Transfer</span>
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={transaction.payee}
                            onChange={(e) => handleInputChange('payee', e.target.value)}
                            placeholder="Payee"
                            className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                        />
                    )}
                </td>

                {/* Category - NOW WITH SPLIT OPTION IN DROPDOWN */}
                <td className="px-2 py-2" style={{ width: columnWidths.category, minWidth: '180px' }}>
                    <div className="w-full h-full relative">
                        {transaction.isTransfer ? (
                            <div className="flex items-center gap-2">
                                <select
                                    value={transaction.transferAccountId}
                                    onChange={(e) => handleInputChange('transferAccountId', e.target.value)}
                                    className="flex-1 px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                >
                                    <option value="">Select account</option>
                                    {accounts
                                        .filter(acc => acc.id !== parseInt(transaction.accountId))
                                        .map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={toggleTransfer}
                                    className="flex items-center gap-1 text-xs text-theme-blue hover:text-theme-blue underline whitespace-nowrap"
                                    title="Remove transfer"
                                >
                                    <X className="w-3 h-3" />
                                    Remove
                                </button>
                            </div>
                        ) : transaction.isSplit ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-sm text-theme-secondary">
                                    <Split className="w-3 h-3" />
                                    <span>Split Transaction</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleSplit}
                                    className="flex items-center gap-1 text-xs text-theme-red hover:text-theme-red underline whitespace-nowrap"
                                    title="Remove split transaction"
                                >
                                    <X className="w-3 h-3" />
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <select
                                    value={transaction.categoryId}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'SPLIT_TRANSACTION') {
                                            toggleSplit();
                                        } else if (value === 'TRANSFER') {
                                            toggleTransfer();
                                        } else {
                                            // Ensure we save the category properly
                                            handleInputChange('categoryId', value || '');
                                        }
                                    }}
                                    className="flex-1 px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                >
                                    <option value="">Select category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                    <option value="" disabled>──────────</option>
                                    <option value="SPLIT_TRANSACTION">🔀 Split Transaction</option>
                                    <option value="TRANSFER">➡️ Transfer</option>
                                </select>
                            </div>
                        )}
                    </div>
                </td>

                {/* Memo */}
                <td className="px-2 py-2" style={{ width: columnWidths.memo, minWidth: '150px' }}>
                    <input
                        type="text"
                        value={transaction.memo}
                        onChange={(e) => handleInputChange('memo', e.target.value)}
                        placeholder="Memo"
                        className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                    />
                </td>

                {/* Outflow */}
                <td className="px-2 py-2" style={{ width: columnWidths.outflow }}>
                    <CurrencyField
                        name="outflow"
                        value={transaction.outflow || 0}
                        onChange={(e) => {
                            // CurrencyField returns a number in e.target.value
                            const numericValue = e.target.value;
                            handleInputChange('outflow', numericValue);
                            if (numericValue > 0) handleInputChange('inflow', 0);
                        }}
                        hideLabel={true}
                        placeholder="0.00"
                        className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm text-right"
                        darkMode={false}
                    />
                    {transaction.isTransfer && outflowAmount > 0 && (
                        <div className="text-xs text-theme-tertiary mt-1">
                            To: {accounts.find(acc => acc.id === parseInt(transaction.transferAccountId))?.name || 'Select account'}
                        </div>
                    )}
                </td>

                {/* Inflow */}
                <td className="px-2 py-2" style={{ width: columnWidths.inflow }}>
                    <CurrencyField
                        name="inflow"
                        value={transaction.inflow || 0}
                        onChange={(e) => {
                            // CurrencyField returns a number in e.target.value
                            const numericValue = e.target.value;
                            handleInputChange('inflow', numericValue);
                            if (numericValue > 0) handleInputChange('outflow', 0);
                        }}
                        hideLabel={true}
                        placeholder="0.00"
                        className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm text-right"
                        darkMode={false}
                    />
                    {transaction.isTransfer && inflowAmount > 0 && (
                        <div className="text-xs text-theme-tertiary mt-1">
                            From: {accounts.find(acc => acc.id === parseInt(transaction.transferAccountId))?.name || 'Select account'}
                        </div>
                    )}
                </td>

                {/* Cleared */}
                <td className="px-1 py-2 text-center" style={{ width: columnWidths.cleared }}>
                    <input
                        type="checkbox"
                        checked={transaction.isCleared}
                        onChange={(e) => handleInputChange('isCleared', e.target.checked)}
                        className="rounded border-theme-secondary"
                    />
                </td>
            </tr>

            {/* Split Rows */}
            {transaction.isSplit && (transaction.splits || []).map((split, index) => (
                <tr key={split.id} className="bg-theme-tertiary">
                    <td className="px-1 py-2"></td>
                    <td className="px-2 py-2"></td>
                    <td className="px-2 py-2">
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm text-theme-secondary">Split {index + 1}</span>
                            {(transaction.splits || []).length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeSplit ? removeSplit(split.id) : handleRemoveSplit(split.id)}
                                    className="flex items-center gap-1 text-xs text-theme-red hover:text-theme-red underline"
                                    title="Remove this split"
                                >
                                    <X className="w-3 h-3" />
                                    Remove
                                </button>
                            )}
                            {index === (transaction.splits || []).length - 1 && (
                                <button
                                    type="button"
                                    onClick={() => addSplit ? addSplit() : handleAddSplit()}
                                    className="flex items-center gap-1 text-xs text-theme-blue hover:text-theme-blue underline"
                                    title="Add another split"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Split
                                </button>
                            )}
                        </div>
                    </td>
                    <td className="px-2 py-2">
                        <select
                            value={split.categoryId || ''}
                            onChange={(e) => handleSplitUpdate(split.id, 'categoryId', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                        >
                            <option value="">Select category</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </td>
                    <td className="px-2 py-2">
                        <input
                            type="text"
                            value={split.memo || ''}
                            onChange={(e) => handleSplitUpdate(split.id, 'memo', e.target.value)}
                            placeholder="Memo"
                            className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                        />
                    </td>
                    <td className="px-2 py-2">
                        <CurrencyField
                            name={`split-amount-${split.id}`}
                            value={typeof split.amount === 'string' ? parseFloat(split.amount) || 0 : split.amount || 0}
                            onChange={(e) => {
                                // CurrencyField returns a number in e.target.value
                                const numericValue = e.target.value;
                                console.log(`Updating split ${split.id} amount to:`, numericValue, 'Split object before update:', split);
                                handleSplitUpdate(split.id, 'amount', numericValue);
                            }}
                            hideLabel={true}
                            placeholder="0.00"
                            className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm text-right"
                            darkMode={false}
                        />
                    </td>
                    <td className="px-2 py-2"></td>
                    <td className="px-1 py-2"></td>
                </tr>
            ))}

            {/* Account Selection Row - MOVED TO AFTER SPLITS */}
            {viewAccount === 'all' && (
                <tr className="bg-theme-secondary">
                    <td className="px-1 py-2"></td>
                    <td className="px-2 py-2"></td>
                    <td className="px-2 py-2">
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm text-theme-secondary">Account:</span>
                        </div>
                    </td>
                    <td className="px-2 py-2" colSpan="2">
                        <select
                            value={transaction.accountId}
                            onChange={(e) => handleInputChange('accountId', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                        >
                            <option value="">Select account</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </td>
                    <td className="px-2 py-2"></td>
                    <td className="px-2 py-2"></td>
                    <td className="px-1 py-2"></td>
                </tr>
            )}

            {/* Split Difference Helper Row - Shows when splits don't match total */}
            {transaction.isSplit && (transaction.splits || []).length > 0 && Math.abs(splitDifference) > 0.01 && (
                <tr className="bg-yellow-50 border border-yellow-200">
                    <td className="px-1 py-2 text-center">
                        <div className="text-yellow-600 text-xs">⚠️</div>
                    </td>
                    <td className="px-2 py-2"></td>
                    <td className="px-2 py-2">
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm text-yellow-700 font-medium">
                                Difference: ${splitDifference.toFixed(2)}
                            </span>
                        </div>
                    </td>
                    <td className="px-2 py-2">
                        <button
                            type="button"
                            onClick={() => {
                                // YNAB-style: Distribute difference evenly across existing splits
                                const currentSplits = transaction.splits || [];
                                const numberOfSplits = currentSplits.length;
                                const amountPerSplit = splitDifference / numberOfSplits;

                                console.log(`Distributing $${splitDifference.toFixed(2)} evenly across ${numberOfSplits} splits (${amountPerSplit.toFixed(2)} each)`);

                                const updatedSplits = currentSplits.map((split, index) => {
                                    const currentAmount = parseFloat(split.amount) || 0;
                                    const newAmount = currentAmount + amountPerSplit;
                                    console.log(`Split ${index + 1}: $${currentAmount.toFixed(2)} + $${amountPerSplit.toFixed(2)} = $${newAmount.toFixed(2)}`);
                                    return {
                                        ...split,
                                        amount: newAmount
                                    };
                                });

                                setTransaction(prev => ({
                                    ...prev,
                                    splits: updatedSplits
                                }));
                            }}
                            className="w-full px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 rounded text-yellow-800 font-medium transition-colors"
                        >
                            📊 Distribute Evenly
                        </button>
                    </td>
                    <td className="px-2 py-2">
                        <div className="text-xs text-yellow-700">
                            +${(splitDifference / (transaction.splits || []).length).toFixed(2)} per split
                        </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                        <span className="text-sm font-medium text-yellow-700">
                            ${splitDifference.toFixed(2)}
                        </span>
                    </td>
                    <td className="px-2 py-2"></td>
                    <td className="px-1 py-2"></td>
                </tr>
            )}

            {/* CONSOLIDATED BUTTON ROW - Always shows for any transaction being edited */}
            <tr className="bg-theme-tertiary">
                <td className="px-1 py-2 text-center">
                    {transaction.isSplit && (
                        <div className={`${Math.abs(splitDifference) < 0.01 ? 'text-theme-green' : 'text-theme-red'} text-xs`}>
                            {Math.abs(splitDifference) < 0.01 ? '✓' : '!'}
                        </div>
                    )}
                </td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2 text-right">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCancel();
                        }}
                        className="px-3 py-1 text-xs btn-secondary rounded transition-colors"
                    >
                        Cancel
                    </button>
                </td>
                <td className="px-2 py-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                        {transaction.isSplit ? (
                            // Split transaction summary
                            <div className={`${Math.abs(splitDifference) < 0.01 ? 'text-theme-green' : 'text-theme-red'}`}>
                                <div className="text-xs font-medium">${splitTotal.toFixed(2)}</div>
                                <div className="text-xs opacity-70">of ${totalAmount.toFixed(2)}</div>
                                <div className="text-xs">{Math.abs(splitDifference) < 0.01 ? 'Balanced' : `Diff: $${splitDifference.toFixed(2)}`}</div>
                            </div>
                        ) : (
                            // Regular transaction - just show the amount
                            <div className="text-xs font-medium text-theme-primary">
                                ${totalAmount.toFixed(2)}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSave();
                            }}
                            className="px-3 py-1 text-xs btn-primary rounded transition-colors"
                        >
                            {isNew ? 'Add' : 'Save'}
                        </button>
                        {isNew && onSaveAndAddAnother && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSaveAndAddAnother();
                                }}
                                className="px-2 py-1 text-xs btn-success rounded transition-colors ml-1"
                                title="Save and add another"
                            >
                                +
                            </button>
                        )}
                    </div>
                </td>
                <td className="px-1 py-2"></td>
            </tr>
        </>
    );
};


const TransactionsTab = ({
    transactions = [],
    accounts = [],
    categories = [],
    onAddTransaction,
    onEditTransaction,
    onDeleteTransaction,
    onReorderTransactions
}) => {
    // State for search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [accountFilter, setAccountFilter] = useState('all');
    const [viewAccount, setViewAccount] = useState('all'); // NEW: Account-specific view
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');

    // State for bulk selection
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // State for inline editing
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isAddingTransaction, setIsAddingTransaction] = useState(false);

    // Enhanced column widths - better space distribution
    const [columnWidths, setColumnWidths] = useState({
        select: 35,
        date: 130,
        payee: 150,
        category: 180,
        memo: 150,
        outflow: 100,
        inflow: 100,
        cleared: 50,
    });

    // State for expanded split transactions
    const [expandedTransactions, setExpandedTransactions] = useState(new Set());

    // Refs for column resizing
    const tableRef = useRef(null);
    const isResizing = useRef(false);
    const currentColumn = useRef(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    // Helper function to get today's date
    const getTodaysDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // New transaction form state
    const [newTransaction, setNewTransaction] = useState({
        date: getTodaysDate(),
        payee: '',
        categoryId: '',
        memo: '',
        outflow: '',
        inflow: '',
        isCleared: false,
        accountId: accounts[0]?.id || '',
        isTransfer: false,
        transferAccountId: '',
        isSplit: false,
        splits: []
    });

    // Helper functions
    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account ? account.name : 'Unknown';
    };

    const getCategoryName = (categoryId) => {
        if (!categoryId) return '';
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : '';
    };

    // NEW: Transform transaction for account-specific view
    const transformTransactionForAccount = (transaction, viewingAccountId) => {
        if (!transaction.transferAccountId || viewingAccountId === 'all') {
            return transaction;
        }

        // If viewing the transfer destination account
        if (transaction.transferAccountId === parseInt(viewingAccountId)) {
            const sourceAccount = getAccountName(transaction.accountId);
            return {
                ...transaction,
                // Flip the amount and payee for destination account perspective
                amount: -transaction.amount,
                payee: `Transfer from ${sourceAccount}`,
                accountId: parseInt(viewingAccountId),
                transferAccountId: transaction.accountId,
                _isTransformed: true // Mark as transformed for display logic
            };
        }

        return transaction;
    };

    // NEW: Get account-filtered transactions
    const getAccountFilteredTransactions = (transactions, accountId) => {
        if (accountId === 'all') return transactions;

        return transactions.filter(txn => {
            // Show transaction if it belongs to this account
            if (txn.accountId === parseInt(accountId)) return true;

            // For transfers, also show if this account is the destination
            if (txn.transferAccountId === parseInt(accountId)) return true;

            return false;
        }).map(txn => transformTransactionForAccount(txn, accountId));
    };

    // Enhanced transfer payee formatting
    const formatTransferPayee = (transaction) => {
        if (viewAccount === 'all') {
            const fromAccount = getAccountName(transaction.accountId);
            const toAccount = getAccountName(transaction.transferAccountId);
            return `Transfer: ${fromAccount} → ${toAccount}`;
        }

        // Account-specific view
        if (transaction._isTransformed) {
            return transaction.payee; // Already formatted correctly
        }

        const toAccount = getAccountName(transaction.transferAccountId);
        return `Transfer to ${toAccount}`;
    };

    // Filter and sort transactions with account filtering
    const filteredAndSortedTransactions = useMemo(() => {
        // First apply account filtering
        let accountFiltered = getAccountFilteredTransactions(transactions, viewAccount);

        // Then apply other filters
        return accountFiltered
            .filter(transaction => {
                const matchesSearch = transaction.payee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.memo?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = typeFilter === 'all' ||
                    (typeFilter === 'income' && transaction.amount > 0) ||
                    (typeFilter === 'expense' && transaction.amount < 0) ||
                    (typeFilter === 'transfer' && transaction.transferAccountId);
                const matchesAccount = accountFilter === 'all' || transaction.accountId === parseInt(accountFilter);
                return matchesSearch && matchesType && matchesAccount;
            })
            .sort((a, b) => {
                let aValue, bValue;

                switch (sortBy) {
                    case 'date':
                        aValue = new Date(a.date);
                        bValue = new Date(b.date);
                        break;
                    case 'payee':
                        aValue = a.payee?.toLowerCase() || '';
                        bValue = b.payee?.toLowerCase() || '';
                        break;
                    case 'category':
                        aValue = getCategoryName(a.categoryId)?.toLowerCase() || '';
                        bValue = getCategoryName(b.categoryId)?.toLowerCase() || '';
                        break;
                    case 'amount':
                        aValue = Math.abs(a.amount);
                        bValue = Math.abs(b.amount);
                        break;
                    default:
                        return 0;
                }

                if (sortDirection === 'desc') {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                } else {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
            });
    }, [transactions, searchTerm, typeFilter, accountFilter, viewAccount, sortBy, sortDirection]);

    // Handle sorting
    const handleSort = (column) => {
        if (sortBy === column) {
            const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            setSortDirection(newDirection);
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    // Column resizing handlers
    const handleMouseDown = (e, columnKey) => {
        e.stopPropagation();
        e.preventDefault();

        isResizing.current = true;
        currentColumn.current = columnKey;
        startX.current = e.clientX;
        startWidth.current = columnWidths[columnKey];

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isResizing.current || !currentColumn.current) return;

        const diff = e.clientX - startX.current;
        const minWidth = 60;
        const newWidth = Math.max(minWidth, startWidth.current + diff);

        const newColumnWidths = {
            ...columnWidths,
            [currentColumn.current]: newWidth
        };

        setColumnWidths(newColumnWidths);

        // Save to localStorage whenever columns are resized
        localStorage.setItem('transactionTableColumnWidths', JSON.stringify(newColumnWidths));
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        currentColumn.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Transaction editing functions
    const startAddingTransaction = () => {
        setIsAddingTransaction(true);
        setNewTransaction({
            date: getTodaysDate(),
            payee: '',
            categoryId: '',
            memo: '',
            outflow: '',
            inflow: '',
            isCleared: false,
            accountId: viewAccount !== 'all' ? parseInt(viewAccount) : accounts[0]?.id || '',
            isTransfer: false,
            transferAccountId: '',
            isSplit: false,
            splits: []
        });
    };

    const startEditingTransaction = (transaction) => {
        setEditingTransaction(transaction.id);
        setNewTransaction({
            date: transaction.date,
            payee: transaction.transferAccountId ? formatTransferPayee(transaction) : transaction.payee,
            categoryId: transaction.categoryId || '',
            memo: transaction.memo || '',
            outflow: transaction.amount < 0 ? Math.abs(transaction.amount).toString() : '',
            inflow: transaction.amount > 0 ? transaction.amount.toString() : '',
            isCleared: transaction.isCleared || false,
            accountId: transaction.accountId,
            isTransfer: !!transaction.transferAccountId,
            transferAccountId: transaction.transferAccountId || '',
            isSplit: !!transaction.splits && transaction.splits.length > 0,
            // FIX: Deep clone splits array to prevent reference sharing
            splits: transaction.splits ? transaction.splits.map(split => ({
                id: split.id || Date.now() + Math.random(), // Ensure unique IDs
                amount: split.amount,
                categoryId: split.categoryId,
                memo: split.memo
            })) : []
        });
    };

    const cancelEdit = () => {
        setIsAddingTransaction(false);
        setEditingTransaction(null);
        setNewTransaction({
            date: getTodaysDate(),
            payee: '',
            categoryId: '',
            memo: '',
            outflow: '',
            inflow: '',
            isCleared: false,
            accountId: viewAccount !== 'all' ? parseInt(viewAccount) : accounts[0]?.id || '',
            isTransfer: false,
            transferAccountId: '',
            isSplit: false,
            splits: []
        });
    };

    const saveTransaction = () => {
        // Handle string-to-number conversion from CurrencyField
        const outflow = typeof newTransaction.outflow === 'number' ?
            newTransaction.outflow : parseFloat(newTransaction.outflow) || 0;
        const inflow = typeof newTransaction.inflow === 'number' ?
            newTransaction.inflow : parseFloat(newTransaction.inflow) || 0;

        // Validation for regular transactions
        if (!newTransaction.isSplit) {
            if (outflow > 0 && inflow > 0) {
                alert('Transaction cannot have both inflow and outflow amounts');
                return;
            }

            if (outflow === 0 && inflow === 0) {
                alert('Transaction must have either an inflow or outflow amount');
                return;
            }
        }

        // Validation for split transactions
        if (newTransaction.isSplit) {
            const splits = newTransaction.splits || [];
            if (splits.length === 0) {
                alert('Split transactions must have at least one split');
                return;
            }

            for (let split of splits) {
                if (!split.categoryId) {
                    alert('All splits must have a category selected');
                    return;
                }
                const splitAmount = typeof split.amount === 'number' ? split.amount : parseFloat(split.amount) || 0;
                if (splitAmount === 0) {
                    alert('All splits must have a non-zero amount');
                    return;
                }
            }

            const totalAmount = outflow || inflow;
            const splitTotal = splits.reduce((sum, split) => {
                const amount = typeof split.amount === 'number' ? split.amount : parseFloat(split.amount) || 0;
                return sum + Math.abs(amount);
            }, 0);

            if (Math.abs(totalAmount - splitTotal) > 0.01) {
                alert(`Split amounts ($${splitTotal.toFixed(2)}) must equal transaction total ($${totalAmount.toFixed(2)})`);
                return;
            }
        }

        const amount = inflow > 0 ? inflow : -outflow;

        let transactionData = {
            date: newTransaction.date,
            payee: newTransaction.payee,
            memo: newTransaction.memo,
            amount: amount,
            accountId: parseInt(newTransaction.accountId),
            isCleared: newTransaction.isCleared
        };

        // Handle transfers
        if (newTransaction.isTransfer) {
            transactionData = {
                ...transactionData,
                transferAccountId: parseInt(newTransaction.transferAccountId),
                categoryId: null
            };
        }
        // Handle splits
        else if (newTransaction.isSplit) {
            transactionData = {
                ...transactionData,
                categoryId: null,
                isSplit: true,
                splits: newTransaction.splits.map(split => {
                    const splitAmount = typeof split.amount === 'number' ? split.amount : parseFloat(split.amount) || 0;
                    return {
                        amount: splitAmount,
                        categoryId: parseInt(split.categoryId) || null,
                        memo: split.memo || ''
                    };
                })
            };
        }
        // Handle regular transactions
        else {
            transactionData = {
                ...transactionData,
                categoryId: newTransaction.categoryId ? parseInt(newTransaction.categoryId) : null
            };
        }

        if (editingTransaction) {
            onEditTransaction({ ...transactionData, id: editingTransaction });
        } else {
            onAddTransaction(transactionData);
        }

        cancelEdit();
    };

    const saveAndAddAnother = () => {
        saveTransaction();
        setTimeout(() => startAddingTransaction(), 100);
    };

    // Split transaction management
    const addSplit = () => {
        const newSplit = {
            id: Date.now(),
            amount: '',
            categoryId: '',
            memo: ''
        };
        const currentSplits = newTransaction.splits || [];
        setNewTransaction(prev => ({
            ...prev,
            splits: [...currentSplits, newSplit],
            isSplit: true
        }));
    };

    const removeSplit = (splitId) => {
        const currentSplits = newTransaction.splits || [];
        const updatedSplits = currentSplits.filter(split => split.id !== splitId);
        setNewTransaction(prev => ({
            ...prev,
            splits: updatedSplits,
            isSplit: updatedSplits.length > 0
        }));
    };

    const updateSplit = (splitId, field, value) => {
        console.log(`TransactionsTab updateSplit called:`, { splitId, field, value });
        console.log('Current newTransaction.splits before update:', JSON.stringify(newTransaction.splits, null, 2));

        const currentSplits = newTransaction.splits || [];
        const updatedSplits = currentSplits.map(split => {
            if (split.id === splitId) {
                const updatedSplit = { ...split, [field]: value };
                console.log(`TransactionsTab updating split ${splitId}:`, split, '→', updatedSplit);
                return updatedSplit;
            } else {
                console.log(`TransactionsTab keeping split ${split.id} unchanged:`, split);
                return { ...split }; // Clone even unchanged splits to prevent reference issues
            }
        });

        console.log('TransactionsTab updated splits array:', JSON.stringify(updatedSplits, null, 2));

        setNewTransaction(prev => ({
            ...prev,
            splits: updatedSplits
        }));
    };


    // Bulk selection handlers
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedTransactions(new Set());
        } else {
            setSelectedTransactions(new Set(filteredAndSortedTransactions.map(t => t.id)));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectTransaction = (transactionId) => {
        const newSelected = new Set(selectedTransactions);
        if (newSelected.has(transactionId)) {
            newSelected.delete(transactionId);
        } else {
            newSelected.add(transactionId);
        }
        setSelectedTransactions(newSelected);
        setSelectAll(newSelected.size === filteredAndSortedTransactions.length);
    };

    // Cleared status toggle
    const toggleCleared = (transaction) => {
        onEditTransaction({
            ...transaction,
            isCleared: !transaction.isCleared
        });
    };

    // Render cleared status indicator
    const renderClearedStatus = (transaction) => {
        const status = transaction.isCleared ? 'cleared' : 'uncleared';

        return (
            <button
                onClick={() => toggleCleared(transaction)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all text-xs ${status === 'cleared'
                    ? 'bg-theme-green border-theme-green text-white'
                    : 'border-theme-tertiary hover:border-theme-secondary'
                    }`}
                title={status === 'cleared' ? 'Cleared' : 'Click to mark as cleared'}
            >
                {status === 'cleared' && <Check className="w-2 h-2" />}
            </button>
        );
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return null;
        return sortDirection === 'desc' ?
            <ChevronDown className="w-4 h-4 inline ml-1" /> :
            <ChevronUp className="w-4 h-4 inline ml-1" />;
    };

    // Enhanced keyboard shortcuts
    const handleKeyDown = (e) => {
        if (!isAddingTransaction && !editingTransaction) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancelEdit();
        } else if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
                saveAndAddAnother();
            } else {
                saveTransaction();
            }
        }
    };

    useEffect(() => {
        if (isAddingTransaction || editingTransaction) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isAddingTransaction, editingTransaction]);

    return (
        <div className="space-y-6">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-theme-primary">Transactions</h2>
                    <p className="text-sm text-theme-secondary">
                        {filteredAndSortedTransactions.length} transaction{filteredAndSortedTransactions.length !== 1 ? 's' : ''}
                        {selectedTransactions.size > 0 && ` • ${selectedTransactions.size} selected`}
                        {viewAccount !== 'all' && ` • ${getAccountName(parseInt(viewAccount))}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedTransactions.size > 0 && (
                        <button
                            onClick={() => {
                                selectedTransactions.forEach(id => onDeleteTransaction({ id }));
                                setSelectedTransactions(new Set());
                                setSelectAll(false);
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Selected ({selectedTransactions.size})</span>
                        </button>
                    )}
                    <button
                        onClick={startAddingTransaction}
                        className="btn-success text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Transaction</span>
                    </button>
                </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="p-4 rounded-lg bg-theme-secondary">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Account View Selector - NEW */}
                    <div>
                        <label className="block text-xs font-medium mb-1 text-theme-text">View Account</label>
                        <select
                            value={viewAccount}
                            onChange={(e) => setViewAccount(e.target.value)}
                            className="w-full p-2 rounded border bg-theme-primary border-theme-primary text-theme-primary"
                        >
                            <option value="all">All Accounts</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <label className="block text-xs font-medium mb-1 text-theme-text">Search</label>
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-tertiary mt-2" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded border bg-theme-primary border-theme-primary text-theme-primary placeholder-theme-tertiary"
                        />
                    </div>

                    {/* Type Filter */}
                    <div>
                        <label className="block text-xs font-medium mb-1 text-theme-text">Type</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full p-2 rounded border bg-theme-primary border-theme-primary text-theme-primary"
                        >
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expenses</option>
                            <option value="transfer">Transfers</option>
                        </select>
                    </div>

                    {/* Account Filter */}
                    <div>
                        <label className="block text-xs font-medium mb-1 text-theme-text">Filter Account</label>
                        <select
                            value={accountFilter}
                            onChange={(e) => setAccountFilter(e.target.value)}
                            className="w-full p-2 rounded border bg-theme-primary border-theme-primary text-theme-primary"
                        >
                            <option value="all">All Accounts</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setTypeFilter('all');
                                setAccountFilter('all');
                            }}
                            className="w-full px-4 py-2 rounded border bg-theme-primary border-theme-primary hover:bg-theme-hover text-theme-primary"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Compact Table */}
            <div className="bg-theme-primary rounded-lg shadow-sm border border-theme-primary overflow-hidden">
                <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                    <table ref={tableRef} className="w-full table-fixed" style={{ minWidth: '900px' }}>
                        <thead className="table-header border-b border-theme-secondary">
                            <tr>
                                {/* Bulk Select - Compact */}
                                <th
                                    className="px-1 py-2 text-center text-xs font-medium text-theme-secondary uppercase tracking-wider"
                                    style={{ width: columnWidths.select }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="rounded border-theme-secondary"
                                    />
                                </th>

                                {/* Date - WIDER */}
                                <th
                                    className="px-2 py-2 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                    style={{ width: columnWidths.date }}
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Date</span>
                                        <SortIcon column="date" />
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                        onMouseDown={(e) => handleMouseDown(e, 'date')}
                                    />
                                </th>

                                {/* Payee - Compact */}
                                <th
                                    className="px-2 py-2 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                    style={{ width: columnWidths.payee }}
                                    onClick={() => handleSort('payee')}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Payee</span>
                                        <SortIcon column="payee" />
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                        onMouseDown={(e) => handleMouseDown(e, 'payee')}
                                    />
                                </th>

                                {/* Category - Compact */}
                                <th
                                    className="px-2 py-2 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                    style={{ width: columnWidths.category }}
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Category</span>
                                        <SortIcon column="category" />
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                        onMouseDown={(e) => handleMouseDown(e, 'category')}
                                    />
                                </th>

                                {/* Memo - Compact */}
                                <th
                                    className="px-2 py-2 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider relative"
                                    style={{ width: columnWidths.memo }}
                                >
                                    <span>Memo</span>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                        onMouseDown={(e) => handleMouseDown(e, 'memo')}
                                    />
                                </th>

                                {/* Outflow - Compact */}
                                <th
                                    className="px-2 py-2 text-right text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                    style={{ width: columnWidths.outflow }}
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center justify-end">
                                        <span>Out</span>
                                        <SortIcon column="amount" />
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                        onMouseDown={(e) => handleMouseDown(e, 'outflow')}
                                    />
                                </th>

                                {/* Inflow - Compact */}
                                <th
                                    className="px-2 py-2 text-right text-xs font-medium text-theme-secondary uppercase tracking-wider relative"
                                    style={{ width: columnWidths.inflow }}
                                >
                                    <span>In</span>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                        onMouseDown={(e) => handleMouseDown(e, 'inflow')}
                                    />
                                </th>

                                {/* Cleared - Compact */}
                                <th
                                    className="px-1 py-2 text-center text-xs font-medium text-theme-secondary uppercase tracking-wider relative"
                                    style={{ width: columnWidths.cleared }}
                                >
                                    <span>✓</span>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                        onMouseDown={(e) => handleMouseDown(e, 'cleared')}
                                    />
                                </th>

                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-secondary">
                            {/* New Transaction Row */}
                            {isAddingTransaction && (
                                <TransactionEditRow
                                    transaction={newTransaction}
                                    setTransaction={setNewTransaction}
                                    accounts={accounts}
                                    categories={categories}
                                    onSave={saveTransaction}
                                    onSaveAndAddAnother={saveAndAddAnother}
                                    onCancel={cancelEdit}
                                    isNew={true}
                                    addSplit={addSplit}
                                    removeSplit={removeSplit}
                                    updateSplit={updateSplit}
                                    columnWidths={columnWidths} // ← PASS COLUMN WIDTHS
                                    viewAccount={viewAccount} />
                            )}

                            {/* Existing Transactions */}
                            {filteredAndSortedTransactions.map((transaction, index) => (
                                editingTransaction === transaction.id ? (
                                    <TransactionEditRow
                                        key={transaction.id}
                                        transaction={newTransaction}
                                        setTransaction={setNewTransaction}
                                        accounts={accounts}
                                        categories={categories}
                                        onSave={saveTransaction}
                                        onCancel={cancelEdit}
                                        isNew={false}
                                        addSplit={addSplit}
                                        removeSplit={removeSplit}
                                        updateSplit={updateSplit}
                                        columnWidths={columnWidths} // ← PASS COLUMN WIDTHS
                                        viewAccount={viewAccount}
                                    />
                                ) : (
                                    <TransactionRow
                                        key={transaction.id}
                                        transaction={transaction}
                                        index={index}
                                        isSelected={selectedTransactions.has(transaction.id)}
                                        onSelect={handleSelectTransaction}
                                        onEdit={startEditingTransaction}
                                        onDelete={onDeleteTransaction}
                                        getAccountName={getAccountName}
                                        getCategoryName={getCategoryName}
                                        formatTransferPayee={formatTransferPayee}
                                        renderClearedStatus={renderClearedStatus}
                                        expandedTransactions={expandedTransactions}
                                        setExpandedTransactions={setExpandedTransactions}
                                        columnWidths={columnWidths}
                                    />
                                )
                            ))}

                            {/* Empty State */}
                            {filteredAndSortedTransactions.length === 0 && !isAddingTransaction && (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-theme-secondary">                                        {transactions.length === 0 ? (
                                        <>
                                            <p className="text-lg font-medium mb-2">No transactions yet</p>
                                            <p>Add your first transaction to get started!</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg font-medium mb-2">No transactions match your filters</p>
                                            <p>Try adjusting your search or filter criteria</p>
                                        </>
                                    )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Enhanced Summary Footer */}
                {filteredAndSortedTransactions.length > 0 && (
                    <div className="table-header border-t border-theme-secondary p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-theme-secondary font-medium">Total Income</p>
                                <p className="text-lg font-semibold text-theme-green">
                                    ${filteredAndSortedTransactions
                                        .filter(t => t.amount > 0 && !t.transferAccountId)
                                        .reduce((sum, t) => sum + t.amount, 0)
                                        .toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-theme-secondary font-medium">Total Expenses</p>
                                <p className="text-lg font-semibold text-theme-red">
                                    ${filteredAndSortedTransactions
                                        .filter(t => t.amount < 0 && !t.transferAccountId)
                                        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                                        .toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-theme-secondary font-medium">Transfers</p>
                                <p className="text-lg font-semibold text-theme-blue">
                                    {filteredAndSortedTransactions.filter(t => t.transferAccountId).length} transactions
                                </p>
                            </div>
                            <div>
                                <p className="text-theme-secondary font-medium">Net Amount</p>
                                <p className={`text-lg font-semibold ${filteredAndSortedTransactions.reduce((sum, t) => sum + (t.transferAccountId ? 0 : t.amount), 0) >= 0
                                    ? 'text-theme-green' : 'text-theme-red'
                                    }`}>
                                    ${filteredAndSortedTransactions
                                        .reduce((sum, t) => sum + (t.transferAccountId ? 0 : t.amount), 0)
                                        .toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Enhanced TransactionRow Component with Hover Actions and Compact Layout
const TransactionRow = ({
    transaction,
    index,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    getAccountName,
    getCategoryName,
    formatTransferPayee,
    renderClearedStatus,
    expandedTransactions,
    setExpandedTransactions,
    columnWidths
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Check if this is a split transaction
    const isSplitTransaction = transaction.isSplit && transaction.splits && transaction.splits.length > 0;
    const isExpanded = expandedTransactions.has(transaction.id);

    // Calculate split totals and difference (needed for the summary row)
    const totalAmount = Math.abs(transaction.amount || 0);
    const splitTotal = (transaction.splits || []).reduce((sum, split) => {
        const amount = typeof split.amount === 'number' ? split.amount : parseFloat(split.amount) || 0;
        return sum + Math.abs(amount);
    }, 0);
    const splitDifference = Math.abs(totalAmount - splitTotal);

    const toggleExpanded = () => {
        if (isSplitTransaction) {
            const newExpanded = new Set(expandedTransactions);
            if (isExpanded) {
                newExpanded.delete(transaction.id);
            } else {
                newExpanded.add(transaction.id);
            }
            setExpandedTransactions(newExpanded);
        }
    };

    return (
        <>
            <tr
                className={`transition-colors hover:table-row-hover ${index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
                    } ${isSelected ? 'bg-theme-active' : ''} ${isSplitTransaction ? 'cursor-pointer' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={isSplitTransaction ? toggleExpanded : undefined}
            >
                {/* Bulk Select - Compact */}
                <td className="px-1 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(transaction.id)}
                        className="rounded border-theme-secondary"
                    />
                </td>

                {/* Date - More space for calendar picker */}
                <td className="px-2 py-2 text-theme-primary">
                    <div className="flex items-center">
                        {isSplitTransaction && (
                            <button
                                className="mr-1 text-theme-secondary hover:text-theme-primary transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded();
                                }}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-3 h-3" />
                                ) : (
                                    <ChevronUp className="w-3 h-3" />
                                )}
                            </button>
                        )}
                        <span className="text-sm">{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                </td>

                {/* Payee - With Hover Actions */}
                <td className="px-2 py-2 relative group">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-theme-primary truncate">
                                {transaction.transferAccountId
                                    ? formatTransferPayee(transaction)
                                    : transaction.payee || 'Unknown Payee'}
                                {isSplitTransaction && (
                                    <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                        Split ({transaction.splits.length})
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Hover Actions */}
                        <div className={`flex items-center gap-1 transition-all duration-200 ml-2 ${isHovered ? 'opacity-100' : 'opacity-0'
                            }`} onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => onEdit(transaction)}
                                className="p-1 rounded hover:bg-theme-hover transition-colors text-theme-secondary"
                                title="Edit transaction"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => onDelete({
                                    id: transaction.id,
                                    payee: transaction.payee || 'Unnamed Transaction'
                                })}
                                className="p-1 rounded hover:bg-theme-hover text-theme-red transition-colors"
                                title="Delete transaction"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </td>

                {/* Category - Compact */}
                <td className="px-2 py-2 text-theme-secondary">
                    <span className="text-sm truncate">
                        {transaction.transferAccountId ? (
                            'Transfer'
                        ) : isSplitTransaction ? (
                            <span className="italic text-theme-tertiary">Multiple</span>
                        ) : (
                            getCategoryName(transaction.categoryId) || 'Uncategorized'
                        )}
                    </span>
                </td>

                {/* Memo - Compact */}
                <td className="px-2 py-2 text-theme-secondary text-xs">
                    {transaction.memo && (
                        <div className="truncate" title={transaction.memo}>
                            {transaction.memo}
                        </div>
                    )}
                </td>

                {/* Outflow - Compact */}
                <td className="px-2 py-2 text-right">
                    {transaction.amount < 0 && (
                        <span className="font-semibold text-theme-red text-sm">
                            ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                    )}
                </td>

                {/* Inflow - Compact */}
                <td className="px-2 py-2 text-right">
                    {transaction.amount > 0 && (
                        <span className="font-semibold text-theme-green text-sm">
                            ${transaction.amount.toFixed(2)}
                        </span>
                    )}
                </td>

                {/* Cleared - Compact */}
                <td className="px-1 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {renderClearedStatus(transaction)}
                </td>

            </tr>

            {/* Split Detail Rows */}
            {isSplitTransaction && isExpanded && (
                <>
                    {transaction.splits.map((split, splitIndex) => (
                        <tr key={split.id} className="bg-theme-tertiary border-t border-theme-secondary/20">
                            {/* Checkbox column */}
                            <td className="px-1 py-2 text-center" style={{ width: columnWidths.select }}></td>

                            {/* Date column with indentation */}
                            <td className="px-2 py-2" style={{ width: columnWidths.date }}>
                                <div className="flex items-center">
                                    <div className="w-6"></div> {/* Consistent indentation space */}
                                    <span className="text-xs text-theme-tertiary">
                                        Split {splitIndex + 1}
                                    </span>
                                </div>
                            </td>

                            {/* Payee/Split name */}
                            <td className="px-2 py-2" style={{ width: columnWidths.payee }}>
                                <div className="text-sm text-theme-primary">
                                    {split.memo || `Split ${splitIndex + 1}`}
                                </div>
                            </td>

                            {/* Category */}
                            <td className="px-2 py-2" style={{ width: columnWidths.category }}>
                                <span className="text-sm text-theme-secondary">
                                    {getCategoryName(split.categoryId) || 'Uncategorized'}
                                </span>
                            </td>

                            {/* Memo */}
                            <td className="px-2 py-2" style={{ width: columnWidths.memo }}></td>

                            {/* Outflow */}
                            <td className="px-2 py-2 text-right" style={{ width: columnWidths.outflow }}>
                                {split.amount < 0 && (
                                    <span className="font-medium text-theme-red text-sm">
                                        ${Math.abs(split.amount).toFixed(2)}
                                    </span>
                                )}
                            </td>

                            {/* Inflow */}
                            <td className="px-2 py-2 text-right" style={{ width: columnWidths.inflow }}>
                                {split.amount > 0 && (
                                    <span className="font-medium text-theme-green text-sm">
                                        ${split.amount.toFixed(2)}
                                    </span>
                                )}
                            </td>

                            {/* Cleared status */}
                            <td className="px-1 py-2" style={{ width: columnWidths.cleared }}></td>
                        </tr>
                    ))}

                    {/* Split Summary Row - Only show when isExpanded */}
                    {/* Split Summary Row - Only show when isExpanded */}
                    {isExpanded && (
                        <tr className="bg-theme-tertiary border-t border-theme-secondary/20">
                            <td className="px-1 py-2"></td>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2 text-right">
                                <div className={`${Math.abs(splitDifference) < 0.01 ? 'text-theme-green' : 'text-theme-red'}`}>
                                    <div className="text-xs font-medium">${splitTotal.toFixed(2)}</div>
                                    <div className="text-xs opacity-70">of ${totalAmount.toFixed(2)}</div>
                                    <div className="text-xs">{Math.abs(splitDifference) < 0.01 ? 'Balanced' : `Diff: ${splitDifference.toFixed(2)}`}</div>
                                </div>
                            </td>
                            <td className="px-1 py-2"></td>
                        </tr>
                    )}
                </>
            )}
        </>
    );
};
export default TransactionsTab;