import { useState } from 'react';
import {
    TbCreditCard,
    TbEdit,
    TbEye,
    TbEyeOff,
    TbPigMoney,
    TbPlus,
    TbTrash,
    TbWallet
} from 'react-icons/tb';

// UI Components
import {
    Badge,
    Button,
    Card,
    Checkbox,
    Input,
    Select,
    Table,
    TBody,
    Td,
    Th,
    THead,
    Tr
} from 'components/ui';

// Custom Components
import CurrencyField from 'components/form/CurrencyField';

// Account Form Modal Component
const AccountFormModal = ({
    isOpen,
    onClose,
    account,
    onSave,
    isEdit = false
}) => {
    // Get today's date for starting balance date
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Initialize form data based on whether we're editing or creating
    const getInitialFormData = () => {
        if (isEdit && account) {
            return {
                name: account.name || '',
                type: account.type || 'checking',
                startingBalance: account.startingBalance || account.balance || 0, // Migrate old balance field
                startingBalanceDate: account.startingBalanceDate || getTodayDate(),
                institution: account.institution || '',
                accountNumber: account.accountNumber || '',
                isActive: account.isActive ?? true,
                notes: account.notes || ''
            };
        }
        return {
            name: '',
            type: 'checking',
            startingBalance: 0,
            startingBalanceDate: getTodayDate(),
            institution: '',
            accountNumber: '',
            isActive: true,
            notes: ''
        };
    };

    const [formData, setFormData] = useState(() => getInitialFormData());

    const handleSubmit = (e) => {
        e.preventDefault();

        // For new accounts, set reconciliation fields
        const accountData = {
            ...formData,
            // Initialize reconciliation fields for new accounts
            lastReconciledDate: null,
            lastReconciledBalance: 0,
            isReconciling: false
        };

        onSave(accountData);
        onClose();
    };

    const accountTypes = [
        { value: 'checking', label: 'Checking Account' },
        { value: 'savings', label: 'Savings Account' },
        { value: 'credit', label: 'Credit Card' },
        { value: 'investment', label: 'Investment Account' },
        { value: 'cash', label: 'Cash' },
        { value: 'other', label: 'Other' }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">
                            {isEdit ? 'Edit Account' : 'Add Account'}
                        </h2>
                        <Button onClick={onClose} variant="flat" isIcon>
                            ×
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Account Name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            placeholder="e.g., Chase Checking"
                        />

                        <Select
                            label="Account Type"
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            required
                        >
                            {accountTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </Select>

                        {/* Starting Balance Section */}
                        <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <h3 className="font-medium text-blue-900 dark:text-blue-100">Starting Balance</h3>
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                {isEdit ?
                                    "This is the balance when you first added this account to the system." :
                                    "Enter your current account balance. This will be your starting point for transaction tracking."
                                }
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CurrencyField
                                    label="Starting Balance"
                                    value={formData.startingBalance}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startingBalance: parseFloat(e.target.value) || 0 }))}
                                    required
                                    disabled={isEdit} // Can't change starting balance after creation
                                />

                                <Input
                                    label="Starting Date"
                                    type="date"
                                    value={formData.startingBalanceDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startingBalanceDate: e.target.value }))}
                                    required
                                    disabled={isEdit} // Can't change starting date after creation
                                />
                            </div>

                            {isEdit && (
                                <div className="text-xs text-blue-700 dark:text-blue-300">
                                    💡 Starting balance and date cannot be changed after account creation. Use transactions to track balance changes.
                                </div>
                            )}
                        </div>

                        <Input
                            label="Institution"
                            value={formData.institution}
                            onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                            placeholder="e.g., Chase Bank"
                        />

                        <Input
                            label="Account Number (Last 4 digits)"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                            placeholder="e.g., ****1234"
                        />

                        <Input
                            label="Notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Optional notes about this account"
                        />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={formData.isActive}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            />
                            <label>Account is active</label>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button type="button" onClick={onClose} variant="flat">
                                Cancel
                            </Button>
                            <Button type="submit" variant="filled">
                                {isEdit ? 'Update' : 'Create'} Account
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

