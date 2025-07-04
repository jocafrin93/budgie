// Enhanced TransactionsTab.js with mobile responsiveness and improved split handling
import {
    ArrowRight,
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

// Enhanced TransactionEditRow Component with Mobile Support
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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleInputChange = (field, value) => {
        setTransaction((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAccountChange = (value) => {
        setTransaction((prev) => ({
            ...prev,
            accountId: value
        }));
    };

    const handleTransferAccountChange = (value) => {
        setTransaction((prev) => ({
            ...prev,
            transferAccountId: value
        }));
    };

    const toggleTransfer = () => {
        if (transaction.isTransfer) {
            // Turning off transfer mode
            setTransaction((prev) => ({
                ...prev,
                isTransfer: false,
                transferAccountId: '',
                payee: '',
                isSplit: false,
                splits: []
            }));
        } else {
            // Turning on transfer mode
            const fromAccount = accounts.find(
                (acc) => acc.id === parseInt(transaction.accountId)
            );
            const defaultPayee = fromAccount
                ? `Transfer: ${fromAccount.name}`
                : 'Transfer';

            setTransaction((prev) => ({
                ...prev,
                isTransfer: true,
                isSplit: false,
                splits: [],
                payee: defaultPayee,
                categoryId: ''
            }));
        }
    };

    const toggleSplit = () => {
        if (transaction.isSplit) {
            // Turning off split mode
            setTransaction((prev) => ({
                ...prev,
                isSplit: false,
                splits: [],
                isTransfer: false,
                transferAccountId: ''
            }));
        } else {
            // Turning on split mode
            setTransaction((prev) => ({
                ...prev,
                isSplit: true,
                isTransfer: false,
                transferAccountId: '',
                splits:
                    prev.splits && prev.splits.length > 0
                        ? prev.splits
                        : [
                            {
                                id: Date.now(),
                                amount: '',
                                categoryId: '',
                                memo: ''
                            }
                        ]
            }));
        }
    };

    // Calculate split balance
    const outflowAmount =
        typeof transaction.outflow === 'number'
            ? transaction.outflow
            : parseFloat(transaction.outflow) || 0;
    const inflowAmount =
        typeof transaction.inflow === 'number'
            ? transaction.inflow
            : parseFloat(transaction.inflow) || 0;
    const totalAmount = outflowAmount || inflowAmount;
    const splitTotal = (transaction.splits || []).reduce((sum, split) => {
        const amount =
            typeof split.amount === 'number'
                ? split.amount
                : parseFloat(split.amount) || 0;
        return sum + Math.abs(amount);
    }, 0);
    const splitDifference = Math.abs(totalAmount - splitTotal);

    // Auto-balance function for splits
    const distributeDifference = () => {
        if (Math.abs(splitDifference) < 0.01 || !transaction.splits?.length) return;

        // Calculate the actual split total using signed values (not absolute values)
        const actualSplitTotal = (transaction.splits || []).reduce((sum, split) => {
            const amount = typeof split.amount === 'number'
                ? split.amount
                : parseFloat(split.amount) || 0;
            return sum + amount; // Don't use Math.abs here
        }, 0);

        // The difference we need to distribute
        const difference = totalAmount - Math.abs(actualSplitTotal); // 5 - 4 = 1
        const splitsCount = transaction.splits.length;
        const amountPerSplit = difference / splitsCount; // 1 / 2 = 0.5

        const updatedSplits = transaction.splits.map((split) => {
            const currentAmount = parseFloat(split.amount) || 0; // -1, -3
            // For outflows (negative amounts), subtract the adjustment to make them more negative
            const newAmount = currentAmount - amountPerSplit; // -1 - 0.5 = -1.5, -3 - 0.5 = -3.5

            return {
                ...split,
                amount: newAmount
            };
        });

        setTransaction((prev) => ({
            ...prev,
            splits: updatedSplits
        }));
    };

    return (
        <>
            {isMobile ? (
                <div className="bg-theme-hover rounded-lg border-2 border-theme-accent mb-3 overflow-hidden">
                    <div className="p-4 space-y-4">
                        {/* Basic Transaction Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-theme-secondary mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={transaction.date}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    className="w-full px-3 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-theme-secondary mb-1">
                                    Amount
                                </label>
                                <div className="flex">
                                    <CurrencyField
                                        name="mobile_amount"
                                        value={Math.abs(outflowAmount || inflowAmount) || 0}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            if (outflowAmount > 0) {
                                                handleInputChange('outflow', value);
                                                handleInputChange('inflow', 0);
                                            } else {
                                                handleInputChange('inflow', value);
                                                handleInputChange('outflow', 0);
                                            }
                                        }}
                                        hideLabel={true}
                                        placeholder="0.00"
                                        className="flex-1 px-3 py-2 border rounded-l bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                        darkMode={false}
                                    />
                                    <button
                                        onClick={() => {
                                            const amount =
                                                Math.abs(outflowAmount || inflowAmount) || 0;
                                            handleInputChange('outflow', amount);
                                            handleInputChange('inflow', 0);
                                        }}
                                        className={`px-3 py-2 border-t border-b text-xs ${outflowAmount > 0
                                            ? 'bg-theme-red text-theme-primary border-theme-red'
                                            : 'bg-theme-secondary text-theme-tertiary border-theme-secondary'
                                            }`}
                                    >
                                        Out
                                    </button>
                                    <button
                                        onClick={() => {
                                            const amount =
                                                Math.abs(outflowAmount || inflowAmount) || 0;
                                            handleInputChange('inflow', amount);
                                            handleInputChange('outflow', 0);
                                        }}
                                        className={`px-3 py-2 border-t border-r border-b rounded-r text-xs ${inflowAmount > 0
                                            ? 'bg-theme-green text-theme-primary border-theme-green'
                                            : 'bg-theme-secondary text-theme-tertiary border-theme-secondary'
                                            }`}
                                    >
                                        In
                                    </button>
                                </div>
                            </div>
                        </div>

                        {viewAccount === 'all' && (
                            <div>
                                <label className="block text-xs font-medium text-theme-secondary mb-1">
                                    Account
                                </label>
                                <select
                                    value={transaction.accountId}
                                    onChange={(e) => handleAccountChange(e.target.value)}
                                    className="w-full px-3 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                >
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} (${(account.balance || 0).toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-theme-secondary mb-1">
                                Payee
                            </label>
                            <input
                                type="text"
                                value={transaction.payee}
                                onChange={(e) => handleInputChange('payee', e.target.value)}
                                placeholder={transaction.isTransfer ? 'Transfer' : 'Payee'}
                                disabled={transaction.isTransfer}
                                className={`w-full px-3 py-2 border rounded text-sm ${transaction.isTransfer
                                    ? 'bg-theme-secondary border-theme-secondary text-theme-tertiary cursor-not-allowed'
                                    : 'bg-theme-primary border-theme-secondary text-theme-primary'
                                    }`}
                            />
                        </div>

                        {/* Transaction Type Toggles */}
                        <div className="flex gap-2">
                            <button
                                onClick={toggleSplit}
                                className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1 ${transaction.isSplit
                                    ? 'bg-theme-blue text-theme-primary border border-theme-blue'
                                    : 'bg-theme-secondary text-theme-tertiary border border-theme-secondary hover:bg-theme-hover'
                                    }`}
                                disabled={transaction.isTransfer}
                            >
                                <Split size={14} />
                                Split
                            </button>
                            <button
                                onClick={toggleTransfer}
                                className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1 ${transaction.isTransfer
                                    ? 'bg-theme-blue text-theme-primary border border-theme-blue'
                                    : 'bg-theme-secondary text-theme-tertiary border border-theme-secondary hover:bg-theme-hover'
                                    }`}
                                disabled={transaction.isSplit}
                            >
                                <ArrowRight size={14} />
                                Transfer
                            </button>
                        </div>

                        {/* Category or Transfer Account */}
                        <div>
                            <label className="block text-xs font-medium text-theme-secondary mb-1">
                                {transaction.isTransfer ? 'To Account' : 'Category'}
                            </label>
                            {transaction.isTransfer ? (
                                <select
                                    value={transaction.transferAccountId}
                                    onChange={(e) => handleTransferAccountChange(e.target.value)}
                                    className="w-full px-3 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                >
                                    <option value="">To account...</option>
                                    {accounts
                                        .filter((acc) => acc.id !== parseInt(transaction.accountId))
                                        .map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                </select>
                            ) : transaction.isSplit ? (
                                <div className="flex items-center gap-1 text-theme-blue px-3 py-2 bg-theme-secondary rounded text-sm">
                                    <Split size={14} />
                                    Split Transaction
                                </div>
                            ) : (
                                <select
                                    value={transaction.categoryId}
                                    onChange={(e) =>
                                        handleInputChange('categoryId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                >
                                    <option value="">Select category...</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-theme-secondary mb-1">
                                Memo
                            </label>
                            <input
                                type="text"
                                value={transaction.memo}
                                onChange={(e) => handleInputChange('memo', e.target.value)}
                                placeholder="Memo"
                                className="w-full px-3 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                            />
                        </div>

                        {/* Split Details */}
                        {transaction.isSplit && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium text-theme-primary">
                                        Split Details
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {Math.abs(splitDifference) >= 0.01 && (
                                            <button
                                                onClick={distributeDifference}
                                                className="px-2 py-1 text-xs bg-theme-yellow text-theme-primary rounded hover:bg-theme-hover"
                                            >
                                                Auto-balance
                                            </button>
                                        )}
                                        <div className="text-xs">
                                            <span
                                                className={`font-medium ${Math.abs(splitDifference) < 0.01
                                                    ? 'text-theme-green'
                                                    : 'text-theme-red'
                                                    }`}
                                            >
                                                ${splitTotal.toFixed(2)} / ${totalAmount.toFixed(2)}
                                                {Math.abs(splitDifference) >= 0.01 && (
                                                    <span className="text-theme-red ml-1">
                                                        (${splitDifference.toFixed(2)})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {(transaction.splits || []).map((split, index) => (
                                    <div
                                        key={split.id}
                                        className="p-3 bg-theme-tertiary rounded border border-theme-secondary"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-medium text-theme-primary">
                                                Split {index + 1}
                                            </span>
                                            {(transaction.splits || []).length > 1 && (
                                                <button
                                                    onClick={() => removeSplit(split.id)}
                                                    className="text-theme-red hover:text-theme-red"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <select
                                                value={split.categoryId}
                                                onChange={(e) =>
                                                    updateSplit(split.id, 'categoryId', e.target.value)
                                                }
                                                className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                            >
                                                <option value="">Select category...</option>
                                                {categories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <div className="flex gap-2">
                                                <CurrencyField
                                                    name={`mobile_split_${split.id}`}
                                                    value={Math.abs(parseFloat(split.amount) || 0)}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || 0;
                                                        const currentAmount = parseFloat(split.amount) || 0;
                                                        updateSplit(
                                                            split.id,
                                                            'amount',
                                                            currentAmount < 0 ? -value : value
                                                        );
                                                    }}
                                                    hideLabel={true}
                                                    placeholder="Amount"
                                                    className="flex-1 px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                                    darkMode={false}
                                                />
                                                <button
                                                    onClick={() =>
                                                        updateSplit(
                                                            split.id,
                                                            'amount',
                                                            -Math.abs(parseFloat(split.amount) || 0)
                                                        )
                                                    }
                                                    className={`px-2 py-1 text-xs rounded ${(parseFloat(split.amount) || 0) < 0
                                                        ? 'bg-theme-red text-theme-primary'
                                                        : 'bg-theme-secondary text-theme-tertiary'
                                                        }`}
                                                >
                                                    Out
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        updateSplit(
                                                            split.id,
                                                            'amount',
                                                            Math.abs(parseFloat(split.amount) || 0)
                                                        )
                                                    }
                                                    className={`px-2 py-1 text-xs rounded ${(parseFloat(split.amount) || 0) > 0
                                                        ? 'bg-theme-green text-theme-primary'
                                                        : 'bg-theme-secondary text-theme-tertiary'
                                                        }`}
                                                >
                                                    In
                                                </button>
                                            </div>

                                            <input
                                                type="text"
                                                value={split.memo || ''}
                                                onChange={(e) =>
                                                    updateSplit(split.id, 'memo', e.target.value)
                                                }
                                                placeholder="Split memo"
                                                className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={addSplit}
                                    className="w-full py-2 border-2 border-dashed border-theme-blue rounded text-theme-blue hover:border-theme-accent text-sm"
                                >
                                    <Plus size={14} className="inline mr-1" />
                                    Add Split
                                </button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2 px-3 btn-secondary rounded text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSave}
                                className="flex-1 py-2 px-3 btn-primary rounded text-sm font-medium"
                            >
                                Save
                            </button>
                        </div>

                        {isNew && onSaveAndAddAnother && (
                            <button
                                onClick={onSaveAndAddAnother}
                                className="w-full py-2 px-3 btn-success rounded text-sm font-medium"
                            >
                                Save & Add Another
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <tr className="bg-theme-hover" style={{ width: '100%' }}>
                        {/* Bulk Select */}
                        <td
                            className="px-1 py-2 text-center"
                            style={{ width: columnWidths.select }}
                        >
                            <input
                                type="checkbox"
                                disabled
                                className="rounded border-theme-secondary opacity-50"
                            />
                        </td>

                        {viewAccount === 'all' && (
                            <td className="px-2 py-2" style={{ width: columnWidths.account }}>
                                <select
                                    value={transaction.accountId}
                                    onChange={(e) => handleAccountChange(e.target.value)}
                                    className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                >
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} (${(account.balance || 0).toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </td>
                        )}

                        {/* Date */}
                        <td className="px-2 py-2" style={{ width: columnWidths.date }}>
                            <input
                                type="date"
                                value={transaction.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                            />
                        </td>

                        {/* Payee */}
                        <td className="px-2 py-2" style={{ width: columnWidths.payee }}>
                            <input
                                type="text"
                                value={transaction.payee}
                                onChange={(e) => handleInputChange('payee', e.target.value)}
                                placeholder={transaction.isTransfer ? 'Transfer' : 'Payee'}
                                disabled={transaction.isTransfer}
                                className={`w-full px-2 py-1 border rounded text-sm ${transaction.isTransfer
                                    ? 'bg-theme-secondary border-theme-secondary text-theme-tertiary cursor-not-allowed'
                                    : 'bg-theme-primary border-theme-secondary text-theme-primary'
                                    }`}
                            />
                        </td>

                        {/* Category OR Transfer Account - Enhanced with larger toggle buttons */}
                        <td className="px-2 py-2" style={{ width: columnWidths.category }}>
                            {transaction.isTransfer ? (
                                <div className="flex items-center gap-1">
                                    <ArrowRight className="w-4 h-4 text-theme-blue flex-shrink-0" />
                                    <select
                                        value={transaction.transferAccountId}
                                        onChange={(e) =>
                                            handleTransferAccountChange(e.target.value)
                                        }
                                        className="flex-1 px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                    >
                                        <option value="">To account...</option>
                                        {accounts
                                            .filter(
                                                (acc) => acc.id !== parseInt(transaction.accountId)
                                            )
                                            .map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name}
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={toggleTransfer}
                                        className="p-1 text-theme-red hover:bg-theme-hover rounded transition-colors flex-shrink-0"
                                        title="Remove transfer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : transaction.isSplit ? (
                                <div className="flex items-center gap-1">
                                    <Split className="w-4 h-4 text-theme-blue flex-shrink-0" />
                                    <input
                                        type="text"
                                        value="Split Transaction"
                                        disabled
                                        className="flex-1 px-2 py-1 border rounded bg-theme-secondary border-theme-secondary text-theme-tertiary text-sm cursor-not-allowed"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleSplit}
                                        className="p-1 text-theme-red hover:bg-theme-hover rounded transition-colors flex-shrink-0"
                                        title="Remove split"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <select
                                        value={transaction.categoryId}
                                        onChange={(e) =>
                                            handleInputChange('categoryId', e.target.value)
                                        }
                                        className="flex-1 px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                    >
                                        <option value="">Select category...</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={toggleSplit}
                                        className="p-2 text-theme-blue hover:bg-theme-hover rounded transition-colors flex-shrink-0 border border-theme-secondary"
                                        title="Split transaction"
                                    >
                                        <Split className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={toggleTransfer}
                                        className="p-2 text-theme-blue hover:bg-theme-hover rounded transition-colors flex-shrink-0 border border-theme-secondary"
                                        title="Make transfer"
                                    >
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </td>

                        {/* Memo */}
                        <td className="px-2 py-2" style={{ width: columnWidths.memo }}>
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
                                    handleInputChange('outflow', e.target.value);
                                    if (e.target.value) handleInputChange('inflow', 0);
                                }}
                                hideLabel={true}
                                placeholder="0.00"
                                className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm text-right"
                                darkMode={false}
                            />
                            {/* {transaction.isTransfer && outflowAmount > 0 && (
                                <div className="text-xs text-theme-tertiary mt-1">
                                    To:{' '}
                                    {accounts.find(
                                        (acc) => acc.id === parseInt(transaction.transferAccountId)
                                    )?.name || 'Select account'}
                                </div>
                            )} */}
                        </td>

                        {/* Inflow */}
                        <td className="px-2 py-2" style={{ width: columnWidths.inflow }}>
                            <CurrencyField
                                name="inflow"
                                value={transaction.inflow || 0}
                                onChange={(e) => {
                                    handleInputChange('inflow', e.target.value);
                                    if (e.target.value) handleInputChange('outflow', 0);
                                }}
                                hideLabel={true}
                                placeholder="0.00"
                                className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm text-right"
                                darkMode={false}
                            />
                            {transaction.isTransfer && inflowAmount > 0 && (
                                <div className="text-xs text-theme-tertiary mt-1">
                                    From:{' '}
                                    {accounts.find(
                                        (acc) => acc.id === parseInt(transaction.transferAccountId)
                                    )?.name || 'Select account'}
                                </div>
                            )}
                        </td>

                        {/* Cleared */}
                        <td
                            className="px-1 py-2 text-center"
                            style={{ width: columnWidths.cleared }}
                        >
                            <input
                                type="checkbox"
                                checked={transaction.isCleared}
                                onChange={(e) =>
                                    handleInputChange('isCleared', e.target.checked)
                                }
                                className="rounded border-theme-secondary"
                            />
                        </td>
                    </tr>
                    {/* Split Rows */}
                    {transaction.isSplit &&
                        (transaction.splits || []).map((split, index) => (
                            <tr key={split.id} className="bg-theme-tertiary">
                                <td className="px-1 py-2"></td>
                                {viewAccount === 'all' && <td className="px-2 py-2"></td>}
                                <td className="px-2 py-2"></td>
                                <td className="px-2 py-2">
                                    <div className="flex items-center gap-2 ml-4">
                                        <span className="text-sm text-theme-secondary">
                                            Split {index + 1}
                                        </span>
                                        {(transaction.splits || []).length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSplit(split.id)}
                                                className="text-xs text-theme-red hover:text-theme-red underline"
                                            >
                                                Remove
                                            </button>
                                        )}
                                        {index === (transaction.splits || []).length - 1 && (
                                            <button
                                                type="button"
                                                onClick={addSplit}
                                                className="text-xs text-theme-blue hover:text-theme-blue underline"
                                            >
                                                + Add Split
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-2 py-2">
                                    <select
                                        value={split.categoryId}
                                        onChange={(e) =>
                                            updateSplit(split.id, 'categoryId', e.target.value)
                                        }
                                        className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                    >
                                        <option value="">Select category...</option>
                                        {categories.map((category) => (
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
                                        onChange={(e) =>
                                            updateSplit(split.id, 'memo', e.target.value)
                                        }
                                        placeholder="Split memo"
                                        className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <CurrencyField
                                        name={`split_${split.id}_outflow`}
                                        value={split.amount < 0 ? Math.abs(split.amount) : 0}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value) {
                                                updateSplit(
                                                    split.id,
                                                    'amount',
                                                    -Math.abs(parseFloat(value) || 0)
                                                );
                                            } else {
                                                updateSplit(split.id, 'amount', '');
                                            }
                                        }}
                                        hideLabel={true}
                                        placeholder="0.00"
                                        className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm text-right"
                                        darkMode={false}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <CurrencyField
                                        name={`split_${split.id}_inflow`}
                                        value={split.amount > 0 ? split.amount : 0}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value) {
                                                updateSplit(
                                                    split.id,
                                                    'amount',
                                                    Math.abs(parseFloat(value) || 0)
                                                );
                                            } else {
                                                updateSplit(split.id, 'amount', '');
                                            }
                                        }}
                                        hideLabel={true}
                                        placeholder="0.00"
                                        className="w-full px-2 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm text-right"
                                        darkMode={false}
                                    />
                                </td>
                                <td className="px-1 py-2"></td>
                            </tr>
                        ))}
                    {/* Simple action row with just Cancel/Approve */}
                    <tr className="bg-theme-secondary">
                        <td className="px-1 py-2"></td>
                        {viewAccount === 'all' && <td className="px-2 py-2"></td>}
                        <td
                            className="px-2 py-2"
                            colSpan={viewAccount === 'all' ? '4' : '4'}
                        ></td>
                        <td className="px-2 py-2 text-right" colSpan="2">
                            <div className="flex space-x-2 justify-end items-center">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onCancel();
                                    }}
                                    className="px-3 py-1 text-xs btn-secondary rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onSave();
                                    }}
                                    className="px-3 py-1 btn-success rounded text-xs whitespace-nowrap"
                                >
                                    Approve
                                </button>
                                {isNew && onSaveAndAddAnother && (
                                    <button
                                        type="button"

                                        onClick={onSaveAndAddAnother}
                                        className="px-3 py-1 btn-success rounded text-xs whitespace-nowrap"                                        >
                                        Add Another
                                    </button>
                                )}
                            </div>
                        </td>
                        <td className="px-1 py-2"></td>
                    </tr>
                    {/* Split info row - only show if it's a split transaction */}
                    {transaction.isSplit && (transaction.splits || []).length > 0 && (
                        <tr className="bg-theme-secondary" style={{ borderTop: 'none' }}>
                            <td className="px-1 py-2"></td>
                            {viewAccount === 'all' && <td className="px-2 py-2"></td>}
                            <td className="px-2 py-2" colSpan={isNew ? "4" : "3"}></td>
                            <td className="px-2  text-right" colSpan={isNew ? "2" : "3"}>
                                <div className="flex justify-end items-center text-sm flex-row space-x-3">                                    <div className={`font-medium ${Math.abs(splitDifference) < 0.01
                                    ? 'text-theme-green'
                                    : 'text-theme-red'}`}>
                                    <span> {Math.abs(splitDifference) < 0.01 ? '✓' : '!'} </span>
                                    ${splitTotal.toFixed(2)} / ${totalAmount.toFixed(2)}
                                    <span> {Math.abs(splitDifference) >= 0.01 && (
                                        <span className="text-theme-red ml-1">(${splitDifference.toFixed(2)})</span>
                                    )}</span>
                                </div>


                                    {Math.abs(splitDifference) >= 0.01 ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                distributeDifference();
                                            }}
                                            className="py-1 px-3 btn-success rounded text-xs"
                                            title="Distribute the difference evenly across all splits"
                                        >
                                            Balance
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="py-1 px-3 btn-secondary border:none rounded text-xs opacity-50 cursor-not-allowed"
                                            disabled
                                            title="Splits are balanced"
                                        >
                                            <span>Balanced ✓</span>

                                        </button>
                                    )} </div>
                            </td>
                            <td className="px-1 py-2"></td>
                        </tr>
                    )}
                </>
            )}
        </>
    );
};

// Regular Transaction Row Component (for viewing)
const TransactionRow = ({
    transaction,
    index,
    isSelected,
    onSelect,
    onEdit,
    onDeleteTransaction,
    getAccountName,
    getCategoryName,
    formatTransferPayee,
    renderClearedStatus,
    expandedTransactions,
    setExpandedTransactions,
    columnWidths,
    viewAccount
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isSplitTransaction =
        transaction.isSplit && transaction.splits && transaction.splits.length > 0;
    const isExpanded = expandedTransactions.has(transaction.id);

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

    // Mobile Card Layout for viewing
    const MobileTransactionCard = () => {
        return (
            <div className="bg-theme-primary rounded-lg shadow-sm border border-theme-secondary mb-3 overflow-hidden">
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onSelect(transaction.id)}
                                    className="rounded border-theme-secondary"
                                />
                                {isSplitTransaction && (
                                    <button
                                        onClick={toggleExpanded}
                                        className="text-theme-secondary hover:text-theme-primary"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronUp size={16} />
                                        )}
                                    </button>
                                )}
                                <span className="text-sm text-theme-secondary">
                                    {new Date(transaction.date).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="font-medium text-theme-primary mb-1">
                                {transaction.transferAccountId ? (
                                    <div className="flex items-center gap-1 text-theme-blue">
                                        <ArrowRight size={14} />
                                        {formatTransferPayee(transaction)}
                                    </div>
                                ) : (
                                    transaction.payee
                                )}
                            </div>

                            <div className="text-sm text-theme-secondary">
                                {isSplitTransaction ? (
                                    <span className="italic text-theme-tertiary">Multiple</span>
                                ) : transaction.transferAccountId ? (
                                    <span className="text-theme-blue">
                                        → {getAccountName(transaction.transferAccountId)}
                                    </span>
                                ) : (
                                    getCategoryName(transaction.categoryId) || 'Uncategorized'
                                )}
                            </div>

                            {viewAccount === 'all' && (
                                <div className="text-xs text-theme-tertiary mt-1">
                                    {getAccountName(transaction.accountId)}
                                </div>
                            )}
                        </div>

                        <div className="text-right">
                            <div
                                className={`text-lg font-semibold ${transaction.amount < 0 ? 'text-theme-red' : 'text-theme-green'
                                    }`}
                            >
                                {transaction.amount < 0 ? '-' : '+'}$
                                {Math.abs(transaction.amount).toFixed(2)}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onEdit(transaction);
                                    }}
                                    className="text-theme-blue hover:text-theme-accent text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDeleteTransaction(transaction);
                                    }}
                                    className="text-theme-red hover:text-theme-red text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {transaction.memo && (
                        <div className="text-sm text-theme-secondary mt-2">
                            {transaction.memo}
                        </div>
                    )}
                </div>

                {/* Split Details */}
                {isSplitTransaction && isExpanded && (
                    <div className="border-t border-theme-secondary bg-theme-secondary">
                        {transaction.splits.map((split, splitIndex) => (
                            <div
                                key={split.id}
                                className="px-4 py-2 border-b border-theme-tertiary last:border-b-0"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-medium text-theme-primary">
                                            {getCategoryName(split.categoryId)}
                                        </div>
                                        {split.memo && (
                                            <div className="text-xs text-theme-secondary">
                                                {split.memo}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className={`text-sm font-medium ${split.amount < 0 ? 'text-theme-red' : 'text-theme-green'
                                            }`}
                                    >
                                        {split.amount < 0 ? '-' : '+'}$
                                        {Math.abs(split.amount).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Desktop Table Row
    const DesktopTableRow = () => {
        return (
            <>
                <tr
                    className={`transition-colors hover:table-row-hover group ${index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
                        } ${isSelected ? 'bg-theme-active' : ''} ${isSplitTransaction ? 'cursor-pointer' : ''}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={isSplitTransaction ? toggleExpanded : undefined}
                >
                    {/* Bulk Select */}
                    <td
                        className="px-1 py-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect(transaction.id)}
                            className="rounded border-theme-secondary"
                        />
                    </td>

                    {/* Account - Conditional */}
                    {viewAccount === 'all' && (
                        <td className="px-2 py-2 text-theme-primary">
                            <span className="text-sm">
                                {getAccountName(transaction.accountId)}
                            </span>
                        </td>
                    )}

                    {/* Date */}
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
                            <span className="text-sm">
                                {new Date(transaction.date).toLocaleDateString()}
                            </span>
                        </div>
                    </td>

                    {/* Payee */}
                    <td className="px-2 py-2 relative">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-theme-primary truncate">
                                    {transaction.transferAccountId
                                        ? formatTransferPayee(transaction)
                                        : transaction.payee}
                                </div>
                            </div>

                            {/* Show buttons when row is hovered */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(transaction);
                                    }}
                                    className="p-1 text-theme-blue hover:bg-theme-hover rounded transition-colors"
                                    title="Edit transaction"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDeleteTransaction(transaction);
                                    }}
                                    className="p-1 text-theme-red hover:bg-theme-hover rounded transition-colors"
                                    title="Delete transaction"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>

                        </div>
                    </td>

                    {/* Category */}
                    <td className="px-2 py-2">
                        <span className="text-sm text-theme-secondary">
                            {transaction.transferAccountId ? (
                                'Transfer'
                            ) : isSplitTransaction ? (
                                <span className="italic text-theme-tertiary">Multiple</span>
                            ) : (
                                getCategoryName(transaction.categoryId) || 'Uncategorized'
                            )}
                        </span>
                    </td>

                    {/* Memo */}
                    <td className="px-2 py-2 text-theme-secondary text-xs">
                        {transaction.memo && (
                            <div className="truncate" title={transaction.memo}>
                                {transaction.memo}
                            </div>
                        )}
                    </td>

                    {/* Outflow */}
                    <td className="px-2 py-2 text-right">
                        {transaction.amount < 0 && (
                            <span className="font-semibold text-theme-red text-sm">
                                ${Math.abs(transaction.amount).toFixed(2)}
                            </span>
                        )}
                    </td>

                    {/* Inflow */}
                    <td className="px-2 py-2 text-right">
                        {transaction.amount > 0 && (
                            <span className="font-semibold text-theme-green text-sm">
                                ${transaction.amount.toFixed(2)}
                            </span>
                        )}
                    </td>

                    {/* Cleared */}
                    <td
                        className="px-1 py-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderClearedStatus(transaction)}
                    </td>
                </tr>

                {/* Split Detail Rows */}
                {isSplitTransaction && isExpanded && (
                    <>
                        {transaction.splits.map((split, splitIndex) => (
                            <tr key={split.id} className="bg-theme-secondary">
                                <td className="px-1 py-1"></td>
                                {viewAccount === 'all' && <td className="px-2 py-1"></td>}
                                <td className="px-2 py-1 text-xs text-theme-tertiary">
                                    Split {splitIndex + 1}
                                </td>
                                <td className="px-2 py-1 text-xs"></td>
                                <td className="px-2 py-1 text-xs">
                                    {getCategoryName(split.categoryId)}
                                </td>
                                <td className="px-2 py-1 text-xs text-theme-secondary">
                                    {split.memo}
                                </td>
                                <td className="px-2 py-1 text-xs text-right">
                                    {split.amount < 0 && (
                                        <span className="text-theme-red">
                                            ${Math.abs(split.amount).toFixed(2)}
                                        </span>
                                    )}
                                </td>
                                <td className="px-2 py-1 text-xs text-right">
                                    {split.amount > 0 && (
                                        <span className="text-theme-green">
                                            ${split.amount.toFixed(2)}
                                        </span>
                                    )}
                                </td>
                                <td className="px-1 py-1"></td>
                            </tr>
                        ))}
                    </>
                )}
            </>
        );
    };

    return isMobile ? <MobileTransactionCard /> : <DesktopTableRow />;
};

// Main TransactionsTab Component
const TransactionsTab = ({
    transactions = [],
    accounts = [],
    categories = [],
    onAddTransaction,
    onEditTransaction,
    onDeleteTransaction,
    onAccountViewChange,
    viewAccount = 'all'
}) => {
    const [isMobile, setIsMobile] = useState(false);

    // State for search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [accountFilter, setAccountFilter] = useState('all');
    // const [viewAccount, setViewAccount] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');

    // State for bulk selection
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // State for inline editing
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isAddingTransaction, setIsAddingTransaction] = useState(false);
    const [newTransaction, setNewTransaction] = useState({});
    const [showConversionWarning, setShowConversionWarning] = useState(null);


    // Column widths with account column
    const [columnWidths, setColumnWidths] = useState({
        select: 35,
        account: 120,
        date: 130,
        payee: 150,
        category: 180,
        memo: 150,
        outflow: 100,
        inflow: 100,
        cleared: 50
    });

    // State for expanded split transactions
    const [expandedTransactions, setExpandedTransactions] = useState(new Set());
    useEffect(() => {
        console.log('Current transactions in TransactionsTab:', transactions.length);
        console.log('Transactions:', transactions);
    }, [transactions]);
    // Column resizing refs
    const isResizing = useRef(false);
    const currentColumn = useRef(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Helper function to get today's date in YYYY-MM-DD format
    const getTodaysDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Helper functions
    const getAccountName = (accountId) => {
        const account = accounts.find((acc) => acc.id === parseInt(accountId));
        return account ? account.name : 'Unknown Account';
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find((cat) => cat.id === parseInt(categoryId));
        return category ? category.name : 'Uncategorized';
    };

    const formatTransferPayee = (transaction) => {
        if (!transaction.transferAccountId) return transaction.payee;
        const fromAccount = accounts.find(
            (acc) => acc.id === parseInt(transaction.accountId)
        );
        const toAccount = accounts.find(
            (acc) => acc.id === parseInt(transaction.transferAccountId)
        );
        return `Transfer: ${fromAccount?.name || 'Unknown'} → ${toAccount?.name || 'Unknown'
            }`;
    };

    const renderClearedStatus = (transaction) => {
        return (
            <input
                type="checkbox"
                checked={transaction.isCleared || false}
                onChange={(e) => {
                    e.stopPropagation();
                    onEditTransaction({
                        ...transaction,
                        isCleared: e.target.checked
                    });
                }}
                className="rounded border-theme-secondary"
            />
        );
    };

    // Transaction management functions
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
            accountId:
                viewAccount !== 'all' ? parseInt(viewAccount) : accounts[0]?.id || '',
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
            payee: transaction.transferAccountId
                ? formatTransferPayee(transaction)
                : transaction.payee,
            categoryId: transaction.categoryId || '',
            memo: transaction.memo || '',
            outflow:
                transaction.amount < 0 ? Math.abs(transaction.amount).toString() : '',
            inflow: transaction.amount > 0 ? transaction.amount.toString() : '',
            isCleared: transaction.isCleared || false,
            accountId: transaction.accountId,
            isTransfer: !!transaction.transferAccountId,
            transferAccountId: transaction.transferAccountId || '',
            isSplit: !!transaction.isSplit,
            splits: transaction.splits || []
        });
    };

    const cancelEdit = () => {
        setIsAddingTransaction(false);
        setEditingTransaction(null);
        setNewTransaction({});
    };

    // Enhanced saveTransaction function that handles ALL conversion types
    const saveTransaction = () => {
        const outflowAmount = parseFloat(newTransaction.outflow) || 0;
        const inflowAmount = parseFloat(newTransaction.inflow) || 0;
        const amount = outflowAmount > 0 ? -outflowAmount : inflowAmount;

        // Build base transaction data with safe defaults
        let transactionData = {
            date: newTransaction.date,
            payee: newTransaction.isTransfer ? '' : newTransaction.payee,
            memo: newTransaction.memo,
            amount: amount,
            isCleared: newTransaction.isCleared || false,
            accountId: parseInt(newTransaction.accountId),
            transferAccountId: newTransaction.isTransfer
                ? parseInt(newTransaction.transferAccountId)
                : null,
            isSplit: newTransaction.isSplit || false
        };

        // Handle split transactions FIRST
        if (newTransaction.isSplit && newTransaction.splits && newTransaction.splits.length > 0) {
            transactionData = {
                ...transactionData,
                splits: newTransaction.splits.map((split) => {
                    const splitAmount = typeof split.amount === 'number'
                        ? split.amount
                        : parseFloat(split.amount) || 0;
                    return {
                        amount: splitAmount,
                        categoryId: parseInt(split.categoryId) || null,
                        memo: split.memo || ''
                    };
                })
            };
        } else {
            transactionData = {
                ...transactionData,
                categoryId: newTransaction.categoryId
                    ? parseInt(newTransaction.categoryId)
                    : null
            };
        }

        if (editingTransaction) {
            // EDITING EXISTING TRANSACTION
            const originalTransaction = transactions.find(t => t.id === editingTransaction);

            if (originalTransaction) {
                // Determine transaction types
                const wasTransfer = !!originalTransaction.transferAccountId;
                const wasSplit = !!originalTransaction.isSplit && originalTransaction.splits?.length > 0;
                const isNowTransfer = newTransaction.isTransfer && newTransaction.transferAccountId;
                const isNowSplit = newTransaction.isSplit && newTransaction.splits?.length > 0;

                // Determine conversion type and show warning if needed
                const conversionType = getConversionType(wasTransfer, wasSplit, isNowTransfer, isNowSplit);

                if (conversionType !== 'none' && !showConversionWarning) {
                    const warningMessage = getConversionWarningMessage(conversionType);
                    setShowConversionWarning({
                        conversionType,
                        message: warningMessage,
                        onConfirm: () => {
                            setShowConversionWarning(null);
                            handleTransactionConversion(originalTransaction, transactionData, conversionType);
                        },
                        onCancel: () => setShowConversionWarning(null)
                    });
                    return; // Wait for user confirmation
                } else if (conversionType === 'none') {
                    // No conversion needed, simple update
                    onEditTransaction({ ...transactionData, id: editingTransaction });
                }
            }
        } else {
            // ADDING NEW TRANSACTION (unchanged logic)
            if (newTransaction.isTransfer && newTransaction.transferAccountId) {
                console.log('Creating new transfer transaction...');
                onAddTransaction(transactionData);
            } else {
                console.log('Creating new regular transaction...');
                onAddTransaction(transactionData);
            }
        }

        cancelEdit();
    };

    // Helper function: Determine conversion type
    const getConversionType = (wasTransfer, wasSplit, isNowTransfer, isNowSplit) => {
        if (wasTransfer && !isNowTransfer && !isNowSplit) {
            return 'transfer-to-regular';
        } else if (wasTransfer && !isNowTransfer && isNowSplit) {
            return 'transfer-to-split';
        } else if (!wasTransfer && wasSplit && isNowTransfer) {
            return 'split-to-transfer';
        } else if (!wasTransfer && !wasSplit && isNowTransfer) {
            return 'regular-to-transfer';
        } else if (wasTransfer && isNowTransfer) {
            return 'transfer-to-transfer';
        } else if (!wasTransfer && wasSplit && !isNowTransfer && !isNowSplit) {
            return 'split-to-regular';
        } else if (!wasTransfer && !wasSplit && !isNowTransfer && isNowSplit) {
            return 'regular-to-split';
        } else if (!wasTransfer && wasSplit && isNowSplit) {
            return 'split-to-split';
        }
        return 'none'; // No conversion needed
    };

    // Helper function: Get warning message for conversion type
    const getConversionWarningMessage = (conversionType) => {
        switch (conversionType) {
            case 'transfer-to-regular':
                return "Converting this transfer to a regular transaction will delete the linked transaction. Continue?";
            case 'transfer-to-split':
                return "Converting this transfer to a split transaction will delete the linked transaction. Continue?";
            case 'split-to-transfer':
                return "Converting this split transaction to a transfer will remove all split categories and create a transfer instead. Continue?";
            case 'regular-to-transfer':
                return "Converting this to a transfer will replace the current transaction with a transfer between accounts. Continue?";
            case 'transfer-to-transfer':
                return "This will update both sides of the transfer. Continue?";
            case 'split-to-regular':
                return "Converting this split transaction to a regular transaction will remove all splits except the category information. Continue?";
            case 'regular-to-split':
                return "Converting this to a split transaction will replace the single category with multiple splits. Continue?";
            case 'split-to-split':
                return "This will update the split information. Continue?";
            default:
                return "This will modify the transaction. Continue?";
        }
    };

    // Helper function: Handle all conversion types
    const handleTransactionConversion = (originalTransaction, newTransactionData, conversionType) => {
        console.log('Handling conversion:', conversionType);

        switch (conversionType) {
            case 'transfer-to-regular':
            case 'transfer-to-split':
                handleTransferToNonTransfer(originalTransaction, newTransactionData);
                break;

            case 'split-to-transfer':
            case 'regular-to-transfer':
                handleNonTransferToTransfer(originalTransaction, newTransactionData);
                break;

            case 'transfer-to-transfer':
                handleTransferToTransferEdit(originalTransaction, newTransactionData);
                break;

            case 'split-to-regular':
            case 'regular-to-split':
            case 'split-to-split':
                // These are simple updates - no linked transactions to worry about
                onEditTransaction({ ...newTransactionData, id: originalTransaction.id });
                break;

            default:
                console.error('Unknown conversion type:', conversionType);
                onEditTransaction({ ...newTransactionData, id: originalTransaction.id });
        }
    };

    // Helper function: Convert any transfer to non-transfer
    const handleTransferToNonTransfer = (originalTransaction, newTransactionData) => {
        console.log('Converting transfer to non-transfer');

        // Find and delete the linked transaction
        const linkedTransaction = transactions.find(t =>
            t.id !== originalTransaction.id &&
            t.transferAccountId === originalTransaction.accountId &&
            t.accountId === originalTransaction.transferAccountId
        );

        if (linkedTransaction) {
            console.log('Deleting linked transaction:', linkedTransaction.id);
            onDeleteTransaction(linkedTransaction.id);
        }

        // Update the original transaction (could be regular or split now)
        onEditTransaction({
            ...newTransactionData,
            id: originalTransaction.id,
            transferAccountId: null  // Remove transfer reference
        });
    };

    // Helper function: Convert any non-transfer to transfer
    const handleNonTransferToTransfer = (originalTransaction, newTransactionData) => {
        console.log('Converting non-transfer to transfer');

        // Delete the original transaction (whether it was regular or split)
        onDeleteTransaction(originalTransaction.id);

        // Create new transfer (the hook will create both sides)
        // Make sure to clean transfer data of any split information
        const cleanTransferData = {
            ...newTransactionData,
            isSplit: false,
            splits: undefined,
            categoryId: null  // Transfers don't have categories
        };

        onAddTransaction(cleanTransferData);
    };

    // Helper function: Edit transfer transaction (unchanged from before)
    const handleTransferToTransferEdit = (originalTransaction, newTransactionData) => {
        console.log('Editing transfer transaction');

        // Find the linked transaction
        const linkedTransaction = transactions.find(t =>
            t.id !== originalTransaction.id &&
            t.transferAccountId === originalTransaction.accountId &&
            t.accountId === originalTransaction.transferAccountId
        );

        if (linkedTransaction) {
            // Update both transactions
            onEditTransaction({
                ...newTransactionData,
                id: originalTransaction.id
            });

            // Update the linked transaction with opposite data
            const linkedUpdate = {
                ...newTransactionData,
                id: linkedTransaction.id,
                amount: -newTransactionData.amount,
                accountId: newTransactionData.transferAccountId,
                transferAccountId: newTransactionData.accountId,
                payee: newTransactionData.payee?.replace('Transfer to', 'Transfer from') || 'Transfer'
            };

            onEditTransaction(linkedUpdate);
        } else {
            // Fallback: treat as conversion to new transfer
            handleNonTransferToTransfer(originalTransaction, newTransactionData);
        }
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
        setNewTransaction((prev) => ({
            ...prev,
            splits: [...currentSplits, newSplit],
            isSplit: true
        }));
    };

    const removeSplit = (splitId) => {
        const currentSplits = newTransaction.splits || [];
        const updatedSplits = currentSplits.filter((split) => split.id !== splitId);
        setNewTransaction((prev) => ({
            ...prev,
            splits: updatedSplits,
            isSplit: updatedSplits.length > 0
        }));
    };

    const updateSplit = (splitId, field, value) => {
        const currentSplits = newTransaction.splits || [];
        const updatedSplits = currentSplits.map((split) =>
            split.id === splitId ? { ...split, [field]: value } : split
        );
        setNewTransaction((prev) => ({
            ...prev,
            splits: updatedSplits
        }));
    };

    // Bulk selection handlers
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedTransactions(new Set());
        } else {
            setSelectedTransactions(
                new Set(filteredAndSortedTransactions.map((t) => t.id))
            );
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

    // Filtering and sorting
    const filteredAndSortedTransactions = useMemo(() => {
        const result = transactions
            .filter((transaction) => {
                // Search filter
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    const matchesPayee = transaction.payee
                        ?.toLowerCase()
                        .includes(searchLower);
                    const matchesMemo = transaction.memo
                        ?.toLowerCase()
                        .includes(searchLower);
                    const matchesCategory = getCategoryName(transaction.categoryId)
                        ?.toLowerCase()
                        .includes(searchLower);
                    const matchesAmount = Math.abs(transaction.amount)
                        .toString()
                        .includes(searchTerm);

                    if (
                        !matchesPayee &&
                        !matchesMemo &&
                        !matchesCategory &&
                        !matchesAmount
                    ) {
                        return false;
                    }
                }

                // Type filter
                if (typeFilter !== 'all') {
                    if (typeFilter === 'income' && transaction.amount <= 0) return false;
                    if (typeFilter === 'expense' && transaction.amount >= 0) return false;
                    if (typeFilter === 'transfer' && !transaction.transferAccountId)
                        return false;
                }

                // Account filter
                if (
                    accountFilter !== 'all' &&
                    transaction.accountId !== parseInt(accountFilter)
                ) {
                    return false;
                }

                // View account filter
                if (
                    viewAccount !== 'all' &&
                    transaction.accountId !== parseInt(viewAccount)
                ) {
                    return false;
                }

                return true;
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
                        aValue = a[sortBy] || '';
                        bValue = b[sortBy] || '';
                }

                if (sortDirection === 'desc') {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                } else {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
            });

        // Add these logs before the return:
        console.log('Raw transactions:', transactions.length);
        console.log('Final filtered transactions:', result.length);
        console.log('View account:', viewAccount);

        return result;
    }, [
        transactions,
        searchTerm,
        typeFilter,
        accountFilter,
        viewAccount,
        sortBy,
        sortDirection
    ]);

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

        // Save to localStorage
        localStorage.setItem(
            'transactionTableColumnWidths',
            JSON.stringify(newColumnWidths)
        );
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        currentColumn.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Load column widths from localStorage on mount
    useEffect(() => {
        const savedWidths = localStorage.getItem('transactionTableColumnWidths');
        if (savedWidths) {
            try {
                const parsedWidths = JSON.parse(savedWidths);
                setColumnWidths((prev) => ({ ...prev, ...parsedWidths }));
            } catch (error) {
                console.error('Error parsing saved column widths:', error);
            }
        }
    }, []);

    // Sort icon component
    const SortIcon = ({ column }) => {
        if (sortBy !== column) return null;
        return sortDirection === 'asc' ? (
            <ChevronUp className="w-3 h-3" />
        ) : (
            <ChevronDown className="w-3 h-3" />
        );
    };

    // Mobile Layout
    if (isMobile) {
        return (
            <div className="space-y-4">
                {/* Mobile Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-theme-primary">
                        {viewAccount === 'all'
                            ? 'All Transactions'
                            : `${getAccountName(viewAccount)} Transactions`}
                    </h2>
                    <button
                        onClick={startAddingTransaction}
                        className="btn-success px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                </div>

                {/* Mobile Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-tertiary w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary"
                    />
                </div>

                {/* Mobile Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                    >
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                    </select>

                    <select
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        className="px-3 py-1 border rounded bg-theme-primary border-theme-secondary text-theme-primary text-sm"
                    >
                        <option value="all">All Accounts</option>
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mobile Transaction Cards */}
                <div>
                    {/* New Transaction Card */}
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
                            columnWidths={columnWidths}
                            viewAccount={viewAccount}
                        />
                    )}

                    {/* Existing Transaction Cards */}
                    {filteredAndSortedTransactions
                        .filter((t) => t.id !== editingTransaction)
                        .map((transaction, index) =>
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
                                    columnWidths={columnWidths}
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
                                    onDeleteTransaction={onDeleteTransaction}
                                    getAccountName={getAccountName}
                                    getCategoryName={getCategoryName}
                                    formatTransferPayee={formatTransferPayee}
                                    renderClearedStatus={renderClearedStatus}
                                    expandedTransactions={expandedTransactions}
                                    setExpandedTransactions={setExpandedTransactions}
                                    columnWidths={columnWidths}
                                    viewAccount={viewAccount}
                                />
                            )
                        )}

                    {/* Empty State */}
                    {filteredAndSortedTransactions.length === 0 &&
                        !isAddingTransaction && (
                            <div className="text-center py-12 text-theme-secondary">
                                {transactions.length === 0
                                    ? 'No transactions yet. Add your first transaction!'
                                    : 'No transactions match your filters.'}
                            </div>
                        )}
                </div>
            </div>
        );
    }

    // Desktop Layout
    return (
        <div className="space-y-4">
            {/* Desktop Header and Controls */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-theme-primary">
                        {viewAccount === 'all'
                            ? 'All Transactions'
                            : `${getAccountName(viewAccount)} Transactions`}
                    </h2>

                    {/* Bulk Actions */}
                    {selectedTransactions.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-theme-secondary">
                                {selectedTransactions.size} selected
                            </span>
                            <button
                                onClick={() => {
                                    // Get all selected transactions
                                    const transactionsToDelete = Array.from(selectedTransactions)
                                        .map(id => transactions.find(t => t.id === id))
                                        .filter(Boolean);

                                    // Create a combined transaction object for bulk delete
                                    const bulkTransaction = {
                                        id: 'bulk-delete',
                                        payee: `${transactionsToDelete.length} transactions`,
                                        isMultiple: true,
                                        transactions: transactionsToDelete,
                                        amount: transactionsToDelete.reduce((sum, t) => sum + t.amount, 0)
                                    };

                                    // Pass the bulk transaction object to trigger confirmation
                                    onDeleteTransaction(bulkTransaction);

                                    // Clear selection after deletion is confirmed
                                    setSelectedTransactions(new Set());
                                }}
                                className="btn-danger px-3 py-1 rounded text-sm"
                            >
                                Delete Selected
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-tertiary w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary w-64"
                        />
                    </div>

                    {/* Filters */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary"
                    >
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                    </select>

                    <select
                        value={accountFilter}
                        onChange={(e) => {
                            setAccountFilter(e.target.value);
                            onAccountViewChange?.(e.target.value); // ← Use the prop here
                        }}
                        className="px-3 py-2 border rounded bg-theme-primary border-theme-secondary text-theme-primary"
                    >
                        <option value="all">All Accounts</option>
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={startAddingTransaction}
                        className="btn-primary px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Transaction
                    </button>
                </div>
            </div>



            {/* Desktop Table */}
            <div className="bg-theme-primary rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="table-header">
                        <tr>
                            {/* Bulk Select Header */}
                            <th
                                className="px-1 py-3 text-center text-xs font-medium text-theme-secondary uppercase tracking-wider relative"
                                style={{ width: columnWidths.select }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    className="rounded border-theme-secondary"
                                />
                                <div
                                    className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                    onMouseDown={(e) => handleMouseDown(e, 'select')}
                                />
                            </th>

                            {/* Account Header - Conditional */}
                            {viewAccount === 'all' && (
                                <th
                                    className="px-2 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                    style={{ width: columnWidths.account }}
                                    onClick={() => handleSort('account')}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Account</span>
                                        <SortIcon column="account" />
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                        onMouseDown={(e) => handleMouseDown(e, 'account')}
                                    />
                                </th>
                            )}



                            {/* Date Header */}
                            <th
                                className="px-2 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
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

                            {/* Payee Header */}
                            <th
                                className="px-2 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
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

                            {/* Category Header */}
                            <th
                                className="px-2 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
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

                            {/* Memo Header */}
                            <th
                                className="px-2 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider relative"
                                style={{ width: columnWidths.memo }}
                            >
                                <span>Memo</span>
                                <div
                                    className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                    onMouseDown={(e) => handleMouseDown(e, 'memo')}
                                />
                            </th>

                            {/* Outflow Header */}
                            <th
                                className="px-2 py-3 text-right text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                style={{ width: columnWidths.outflow }}
                                onClick={() => handleSort('amount')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Outflow</span>
                                    <SortIcon column="amount" />
                                </div>
                                <div
                                    className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                    onMouseDown={(e) => handleMouseDown(e, 'outflow')}
                                />
                            </th>

                            {/* Inflow Header */}
                            <th
                                className="px-2 py-3 text-right text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                style={{ width: columnWidths.inflow }}
                                onClick={() => handleSort('amount')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Inflow</span>
                                    <SortIcon column="amount" />
                                </div>
                                <div
                                    className="absolute right-0 top-0 w-3 h-full cursor-col-resize hover:bg-blue-300 hover:bg-opacity-50"
                                    onMouseDown={(e) => handleMouseDown(e, 'inflow')}
                                />
                            </th>

                            {/* Cleared Header */}
                            <th
                                className="px-1 py-3 text-center text-xs font-medium text-theme-secondary uppercase tracking-wider relative"
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
                                columnWidths={columnWidths}
                                viewAccount={viewAccount}
                            />
                        )}

                        {/* Existing Transactions */}
                        {filteredAndSortedTransactions.map((transaction, index) =>
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
                                    columnWidths={columnWidths}
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
                                    onDeleteTransaction={onDeleteTransaction}
                                    getAccountName={getAccountName}
                                    getCategoryName={getCategoryName}
                                    formatTransferPayee={formatTransferPayee}
                                    renderClearedStatus={renderClearedStatus}
                                    expandedTransactions={expandedTransactions}
                                    setExpandedTransactions={setExpandedTransactions}
                                    columnWidths={columnWidths}
                                    viewAccount={viewAccount}
                                />
                            )
                        )}

                        {/* Empty State */}
                        {filteredAndSortedTransactions.length === 0 &&
                            !isAddingTransaction && (
                                <tr>
                                    <td
                                        colSpan={viewAccount === 'all' ? '9' : '8'}
                                        className="text-center py-12 text-theme-secondary"
                                    >
                                        {transactions.length === 0
                                            ? 'No transactions yet. Add your first transaction!'
                                            : 'No transactions match your filters.'}
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>

            {/* ADD THE WARNING DIALOG HERE - DESKTOP SECTION */}
            {showConversionWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-theme-primary p-6 rounded-lg max-w-md border border-theme-secondary">
                        <h3 className="text-lg font-medium mb-4 text-theme-primary">Confirm Transaction Change</h3>
                        <p className="text-theme-secondary mb-6">{showConversionWarning.message}</p>
                        <div className="flex space-x-3 justify-end">
                            <button
                                onClick={showConversionWarning.onCancel}
                                className="px-4 py-2 btn-secondary rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showConversionWarning.onConfirm}
                                className="px-4 py-2 btn-primary rounded"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsTab;
