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
                    <h3 className="text-lg font-semibold text-base-content">
                        Manage Payees
                    </h3>
                    <p className="text-sm text-base-content/60 mt-1">
                        Add, edit, or remove payees. Changes will be reflected in transaction forms.
                    </p>
                </div>

                {/* Add New Payee */}
                <div className="border-b border-base-300 pb-4">
                    <h4 className="text-md font-medium text-base-content mb-3">
                        Add New Payee
                    </h4>
                    <form onSubmit={handleAddPayee} className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                value={newPayeeName}
                                onChange={(e) => setNewPayeeName(e.target.value)}
                                placeholder="Enter payee name..."
                                className="border-base-300 bg-base-100 text-base-content"
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
                        <p className="text-sm text-error mt-2">
                            This payee already exists.
                        </p>
                    )}
                </div>

                {/* Payee List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-base-content">
                            Existing Payees ({payees.length})
                        </h4>
                    </div>

                    {payees.length === 0 ? (
                        <div className="text-center py-8 text-base-content/60">
                            <p>No payees found.</p>
                            <p className="text-sm mt-1">Add your first payee above to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {payees.map((payee, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg border border-base-300"
                                >
                                    {editingPayee === payee ? (
                                        // Edit Mode
                                        <div className="flex items-center space-x-3 flex-1">
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="flex-1 border-base-300 bg-base-100 text-base-content"
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
                                                    className="text-success hover"
                                                    title="Save changes"
                                                >
                                                    <TbCheck className="size-4" />
                                                </Button>
                                                <Button
                                                    onClick={handleCancelEdit}
                                                    variant="flat"
                                                    size="sm"
                                                    isIcon
                                                    className="text-base-content/60 hover"
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
                                                <span className="text-base-content font-medium">
                                                    {payee}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    onClick={() => handleStartEdit(payee)}
                                                    variant="flat"
                                                    size="sm"
                                                    isIcon
                                                    className="text-info hover"
                                                    title="Edit payee"
                                                >
                                                    <TbEdit className="size-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeletePayee(payee)}
                                                    variant="flat"
                                                    size="sm"
                                                    isIcon
                                                    className="text-error hover"
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
                <div className="bg-info/10 border border-info/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <div className="text-info mt-0.5">
                            💡
                        </div>
                        <div className="text-sm text-info">
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