// Reconciliation Modal Component
const ReconciliationModal = ({
    isOpen,
    onClose,
    account,
    transactions = [],
    onReconcile
}) => {
    const [bankBalance, setBankBalance] = useState(0);

    // Calculate account balances
    const calculateBalances = (account, transactions) => {
        if (!account) return { workingBalance: 0, clearedBalance: 0, pendingBalance: 0 };

        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const startingBalance = account.startingBalance || account.balance || 0;

        const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const clearedBalance = startingBalance + accountTransactions
            .filter(t => t.isCleared)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const pendingBalance = workingBalance - clearedBalance;

        return { workingBalance, clearedBalance, pendingBalance };
    };

    const balances = calculateBalances(account, transactions);
    const difference = bankBalance - balances.clearedBalance;
    const isBalanced = Math.abs(difference) < 0.01;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isBalanced) {
            onReconcile(account.id, bankBalance);
            onClose();
        }
    };

    if (!isOpen || !account) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">
                            Reconcile {account.name}
                        </h2>
                        <Button onClick={onClose} variant="flat" isIcon>
                            ×
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bank Balance Input */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <CurrencyField
                                label="Bank Statement Balance"
                                value={bankBalance}
                                onChange={(e) => setBankBalance(parseFloat(e.target.value) || 0)}
                                required
                                placeholder="Enter your bank balance"
                            />
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                                Enter the balance shown on your bank statement or online banking.
                            </p>
                        </div>

                        {/* Balance Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Working Balance</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balances.workingBalance)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">All transactions</div>
                            </div>

                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-sm text-green-600 dark:text-green-400">Cleared Balance</div>
                                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balances.clearedBalance)}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">Cleared transactions</div>
                            </div>

                            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
                                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balances.pendingBalance)}
                                </div>
                                <div className="text-xs text-yellow-600 dark:text-yellow-400">Uncleared transactions</div>
                            </div>
                        </div>

                        {/* Difference Display */}
                        <div className={`p-4 rounded-lg border ${isBalanced
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                            <div className="text-center">
                                <div className={`text-sm ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    Difference
                                </div>
                                <div className={`text-2xl font-bold ${isBalanced ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(difference))}
                                </div>
                                <div className={`text-sm ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {isBalanced ? '✅ Perfect match!' : `${difference > 0 ? 'Bank higher' : 'Bank lower'} - Review transactions`}
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button type="button" onClick={onClose} variant="flat">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="filled"
                                disabled={!isBalanced}
                                className={!isBalanced ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                                {isBalanced ? 'Complete Reconciliation' : 'Balance Required'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

// Main AccountsManagement Component
export default function AccountsManagement({
    accounts = [],
    transactions = [],
    onAddAccount,
    onEditAccount,
    onDeleteAccount,
    onToggleAccountActive,
    onReconcileAccount
}) {
    const [showModal, setShowModal] = useState(false);
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [reconcilingAccount, setReconcilingAccount] = useState(null);

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Get account type icon
    const getAccountTypeIcon = (type) => {
        switch (type) {
            case 'checking':
            case 'savings':
                return <TbWallet className="size-4" />;
            case 'credit':
                return <TbCreditCard className="size-4" />;
            case 'investment':
                return <TbPigMoney className="size-4" />;
            default:
                return <TbWallet className="size-4" />;
        }
    };

    // Get account type badge color
    const getAccountTypeBadge = (type) => {
        switch (type) {
            case 'checking':
                return 'primary';
            case 'savings':
                return 'success';
            case 'credit':
                return 'warning';
            case 'investment':
                return 'info';
            default:
                return 'secondary';
        }
    };

    // Handle form submission
    const handleSaveAccount = (accountData) => {
        if (editingAccount) {
            onEditAccount({ ...accountData, id: editingAccount.id });
        } else {
            onAddAccount(accountData);
        }
        setEditingAccount(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAccount(null);
    };

    const handleCloseReconcileModal = () => {
        setShowReconcileModal(false);
        setReconcilingAccount(null);
    };

    const handleReconcile = (accountId, bankBalance) => {
        onReconcileAccount(accountId, bankBalance);
    };

    // Calculate account balances for display
    const calculateAccountBalances = (account) => {
        if (!account) return { workingBalance: 0, clearedBalance: 0, pendingBalance: 0 };

        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const startingBalance = account.startingBalance || account.balance || 0;

        const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const clearedBalance = startingBalance + accountTransactions
            .filter(t => t.isCleared)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const pendingBalance = workingBalance - clearedBalance;

        return { workingBalance, clearedBalance, pendingBalance };
    };

    // Get reconciliation status and time indicator
    const getReconciliationStatus = (account) => {
        if (!account.lastReconciledDate) {
            return {
                status: 'never',
                message: 'Never reconciled',
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                borderColor: 'border-red-200 dark:border-red-800'
            };
        }

        const lastReconciled = new Date(account.lastReconciledDate);
        const now = new Date();
        const daysDiff = Math.floor((now - lastReconciled) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3) {
            return {
                status: 'recent',
                message: `${daysDiff === 0 ? 'Today' : `${daysDiff} day${daysDiff === 1 ? '' : 's'} ago`}`,
                color: 'text-green-600',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                borderColor: 'border-green-200 dark:border-green-800'
            };
        } else if (daysDiff <= 7) {
            return {
                status: 'warning',
                message: `${daysDiff} days ago`,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                borderColor: 'border-yellow-200 dark:border-yellow-800'
            };
        } else if (daysDiff <= 14) {
            return {
                status: 'overdue',
                message: `${daysDiff} days ago - Reconcile recommended`,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                borderColor: 'border-orange-200 dark:border-orange-800'
            };
        } else {
            return {
                status: 'critical',
                message: `${daysDiff} days ago - Reconcile overdue`,
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                borderColor: 'border-red-200 dark:border-red-800'
            };
        }
    };

    // Calculate totals using working balances
    const totalWorkingBalance = accounts.reduce((sum, account) => {
        const balances = calculateAccountBalances(account);
        return sum + balances.workingBalance;
    }, 0);
    const activeAccounts = accounts.filter(account => account.isActive);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TbWallet className="size-7" />
                        Accounts
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your financial accounts and balances
                    </p>
                </div>

                <Button
                    onClick={() => setShowModal(true)}
                    variant="filled"
                    size="sm"
                    className="flex items-center space-x-2"
                >
                    <TbPlus className="size-4" />
                    <span>Add Account</span>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {accounts.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Accounts
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {activeAccounts.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Active Accounts
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${totalWorkingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalWorkingBalance)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Working Balance
                        </div>
                    </div>
                </Card>
            </div>

            {/* Accounts List - Responsive Design */}

            {/* Desktop Table View */}
            <div className="hidden lg:block">
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table hoverable className="min-w-full">
                            <THead>
                                <Tr>
                                    <Th>Account</Th>
                                    <Th>Type</Th>
                                    <Th>Institution</Th>
                                    <Th>Balance</Th>
                                    <Th>Status</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </THead>

                            <TBody>
                                {accounts.map((account) => (
                                    <Tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <Td>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    {getAccountTypeIcon(account.type)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {account.name}
                                                    </div>
                                                    {account.accountNumber && (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {account.accountNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Td>

                                        <Td>
                                            <Badge variant={getAccountTypeBadge(account.type)} className="text-xs">
                                                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                                            </Badge>
                                        </Td>

                                        <Td>
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {account.institution || '—'}
                                            </div>
                                        </Td>

                                        <Td>
                                            <div className="space-y-1">
                                                {(() => {
                                                    const balances = calculateAccountBalances(account);
                                                    const reconcileStatus = getReconciliationStatus(account);
                                                    return (
                                                        <>
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`font-medium ${balances.workingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {formatCurrency(balances.workingBalance)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">Working</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm text-green-600">
                                                                    {formatCurrency(balances.clearedBalance)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">Cleared</span>
                                                            </div>
                                                            <div className={`text-xs px-2 py-1 rounded ${reconcileStatus.bgColor} ${reconcileStatus.borderColor} border`}>
                                                                <span className={reconcileStatus.color}>
                                                                    {reconcileStatus.message}
                                                                </span>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </Td>

                                        <Td>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    onClick={() => onToggleAccountActive(account.id)}
                                                    variant="flat"
                                                    size="xs"
                                                    title={account.isActive ? 'Deactivate Account' : 'Activate Account'}
                                                >
                                                    {account.isActive ? (
                                                        <TbEye className="size-3 text-green-600" />
                                                    ) : (
                                                        <TbEyeOff className="size-3 text-gray-400" />
                                                    )}
                                                </Button>
                                                <Badge variant={account.isActive ? 'success' : 'secondary'} className="text-xs">
                                                    {account.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </Td>

                                        <Td>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    onClick={() => {
                                                        setReconcilingAccount(account);
                                                        setShowReconcileModal(true);
                                                    }}
                                                    variant="flat"
                                                    size="xs"
                                                    title="Reconcile Account"
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    ⚖️
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        setEditingAccount(account);
                                                        setShowModal(true);
                                                    }}
                                                    variant="flat"
                                                    size="xs"
                                                    title="Edit Account"
                                                >
                                                    <TbEdit className="size-3" />
                                                </Button>
                                                <Button
                                                    onClick={() => onDeleteAccount(account.id)}
                                                    variant="flat"
                                                    size="xs"
                                                    title="Delete Account"
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <TbTrash className="size-3" />
                                                </Button>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {accounts.map((account) => (
                    <Card key={account.id} className="p-4 hover:shadow-md transition-shadow">
                        {/* Account Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1">
                                <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    {getAccountTypeIcon(account.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {account.name}
                                    </h3>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Badge variant={getAccountTypeBadge(account.type)} className="text-xs">
                                            {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                                        </Badge>
                                        <Badge variant={account.isActive ? 'success' : 'secondary'} className="text-xs">
                                            {account.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center space-x-1 ml-2">
                                <Button
                                    onClick={() => onToggleAccountActive(account.id)}
                                    variant="flat"
                                    size="sm"
                                    title={account.isActive ? 'Deactivate Account' : 'Activate Account'}
                                >
                                    {account.isActive ? (
                                        <TbEye className="size-4 text-green-600" />
                                    ) : (
                                        <TbEyeOff className="size-4 text-gray-400" />
                                    )}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEditingAccount(account);
                                        setShowModal(true);
                                    }}
                                    variant="flat"
                                    size="sm"
                                    title="Edit Account"
                                >
                                    <TbEdit className="size-4" />
                                </Button>
                                <Button
                                    onClick={() => onDeleteAccount(account.id)}
                                    variant="flat"
                                    size="sm"
                                    title="Delete Account"
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <TbTrash className="size-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div className="space-y-3">
                            {/* Balance - Reconciliation Display */}
                            <div className="py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                {(() => {
                                    const balances = calculateAccountBalances(account);
                                    const reconcileStatus = getReconciliationStatus(account);
                                    return (
                                        <>
                                            <div className="text-center mb-3">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Working Balance</div>
                                                <div className={`text-2xl font-bold ${balances.workingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(balances.workingBalance)}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                                <div className="text-center">
                                                    <div className="text-gray-600 dark:text-gray-400">Cleared</div>
                                                    <div className="font-medium text-green-600">
                                                        {formatCurrency(balances.clearedBalance)}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-gray-600 dark:text-gray-400">Pending</div>
                                                    <div className="font-medium text-yellow-600">
                                                        {formatCurrency(balances.pendingBalance)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`text-xs px-2 py-1 rounded text-center ${reconcileStatus.bgColor} ${reconcileStatus.borderColor} border mb-3`}>
                                                <span className={reconcileStatus.color}>
                                                    {reconcileStatus.message}
                                                </span>
                                            </div>

                                            <div className="text-center">
                                                <Button
                                                    onClick={() => {
                                                        setReconcilingAccount(account);
                                                        setShowReconcileModal(true);
                                                    }}
                                                    variant="filled"
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    ⚖️ Reconcile Account
                                                </Button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {account.institution && (
                                    <div>
                                        <div className="text-gray-600 dark:text-gray-400">Institution</div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {account.institution}
                                        </div>
                                    </div>
                                )}
                                {account.accountNumber && (
                                    <div>
                                        <div className="text-gray-600 dark:text-gray-400">Account</div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {account.accountNumber}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {account.notes && (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Notes</div>
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        {account.notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {accounts.length === 0 && (
                <Card className="p-8 text-center">
                    <TbWallet className="size-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No accounts yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Get started by adding your first financial account.
                    </p>
                    <Button
                        onClick={() => setShowModal(true)}
                        variant="filled"
                        size="sm"
                    >
                        Add Your First Account
                    </Button>
                </Card>
            )}

            {/* Modals */}
            <AccountFormModal
                key={editingAccount ? `edit-${editingAccount.id}` : 'add'}
                isOpen={showModal}
                onClose={handleCloseModal}
                account={editingAccount}
                onSave={handleSaveAccount}
                isEdit={!!editingAccount}
            />

            <ReconciliationModal
                isOpen={showReconcileModal}
                onClose={handleCloseReconcileModal}
                account={reconcilingAccount}
                transactions={transactions}
                onReconcile={handleReconcile}
            />
        </div>
    );
}
