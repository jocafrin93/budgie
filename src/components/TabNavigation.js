// components/TabNavigation.js
import React from 'react';
import { DollarSign, Calendar, Settings, Users } from 'lucide-react';

const TabNavigation = ({ activeTab, setActiveTab, darkMode }) => {
    const tabs = [
        { id: 'budget', label: 'Budget', icon: DollarSign },
        { id: 'transactions', label: 'Transactions', icon: DollarSign },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'config', label: 'Config', icon: Settings },
        { id: 'payees', label: 'Payees', icon: Users }
    ];

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="flex space-x-8">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default TabNavigation;