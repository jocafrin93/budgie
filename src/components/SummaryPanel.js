import React from 'react';

const SummaryPanel = ({
    calculations,
    currentPay,
    bufferPercentage,
    viewMode,
    darkMode,
    whatIfMode,
    takeHomePay,
    whatIfPay,
    categorizedExpenses,
    expenses,
    savingsGoals,
}) => {
    return (
        <div className={`bg-theme-primary rounded-lg p-6 shadow-lg h-fit`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
                📊 Quick Summary
            </h3>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="flex items-center">💰 Paycheck:</span>
                    <span className="font-medium">${currentPay.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                    <span>Allocations:</span>
                    <span className="font-medium">
                        {viewMode === 'amount'
                            ? `$${calculations.totalBiweeklyAllocation.toFixed(2)}`
                            : `${((calculations.totalBiweeklyAllocation / currentPay) * 100).toFixed(1)}%`
                        }
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Buffer ({bufferPercentage}%):</span>
                    <span className="font-medium">
                        {viewMode === 'amount'
                            ? `$${calculations.bufferAmount.toFixed(2)}`
                            : `${bufferPercentage}%`
                        }
                    </span>
                </div>

                <hr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                <div className="flex justify-between font-semibold">
                    <span>Total Needed:</span>
                    <span>
                        {viewMode === 'amount'
                            ? `$${calculations.totalWithBuffer.toFixed(2)}`
                            : `${calculations.allocationPercentage.toFixed(1)}%`
                        }
                    </span>
                </div>

                <div
                    className={`flex justify-between font-semibold ${calculations.remainingIncome >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                >
                    <span>Remaining:</span>
                    <span>
                        {viewMode === 'amount'
                            ? `$${calculations.remainingIncome.toFixed(2)}`
                            : `${((calculations.remainingIncome / currentPay) * 100).toFixed(1)}%`
                        }
                    </span>
                </div>
            </div>

            {whatIfMode && (
                <div className="mt-6 p-3 bg-blue-100 dark:bg-blue-900/20 rounded">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                        🔮 What-If Analysis
                    </h4>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <div>💰 Current: ${takeHomePay.toFixed(2)}</div>
                        <div>🔍 What-If: ${whatIfPay.toFixed(2)}</div>
                        <div
                            className={`font-medium ${whatIfPay > takeHomePay ? 'text-green-600' : 'text-red-600'
                                }`}
                        >
                            📊 Difference: {whatIfPay > takeHomePay ? '+' : ''}$
                            {(whatIfPay - takeHomePay).toFixed(2)}
                        </div>
                        <div className="text-xs mt-1">
                            📈 Annual impact: {whatIfPay > takeHomePay ? '+' : ''}$
                            {((whatIfPay - takeHomePay) * 26).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="mt-4">
                <hr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-3`} />
                <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium">
                        <span className="mr-2">📈</span>
                        <span>Quick Stats</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className={`p-2 rounded text-center ${darkMode ? 'bg-purple-800' : 'bg-purple-100'}`}>
                            <div className="font-medium">{categorizedExpenses.length}</div>
                            <div className="text-purple-600 dark:text-purple-400">Categories</div>
                        </div>
                        <div className={`p-2 rounded text-center ${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}>
                            <div className="font-medium">{expenses.length}</div>
                            <div className="text-blue-600 dark:text-blue-400">Expenses</div>
                        </div>
                        <div className={`p-2 rounded text-center ${darkMode ? 'bg-green-800' : 'bg-green-100'}`}>
                            <div className="font-medium">{savingsGoals.length}</div>
                            <div className="text-green-600 dark:text-green-400">Goals</div>
                        </div>
                        <div className={`p-2 rounded text-center ${darkMode ? 'bg-yellow-800' : 'bg-yellow-100'}`}>
                            <div className="font-medium">
                                {calculations.expenseAllocations.filter(e => e.isFullyFunded).length +
                                    calculations.goalAllocations.filter(g => g.isFullyFunded).length}
                            </div>
                            <div className="text-yellow-600 dark:text-yellow-400">Funded</div>
                        </div>
                        <div className={`p-2 rounded text-center ${darkMode ? 'bg-orange-800' : 'bg-orange-100'}`}>
                            <div className="font-medium">
                                {calculations.expenseAllocations.filter(e => e.priorityState === 'paused').length +
                                    calculations.goalAllocations.filter(g => g.priorityState === 'paused').length}
                            </div>
                            <div className="text-orange-600 dark:text-orange-400">Paused</div>
                        </div>
                        <div className={`p-2 rounded text-center ${darkMode ? 'bg-indigo-800' : 'bg-indigo-100'}`}>
                            <div className="font-medium">
                                {calculations.expenseAllocations.filter(e => e.priorityState === 'complete').length +
                                    calculations.goalAllocations.filter(g => g.priorityState === 'complete').length}
                            </div>
                            <div className="text-indigo-600 dark:text-indigo-400">Complete</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Annual Projections */}
            <div className="mt-4">
                <hr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-3`} />
                <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium">
                        <span className="mr-2">📅</span>
                        <span>Annual Projections</span>
                    </div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span>💰 Annual Income:</span>
                            <span className="font-medium">${(currentPay * 26).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>💸 Annual Allocations:</span>
                            <span className="font-medium">
                                ${(calculations.totalWithBuffer * 26).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>💚 Annual Remaining:</span>
                            <span
                                className={`font-medium ${calculations.remainingIncome >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}
                            >
                                ${(calculations.remainingIncome * 26).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPanel;