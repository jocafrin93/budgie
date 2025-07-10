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
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-96 shadow-xl border border-gray-200 dark:border-dark-600">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50">Move Money</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-dark-300">Moving from:</div>
                        <div className="font-semibold text-gray-900 dark:text-dark-50">
                            {sourceCategory.name} (${(sourceCategory.available || 0).toFixed(2)} available)
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-dark-50 mb-1">
                            To Category
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50 focus:outline-none focus:ring-2 focus:ring-info-500 dark:focus:ring-info-400"
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
                        <label className="block text-sm font-medium text-gray-900 dark:text-dark-50 mb-1">
                            Amount
                        </label>
                        <CurrencyField
                            name="moveAmount"
                            value={moveAmount}
                            onChange={(e) => setMoveAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50 focus:outline-none focus:ring-2 focus:ring-info-500 dark:focus:ring-info-400"
                            hideLabel={true}
                        />
                        {maxAmount > 0 && (
                            <div className="text-xs text-gray-600 dark:text-dark-300 mt-1">
                                Maximum: ${maxAmount.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMove}
                        disabled={!selectedCategoryId || !moveAmount || parseFloat(moveAmount) <= 0}
                        className="px-4 py-2 bg-info/60 hover:bg-info/70 dark:bg-info/50 dark:hover:bg-info/60 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Move Money
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoneyMovementModal;
