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
    // Initialize form data based on whether we're editing or creating
    const getInitialFormData = () => {
        if (isEdit && account) {
            return {
                name: account.name || '',
                type: account.type || 'checking',
                balance: account.balance || 0,
                institution: account.institution || '',
                accountNumber: account.accountNumber || '',
                isActive: account.isActive ?? true,
                notes: account.notes || ''
            };
        }
        return {
            name: '',
            type: 'checking',
            balance: 0,
            institution: '',
            accountNumber: '',
            isActive: true,
            notes: ''
        };
    };

    const [formData, setFormData] = useState(() => getInitialFormData());

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
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

                        <CurrencyField
                            label="Current Balance"
                            value={formData.balance}
                            onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                            required
                        />

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
                            <Button type="submit" variant="solid">
                                {isEdit ? 'Update' : 'Create'} Account
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

// Balance Update Modal Component
const BalanceUpdateModal = ({
    isOpen,
    onClose,
    account,
    onSave
}) => {
    const [newBalance, setNewBalance] = useState(0);
    const [reason, setReason] = useState('');

    // Initialize balance when modal opens - use conditional state update
    if (isOpen && account && newBalance !== account.balance) {
        setNewBalance(account.balance);
        setReason('');
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(account.id, newBalance, reason);
        onClose();
    };

    if (!isOpen || !account) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md m-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">
                            Update Balance
                        </h2>
                        <Button onClick={onClose} variant="flat" isIcon>
                            ×
                        </Button>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Account:</div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Current Balance: <span className="font-medium">${account.balance.toFixed(2)}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <CurrencyField
                            label="New Balance"
                            value={newBalance}
                            onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                            required
                        />

                        <Input
                            label="Reason for Change (Optional)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Bank reconciliation, manual adjustment"
                        />

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button type="button" onClick={onClose} variant="flat">
                                Cancel
                            </Button>
                            <Button type="submit" variant="solid">
                                Update Balance
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
    onAddAccount,
    onEditAccount,
    onDeleteAccount,
    onToggleAccountActive,
    onUpdateBalance
}) {
    const [showModal, setShowModal] = useState(false);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [balanceAccount, setBalanceAccount] = useState(null);

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

    const handleCloseBalanceModal = () => {
        setShowBalanceModal(false);
        setBalanceAccount(null);
    };

    const handleBalanceUpdate = (accountId, newBalance, reason) => {
        onUpdateBalance(accountId, newBalance, reason);
    };

    // Calculate totals
    const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
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
                    variant="solid"
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
                        <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalBalance)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Balance
                        </div>
                    </div>
                </Card>
            </div>

            {/* Accounts Table */}
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
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    setBalanceAccount(account);
                                                    setShowBalanceModal(true);
                                                }}
                                                className={`font-medium hover:underline cursor-pointer ${account.balance >= 0 ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                                                title="Click to update balance"
                                            >
                                                {formatCurrency(account.balance)}
                                            </button>
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
                        variant="solid"
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

            <BalanceUpdateModal
                isOpen={showBalanceModal}
                onClose={handleCloseBalanceModal}
                account={balanceAccount}
                onSave={handleBalanceUpdate}
            />
        </div>
    );
}
