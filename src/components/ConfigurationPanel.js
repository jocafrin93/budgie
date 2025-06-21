import { Calculator, Calendar, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useState } from 'react';
import PaycheckManager from './PaycheckManager';

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
    setPayFrequency,
    payFrequencyOptions,
    // Multi-paycheck system props
    paychecks,
    addPaycheck,
    updatePaycheck,
    deletePaycheck,
    togglePaycheckActive,
    recordPaycheckReceived
}) => {
    // State to manage active section
    const [activeSection, setActiveSection] = useState('paychecks');

    // Toggle section visibility
    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    return (
        <div className="space-y-6">
            {/* Paychecks Section */}
            <div className="border border-theme-primary rounded-lg overflow-hidden">
                <div
                    className="bg-theme-primary bg-opacity-5 p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('paychecks')}
                >
                    <h3 className="text-lg font-semibold text-theme-primary flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Paychecks
                    </h3>
                    {activeSection === 'paychecks' ? (
                        <ChevronDown className="w-5 h-5 text-theme-primary" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-theme-primary" />
                    )}
                </div>

                {activeSection === 'paychecks' && (
                    <div className="p-4">
                        <PaycheckManager
                            accounts={accounts}
                            paychecks={paychecks}
                            addPaycheck={addPaycheck}
                            updatePaycheck={updatePaycheck}
                            deletePaycheck={deletePaycheck}
                            togglePaycheckActive={togglePaycheckActive}
                            recordPaycheckReceived={recordPaycheckReceived}
                        />
                    </div>
                )}
            </div>

            {/* Budget Settings Section */}
            <div className="border border-theme-primary rounded-lg overflow-hidden">
                <div
                    className="bg-theme-primary bg-opacity-5 p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('budgetSettings')}
                >
                    <h3 className="text-lg font-semibold text-theme-primary flex items-center">
                        <Calculator className="w-5 h-5 mr-2" />
                        Budget Settings
                    </h3>
                    {activeSection === 'budgetSettings' ? (
                        <ChevronDown className="w-5 h-5 text-theme-primary" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-theme-primary" />
                    )}
                </div>

                {activeSection === 'budgetSettings' && (
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <div className="text-xs text-theme-tertiary mt-1">
                                    Automatically round budget amounts
                                </div>
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
                                <div className="text-xs text-theme-tertiary mt-1">
                                    Extra padding for your budget allocations
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-theme-primary">Pay Frequency</label>
                                <select
                                    value={payFrequency}
                                    onChange={(e) => setPayFrequency(e.target.value)}
                                    className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                                >
                                    {payFrequencyOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="text-xs text-theme-tertiary mt-1">
                                    Default for new paychecks
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 bg-theme-secondary bg-opacity-10 p-4 rounded">
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
                                <div className="flex justify-between border-t border-theme-primary border-opacity-20 pt-1 mt-1">
                                    <span className="text-theme-secondary">$100/month becomes:</span>
                                    <span className="text-theme-primary font-medium">
                                        ${(100 / (payFrequencyOptions.find(opt => opt.value === payFrequency)?.paychecksPerMonth || 2.17)).toFixed(2)}/paycheck
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Export/Import Section */}
            <div className="border border-theme-primary rounded-lg overflow-hidden">
                <div
                    className="bg-theme-primary bg-opacity-5 p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('exportImport')}
                >
                    <h3 className="text-lg font-semibold text-theme-primary flex items-center">
                        <Download className="w-5 h-5 mr-2" />
                        Export & Import
                    </h3>
                    {activeSection === 'exportImport' ? (
                        <ChevronDown className="w-5 h-5 text-theme-primary" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-theme-primary" />
                    )}
                </div>

                {activeSection === 'exportImport' && (
                    <div className="p-4">
                        <div className="flex flex-col space-y-4">
                            <button
                                onClick={onExport}
                                className="bg-theme-primary text-white px-4 py-2 rounded hover:bg-opacity-90 flex items-center"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export Budget Data
                            </button>

                            <div className="text-sm text-theme-secondary">
                                Export your budget data as a JSON file for backup or transfer to another device.
                            </div>

                            {/* Add import functionality in the future */}
                        </div>
                    </div>
                )}
            </div>

            {/* Legacy compatibility - hidden form elements to maintain existing state management */}
            {showConfig && (
                <div className="hidden">
                    <input
                        type="checkbox"
                        checked={paySchedule.splitPaycheck || false}
                        onChange={() => { }}
                    />
                    <input
                        type="date"
                        value={paySchedule.startDate || ''}
                        onChange={() => { }}
                    />
                </div>
            )}
        </div>
    );
};

export default ConfigurationPanel;