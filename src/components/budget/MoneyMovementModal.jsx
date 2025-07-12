// src/components/budget/MoneyMovementModal.jsx
import { X } from 'lucide-react';
import { useState } from 'react';
import { CurrencyField } from '../form';

const MoneyMovementModal = ({ amount, sourceCategory, categories, onMove, onClose }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [moveAmount, setMoveAmount] = useState(Math.abs(amount).toFixed(2));

    const handleMove = () => {
        if (selectedCategoryId && moveAmount) {
            const parsedAmount = parseFloat(moveAmount);
            const source = sourceCategory.id;

            let destination;
            if (selectedCategoryId === 'ready-to-assign') {
                destination = 'toBeAllocated';
            } else {
                destination = parseInt(selectedCategoryId, 10);
            }

            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                onMove(source, destination, parsedAmount);
                onClose();
            }
        }
    };

    const maxAmount = Math.abs(amount);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
            <div className="bg-base-100 rounded-lg p-6 w-96 shadow-xl border border-base-300">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-base-content">Move Money</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-base-content/60 hover:text-base-content rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-3 bg-base-200 border border-base-300 rounded-lg">
                        <div className="text-sm text-base-content/60">Moving from:</div>
                        <div className="font-semibold text-base-content">
                            {sourceCategory.name} (${(sourceCategory.available || 0).toFixed(2)} available)
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                            To Category
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                        >
                            <option value="">Select destination...</option>
                            <option value="ready-to-assign">Ready to Assign</option>
                            {categories
                                .filter(cat => cat.id !== sourceCategory.id)
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} (${(cat.available || 0).toFixed(2)} available)
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                            Amount
                        </label>
                        <CurrencyField
                            name="moveAmount"
                            value={moveAmount}
                            onChange={(e) => setMoveAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                            hideLabel={true}
                        />
                        {maxAmount > 0 && (
                            <div className="text-xs text-base-content/60 mt-1">
                                Maximum: ${maxAmount.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-base-content/60 bg-base-200 hover rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMove}
                        disabled={!selectedCategoryId || !moveAmount || parseFloat(moveAmount) <= 0}
                        className="px-4 py-2 bg-info/60 hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Move Money
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoneyMovementModal;
