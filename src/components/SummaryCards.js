import React from 'react';

const SummaryCards = ({ calculations, currentPay, bufferPercentage, viewMode, darkMode }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-lg`}>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Allocation</h3>
                <p className="text-2xl font-bold text-blue-400">
                    {viewMode === 'amount'
                        ? `$${calculations.totalBiweeklyAllocation.toFixed(2)}`
                        : `${((calculations.totalBiweeklyAllocation / currentPay) * 100).toFixed(1)}%`
                    }
                </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-lg`}>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Buffer Amount</h3>
                <p className="text-2xl font-bold text-purple-400">
                    {viewMode === 'amount'
                        ? `$${calculations.bufferAmount.toFixed(2)}`
                        : `${bufferPercentage}%`
                    }
                </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-lg`}>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total with Buffer</h3>
                <p className="text-2xl font-bold text-pink-400">
                    {viewMode === 'amount'
                        ? `$${calculations.totalWithBuffer.toFixed(2)}`
                        : `${calculations.allocationPercentage.toFixed(1)}%`
                    }
                </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-lg`}>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Remaining Income</h3>
                <p className={`text-2xl font-bold ${calculations.remainingIncome >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {viewMode === 'amount'
                        ? `$${calculations.remainingIncome.toFixed(2)}`
                        : `${((calculations.remainingIncome / currentPay) * 100).toFixed(1)}%`
                    }
                </p>
            </div>
        </div>
    );
};

export default SummaryCards; 
