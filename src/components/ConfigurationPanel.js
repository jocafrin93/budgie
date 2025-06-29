// src/components/ConfigurationPanel.js
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
    recordPaycheckReceived,
    // NEW: Payday workflow handler
    onStartPaydayWorkflow
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
                    {activeSection === 'paychecks' ?
                        <ChevronDown className="w-5 h-5 text-theme-primary" /> :
                        <ChevronRight className="w-5 h-5 text-theme-primary" />
                    }
                </div>

                {activeSection === 'paychecks' && (
                    <div className="p-4">
                        <PaycheckManager
                            accounts={accounts}
                            onStartPaydayWorkflow={onStartPaydayWorkflow}
                        />
                    </div>
                )}
            </div>

            {/* Budget Settings Section */}
            <div className="border border-theme-primary rounded-lg overflow-hidden">
                <div
                    className="bg-theme-primary bg-opacity-5 p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('budget')}
                >
                    <h3 className="text-lg font-semibold text-theme-primary flex items-center">
                        <Calculator className="w-5 h-5 mr-2" />
                        Budget Settings
                    </h3>
                    {activeSection === 'budget' ?
                        <ChevronDown className="w-5 h-5 text-theme-primary" /> :
                        <ChevronRight className="w-5 h-5 text-theme-primary" />
                    }
                </div>

                {activeSection === 'budget' && (
                    <div className="p-4 space-y-4">
                        {/* Rounding Option */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-theme-text">
                                Rounding Option
                            </label>
                            <select
                                value={roundingOption}
                                onChange={(e) => setRoundingOption(e.target.value)}
                                className="w-full p-2 border border-theme-border rounded bg-theme-primary text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                            >
                                <option value="none">No Rounding</option>
                                <option value="up">Round Up to Nearest Dollar</option>
                                <option value="down">Round Down to Nearest Dollar</option>
                                <option value="nearest">Round to Nearest Dollar</option>
                            </select>
                        </div>

                        {/* Buffer Percentage */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-theme-text">
                                Buffer Percentage ({bufferPercentage}%)
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                step="0.5"
                                value={bufferPercentage}
                                onChange={(e) => setBufferPercentage(parseFloat(e.target.value))}
                                className="w-full h-2 bg-theme-secondary rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-theme-secondary mt-1">
                                <span>0%</span>
                                <span>20%</span>
                            </div>
                        </div>


                    </div>
                )}
            </div>

            {/* Export Section */}
            <div className="border border-theme-primary rounded-lg overflow-hidden">
                <div
                    className="bg-theme-primary bg-opacity-5 p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('export')}
                >
                    <h3 className="text-lg font-semibold text-theme-primary flex items-center">
                        <Download className="w-5 h-5 mr-2" />
                        Export & Import
                    </h3>
                    {activeSection === 'export' ?
                        <ChevronDown className="w-5 h-5 text-theme-primary" /> :
                        <ChevronRight className="w-5 h-5 text-theme-primary" />
                    }
                </div>

                {activeSection === 'export' && (
                    <div className="p-4 space-y-4">
                        <div>
                            <h4 className="font-medium text-theme-text mb-2">Export to YNAB</h4>
                            <p className="text-sm text-theme-secondary mb-3">
                                Export your budget categories to You Need A Budget (YNAB) format.
                            </p>
                            <button
                                onClick={onExport}
                                className="px-4 py-2 bg-theme-primary text-white rounded hover:bg-theme-primary-dark transition-colors"
                            >
                                Export to YNAB
                            </button>
                        </div>

                        <div className="pt-4 border-t border-theme-border">
                            <h4 className="font-medium text-theme-text mb-2">Import Data</h4>
                            <p className="text-sm text-theme-secondary mb-3">
                                Import budget data from CSV or other formats.
                            </p>
                            <button
                                disabled
                                className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                            >
                                Import Data (Coming Soon)
                            </button>
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