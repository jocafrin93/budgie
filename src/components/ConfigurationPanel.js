import React from 'react';
import { Calculator, Download, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import CurrencyInput from './CurrencyInput';



const ConfigurationPanel = ({
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
    payFrequency,
    setPayFrequency, payFrequencyOptions
}) => {
    return (
        <div>
            {/* Add this as the FIRST section in your existing return */}
            <div className="bg-theme-primary rounded-lg p-6 border border-theme-secondary mb-6">
                <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Pay Schedule Configuration
                </h3>



                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">
                            How often are you paid?
                        </label>
                        <select
                            value={payFrequency}
                            onChange={(e) => setPayFrequency(e.target.value)}
                            className="w-full p-2 border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary"
                        >
                            {payFrequencyOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-theme-tertiary mt-1">
                            This affects how per-paycheck amounts are calculated throughout the app
                        </p>
                    </div>

                    <div className="bg-theme-secondary rounded-lg p-4">
                        <h4 className="font-medium text-theme-primary mb-2">Calculation Preview</h4>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-theme-secondary">Pay frequency:</span>
                                <span className="text-theme-primary">
                                    {payFrequencyOptions.find(opt => opt.value === payFrequency)?.label}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-theme-secondary">Paychecks/month:</span>
                                <span className="text-theme-primary">
                                    {payFrequencyOptions.find(opt => opt.value === payFrequency)?.paychecksPerMonth}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-theme-primary pt-1">
                                <span className="text-theme-secondary">$100/month becomes:</span>
                                <span className="text-theme-primary font-medium">
                                    ${(100 / (payFrequencyOptions.find(opt => opt.value === payFrequency)?.paychecksPerMonth || 2.17)).toFixed(2)}/paycheck
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>





            {showConfig && (
                <div className="space-y-4">
                    {/* Split paycheck section */}
                    <div className="p-4 rounded border border-theme-primary bg-theme-secondary">
                        <div className="flex items-center mb-2">
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
                            <label htmlFor="splitPaycheck" className="text-sm font-medium text-theme-primary">
                                I receive split paychecks (direct deposit to multiple accounts)
                            </label>
                            {paySchedule.splitPaycheck && accounts.length >= 2 && (
                                <span className="ml-2 text-xs bg-purple-400 text-theme-primary px-2 py-1 rounded">
                                    Split Pay
                                </span>
                            )}
                        </div>

                        {paySchedule.splitPaycheck && accounts.length < 2 && (
                            <div className="p-3 rounded border border-yellow-400 bg-yellow-100 mb-4">
                                <div className="flex items-center text-sm">
                                    <span className="mr-2">💡</span>
                                    <span className="text-yellow-800">You'll need a second account to split your paycheck.</span>
                                    <button
                                        onClick={() => setShowAddAccount(true)}
                                        className="ml-2 hover:underline text-blue-600 hover:text-blue-700"
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
                                        <label className="block text-sm font-medium mb-1 text-theme-primary">Primary Account</label>
                                        <select
                                            value={paySchedule.primaryAccountId}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                primaryAccountId: parseInt(e.target.value),
                                            }))}
                                            className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                                        >
                                            {accounts.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-theme-primary">Primary Amount</label>
                                        <CurrencyInput
                                            value={paySchedule.primaryAmount}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                primaryAmount: parseFloat(e.target.value) || 0,
                                            }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-theme-primary">Secondary Account</label>
                                        <select
                                            value={paySchedule.secondaryAccountId}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                secondaryAccountId: parseInt(e.target.value),
                                            }))}
                                            className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
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
                                        <label className="block text-sm font-medium mb-1 text-theme-primary">Secondary Amount</label>
                                        <CurrencyInput
                                            value={paySchedule.secondaryAmount}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                secondaryAmount: parseFloat(e.target.value) || 0,
                                            }))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-theme-primary">Days Early</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="7"
                                            value={paySchedule.secondaryDaysEarly}
                                            onChange={(e) => setPaySchedule(prev => ({
                                                ...prev,
                                                secondaryDaysEarly: parseInt(e.target.value) || 0,
                                            }))}
                                            className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main config row */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-theme-primary">
                                {whatIfMode ? 'What-If Pay' : 'Take-home Pay'} (bi-weekly)
                            </label>
                            {paySchedule.splitPaycheck ? (
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-tertiary">$</span>
                                    <div className="w-full pl-8 p-2 border rounded bg-theme-tertiary border-theme-primary text-theme-secondary">
                                        {(paySchedule.primaryAmount + paySchedule.secondaryAmount).toFixed(2)}
                                    </div>
                                </div>
                            ) : (
                                <CurrencyInput
                                    value={whatIfMode ? whatIfPay : takeHomePay}
                                    onChange={(e) =>
                                        whatIfMode
                                            ? setWhatIfPay(parseFloat(e.target.value) || 0)
                                            : setTakeHomePay(parseFloat(e.target.value) || 0)
                                    }
                                    className={whatIfMode ? 'ring-2 ring-blue-500' : ''}
                                />
                            )}
                            {!paySchedule.splitPaycheck && (
                                <div className="text-xs text-theme-tertiary mt-1">
                                    Complete bi-weekly amount
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-theme-primary">Rounding</label>
                            <select
                                value={roundingOption}
                                onChange={(e) => setRoundingOption(parseInt(e.target.value))}
                                className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                            >
                                <option value={0}>No rounding</option>
                                <option value={5}>Round to $5</option>
                                <option value={10}>Round to $10</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-theme-primary">Buffer (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="20"
                                value={bufferPercentage}
                                onChange={(e) => setBufferPercentage(parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-theme-primary">Next Paycheck Date</label>
                            <input
                                type="date"
                                value={paySchedule.startDate}
                                onChange={(e) => setPaySchedule(prev => ({
                                    ...prev,
                                    startDate: e.target.value,
                                }))}
                                className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                            // style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigurationPanel;