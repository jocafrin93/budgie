import { Button, Card, Input } from 'components/ui';
import { useState } from 'react';
import { TbCheck, TbEdit, TbPlus, TbTrash, TbX } from 'react-icons/tb';

const PayeeManagement = ({ payees = [], onAddPayee, onEditPayee, onDeletePayee }) => {
    const [newPayeeName, setNewPayeeName] = useState('');
    const [editingPayee, setEditingPayee] = useState(null);
    const [editingName, setEditingName] = useState('');

    const handleAddPayee = (e) => {
        e.preventDefault();
        if (newPayeeName.trim() && !payees.includes(newPayeeName.trim())) {
            onAddPayee(newPayeeName.trim());
            setNewPayeeName('');
        }
    };

    const handleStartEdit = (payee) => {
        setEditingPayee(payee);
        setEditingName(payee);
    };

    const handleSaveEdit = () => {
        if (editingName.trim() && editingName.trim() !== editingPayee) {
            if (!payees.includes(editingName.trim())) {
                onEditPayee(editingPayee, editingName.trim());
                setEditingPayee(null);
                setEditingName('');
            } else {
                alert('A payee with this name already exists.');
            }
        } else {
            setEditingPayee(null);
            setEditingName('');
        }
    };

    const handleCancelEdit = () => {
        setEditingPayee(null);
        setEditingName('');
    };

    const handleDeletePayee = (payee) => {
        if (window.confirm(`Are you sure you want to delete "${payee}"? This action cannot be undone.`)) {
            onDeletePayee(payee);
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Manage Payees
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Add, edit, or remove payees. Changes will be reflected in transaction forms.
                    </p>
                </div>

                {/* Add New Payee */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                        Add New Payee
                    </h4>
                    <form onSubmit={handleAddPayee} className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                value={newPayeeName}
                                onChange={(e) => setNewPayeeName(e.target.value)}
                                placeholder="Enter payee name..."
                                className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="filled"
                            color="primary"
                            disabled={!newPayeeName.trim() || payees.includes(newPayeeName.trim())}
                            className="flex items-center space-x-2"
                        >
                            <TbPlus className="size-4" />
                            <span>Add</span>
                        </Button>
                    </form>
                    {newPayeeName.trim() && payees.includes(newPayeeName.trim()) && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                            This payee already exists.
                        </p>
                    )}
                </div>

                {/* Payee List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                            Existing Payees ({payees.length})
                        </h4>
                    </div>

                    {payees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No payees found.</p>
                            <p className="text-sm mt-1">Add your first payee above to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {payees.map((payee, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    {editingPayee === payee ? (
                                        // Edit Mode
                                        <div className="flex items-center space-x-3 flex-1">
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="flex-1 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveEdit();
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelEdit();
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    onClick={handleSaveEdit}
                                                    variant="flat"
                                                    size="sm"
                                                    isIcon
                                                    className="text-green-600 hover:text-green-700"
                                                    title="Save changes"
                                                >
                                                    <TbCheck className="size-4" />
                                                </Button>
                                                <Button
                                                    onClick={handleCancelEdit}
                                                    variant="flat"
                                                    size="sm"
                                                    isIcon
                                                    className="text-gray-500 hover:text-gray-700"
                                                    title="Cancel editing"
                                                >
                                                    <TbX className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <>
                                            <div className="flex-1">
                                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                    {payee}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    onClick={() => handleStartEdit(payee)}
                                                    variant="flat"
                                                    size="sm"
                                                    isIcon
                                                    className="text-blue-600 hover:text-blue-700"
                                                    title="Edit payee"
                                                >
                                                    <TbEdit className="size-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeletePayee(payee)}
                                                    variant="flat"
                                                    size="sm"
                                                    isIcon
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Delete payee"
                                                >
                                                    <TbTrash className="size-4" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Usage Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                            💡
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-1">Tips for managing payees:</p>
                            <ul className="space-y-1 text-xs">
                                <li>• Payees are automatically added when you type new names in transaction forms</li>
                                <li>• Edit payees to fix typos or consolidate similar names</li>
                                <li>• Deleting a payee will not affect existing transactions</li>
                                <li>• Changes are saved automatically and sync across all pages</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PayeeManagement;
