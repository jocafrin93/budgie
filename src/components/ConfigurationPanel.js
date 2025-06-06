import React from 'react';
import { Calculator, Download, ChevronDown, ChevronRight } from 'lucide-react';

const ConfigurationPanel = ({
    darkMode,
    showConfig,
    setShowConfig,
    takeHomePay,
    setTakeHomePay,
    whatIfMode,
    whatIfPay,
    setWhatIfPay,
    roundingOption,
    setRoundingOption,
    bufferPercentage,
    setBufferPercentage,
    paySchedule,
    setPaySchedule,
    accounts,
    setShowAddAccount,
    onExport,
}) => {
    return (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 mb-8 shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
                <div
                    className="flex items-center cursor-pointer flex-1"
                    onClick={() => setShowConfig(!showConfig)}
                >
                    {showConfig ? (
                        <ChevronDown className="w-5 h-5 mr-2" />
                    ) : (
                        <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    <h2 className="text-xl font-semibold flex items-center">
                        <Calculator className="w-5 h-5 mr-2" />
                        <span>Configuration</span>
                        {whatIfMode && (
                            <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded">
                                What-If Mode
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={onExport}
                        className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                            } transition-colors`}
                        title="Export to YNAB"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showConfig && (
                <div className="space-y-4">
                    {/* Split paycheck section */}
                    <div className={`p-4 rounded border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                        }`}>
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                id="splitPaycheck"
                                checked={paySchedule.splitPaycheck}
                                onChange={(e) => setPaySchedule(prev => ({
                                    ...prev,
                                    splitPaycheck: e.target.checked,
                                }))}
                                className="mr-2"
                            />
                            <label htmlFor="splitPaycheck" className="text-sm font-medium">
                                I receive split paychecks (direct deposit to multiple accounts)
                            </label>
                            {paySchedule.splitPaycheck && accounts.length >= 2 && (
                                <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-1 rounded">
                                    Split Pay
                                </span>
                            )}
                        </div>

                        {paySchedule.splitPaycheck && accounts.length < 2 && (
                            <div className={`p-3 rounded border ${darkMode ? 'border-yellow-600 bg-yellow-900/20' : 'border-yellow-300 bg-yellow-50'
                                } mb-4`}>
                                <div className="flex items-center text-sm">
                                    <span className="mr-2">💡</span>
                                    <span>You'll need a second account to split your paycheck.</span>
                                    <button
                                        onClick={() => setShowAddAccount(true)}
                                        className={`ml-2 hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'
                                            }`}
                                    >
                                        Add Account
                                    </button>
                                </div>
                            </div>
                        )}

                        {paySchedule.splitPaycheck && accounts.length >= 2 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Primary Account</label>
                                        <select
                                            value={paySchedule.primaryAccountId}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                primaryAccountId: parseInt(e.target.value),
                                            }))}
                                            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                                }`}
                                        >
                                            {accounts.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Primary Amount</label>
                                        <input
                                            type="number"
                                            value={paySchedule.primaryAmount}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                primaryAmount: parseFloat(e.target.value) || 0,
                                            }))}
                                            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Secondary Account</label>
                                        <select
                                            value={paySchedule.secondaryAccountId}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                secondaryAccountId: parseInt(e.target.value),
                                            }))}
                                            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                                }`}
                                        >
                                            {accounts
                                                .filter(acc => acc.id !== paySchedule.primaryAccountId)
                                                .map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Secondary Amount</label>
                                        <input
                                            type="number"
                                            value={paySchedule.secondaryAmount}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                secondaryAmount: parseFloat(e.target.value) || 0,
                                            }))}
                                            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                                }`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Days Early</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="7"
                                            value={paySchedule.secondaryDaysEarly}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                secondaryDaysEarly: parseInt(e.target.value) || 0,
                                            }))}
                                            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main config row */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {whatIfMode ? 'What-If Pay' : 'Take-home Pay'} (bi-weekly)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    $
                                </span>
                                <input
                                    type="number"
                                    value={whatIfMode ? whatIfPay : takeHomePay}
                                    onChange={(e) =>
                                        whatIfMode
                                            ? setWhatIfPay(parseFloat(e.target.value) || 0)
                                            : setTakeHomePay(parseFloat(e.target.value) || 0)
                                    }
                                    className={`w-full pl-8 p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                        } ${whatIfMode ? 'ring-2 ring-blue-500' : ''}`}
                                />
                            </div>
                            {!paySchedule.splitPaycheck && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Complete bi-weekly amount
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Rounding</label>
                            <select
                                value={roundingOption}
                                onChange={(e) => setRoundingOption(parseInt(e.target.value))}
                                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                            >
                                <option value={0}>No rounding</option>
                                <option value={5}>Round to $5</option>
                                <option value={10}>Round to $10</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Buffer (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="20"
                                value={bufferPercentage}
                                onChange={(e) => setBufferPercentage(parseFloat(e.target.value) || 0)}
                                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Next Paycheck Date</label>
                            <input
                                type="date"
                                value={paySchedule.startDate}
                                onChange={(e) => setPaySchedule(prev => ({
                                    ...prev,
                                    startDate: e.target.value,
                                }))}
                                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                style={darkMode ? { colorScheme: 'dark' } : {}}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigurationPanel; 
