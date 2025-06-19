// FIXED SimplifiedSummaryCards.js

import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

const SimplifiedSummaryCards = ({
    calculations,
    accounts = [],
    categories = [],
    currentPay,
    expenses = [],
    savingsGoals = [],
    timeline,
    planningItems = [],           // ADD THIS
    activeBudgetAllocations = [], // ADD THIS
}) => {


    // Calculate CORRECT values from the right data sources
    const summaryData = useMemo(() => {
        // 1. Available to Allocate = Account balances - Category allocated money
        const totalAccountBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        const totalAllocated = categories.reduce((sum, category) => sum + (category.allocated || 0), 0);
        const availableToAllocate = totalAccountBalance - totalAllocated;

        // 2. Budget Progress = Sum of active budget allocations per paycheck
        const totalPlannedPerPaycheck = activeBudgetAllocations.reduce((sum, allocation) => {
            return sum + (allocation.perPaycheckAmount || 0);
        }, 0);
        const budgetProgress = currentPay > 0 ? (totalPlannedPerPaycheck / currentPay) * 100 : 0;

        // 3. Urgent Items = Active planning items with deadlines in next 30 days
        const urgentItems = planningItems.filter(item => {
            if (!item.isActive) return false;

            const deadlineField = item.type === 'savings-goal' ? item.targetDate : item.dueDate;
            if (!deadlineField) return false;

            const deadline = new Date(deadlineField);
            const now = new Date();
            const daysUntil = (deadline - now) / (1000 * 60 * 60 * 24);

            return daysUntil <= 30 && daysUntil >= 0;
        }).length;

        return {
            availableToAllocate,
            totalPlannedPerPaycheck,
            budgetProgress,
            urgentItems
        };
    }, [accounts, categories, activeBudgetAllocations, planningItems, currentPay]);

    // Pet stats calculation (using planning items instead of legacy expenses/goals)
    const calculatePetStats = () => {
        const totalItems = planningItems.length;
        const activeItems = planningItems.filter(item => item.isActive).length;
        const fundedItems = planningItems.filter(item => {
            // Check if item is fully funded based on its current savings vs target
            if (item.type === 'savings-goal') {
                return (item.alreadySaved || 0) >= (item.targetAmount || 0);
            } else {
                return (item.alreadySaved || 0) >= (item.amount || 0);
            }
        }).length;

        const fundingPercentage = totalItems > 0 ? (fundedItems / totalItems) * 100 : 0;
        const budgetHealth = summaryData.availableToAllocate >= 0 ? 100 : Math.max(0, 100 + (summaryData.availableToAllocate / 100));

        return { fundingPercentage, budgetHealth, totalItems, fundedItems };
    };

    const stats = calculatePetStats();

    // Rest of your existing pet logic...
    const [petMood, setPetMood] = useState('happy');
    const [petStage, setPetStage] = useState('chick');
    const [isAnimating, setIsAnimating] = useState(false);

    // Update pet mood and stage based on budget health
    useEffect(() => {
        const { fundingPercentage, budgetHealth } = stats;

        // Determine mood
        if (summaryData.urgentItems > 2) {
            setPetMood('sick');
        } else if (budgetHealth < 50) {
            setPetMood('sad');
        } else if (fundingPercentage > 75) {
            setPetMood('excited');
        } else if (fundingPercentage > 50) {
            setPetMood('happy');
        } else if (fundingPercentage < 25) {
            setPetMood('sleepy');
        } else {
            setPetMood('neutral');
        }

        // Determine stage
        if (fundingPercentage >= 90) {
            setPetStage('master');
        } else if (fundingPercentage >= 70) {
            setPetStage('adult');
        } else if (fundingPercentage >= 40) {
            setPetStage('teen');
        } else if (fundingPercentage >= 20) {
            setPetStage('child');
        } else {
            setPetStage('chick');
        }
    }, [stats.fundingPercentage, stats.budgetHealth, summaryData.urgentItems]);

    // Your existing pet SVG and other functions...
    const getCompactPetSVG = () => {
        // ... existing pet SVG code
    };

    const getPetStatusText = () => {
        const stages = {
            chick: 'Baby Budgie',
            child: 'Young Budgie',
            teen: 'Teen Budgie',
            adult: 'Adult Budgie',
            master: 'Master Budgie'
        };
        return stages[petStage];
    };

    const getPetMoodEmoji = () => {
        const moods = {
            happy: '😊',
            excited: '🤩',
            neutral: '😐',
            sad: '😔',
            sleepy: '😴',
            sick: '🤒'
        };
        return moods[petMood];
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Available to Allocate Card */}
            <div className="bg-theme-primary rounded-lg p-4 shadow-lg">
                <h3 className="text-sm font-medium text-theme-tertiary mb-1">Available to Allocate</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-2xl font-bold ${summaryData.availableToAllocate >= 0 ? 'text-theme-green' : 'text-theme-red'}`}>
                            ${Math.abs(summaryData.availableToAllocate).toFixed(2)}
                        </p>
                        <p className="text-xs text-theme-secondary">
                            {summaryData.availableToAllocate >= 0 ? 'ready to fund categories' : 'overallocated'}
                        </p>
                    </div>
                    <div className="text-2xl">
                        {summaryData.availableToAllocate >= 0 ? '💰' : <AlertTriangle className="w-6 h-6 text-theme-red" />}
                    </div>
                </div>
            </div>

            {/* Budget Progress Card - NOW USING CORRECT DATA */}
            <div className="bg-theme-primary rounded-lg p-4 shadow-lg">
                <h3 className="text-sm font-medium text-theme-tertiary mb-1">Budget Progress</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-bold text-theme-blue">
                            ${summaryData.totalPlannedPerPaycheck.toFixed(2)}
                        </p>
                        <p className="text-xs text-theme-secondary">
                            of ${currentPay.toFixed(2)} planned ({summaryData.budgetProgress.toFixed(0)}%)
                        </p>
                    </div>
                    <div className="text-2xl">📊</div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-theme-tertiary rounded-full h-2 mt-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${summaryData.budgetProgress > 100 ? 'bg-red-500' :
                            summaryData.budgetProgress > 90 ? 'bg-yellow-500' :
                                'bg-green-500'
                            }`}
                        style={{ width: `${Math.min(100, summaryData.budgetProgress)}%` }}
                    />
                </div>
            </div>

            {/* Urgent Items Card - NOW USING CORRECT DATA */}
            <div className="bg-theme-primary rounded-lg p-4 shadow-lg">
                <h3 className="text-sm font-medium text-theme-tertiary mb-1">Needs Attention</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-2xl font-bold ${summaryData.urgentItems > 0 ? 'text-theme-red' : 'text-theme-green'}`}>
                            {summaryData.urgentItems}
                        </p>
                        <p className="text-xs text-theme-secondary">
                            {summaryData.urgentItems > 0 ? 'items need funding soon' : 'all caught up!'}
                        </p>
                    </div>
                    <div className="text-2xl">
                        {summaryData.urgentItems > 0 ? '⚠️' : '✅'}
                    </div>
                </div>

                {summaryData.urgentItems > 0 && (
                    <div className="mt-2">
                        <div className="text-xs text-theme-red font-medium">
                            {summaryData.urgentItems === 1 ? 'Critical deadline approaching' : `${summaryData.urgentItems} critical deadlines`}
                        </div>
                    </div>
                )}
            </div>

            {/* Budget Buddy Pet Card - USING CORRECT STATS */}
            <div
                className="bg-theme-primary rounded-lg p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => {
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 600);
                }}
            >
                <h3 className="text-sm font-medium text-theme-tertiary mb-1">Budget Buddy</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {getCompactPetSVG()}
                        <div>
                            <div className="text-lg font-bold text-theme-primary">
                                {Math.round(stats.fundingPercentage)}%
                            </div>
                            <div className="text-xs text-theme-secondary flex items-center">
                                <span className="mr-1">{getPetMoodEmoji()}</span>
                                {getPetStatusText()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mini progress bar */}
                <div className="w-full bg-theme-tertiary rounded-full h-1.5 mt-2">
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, stats.fundingPercentage)}%` }}
                    />
                </div>

                {/* Status indicator */}
                {summaryData.urgentItems > 0 && (
                    <div className="text-xs text-theme-red mt-1 flex items-center">
                        ⚠️ {summaryData.urgentItems} urgent items
                    </div>
                )}

                {stats.fundingPercentage >= 100 && (
                    <div className="text-xs text-theme-yellow mt-1">
                        🎉 All goals funded!
                    </div>
                )}

                <div className="text-xs text-theme-tertiary mt-1">
                    Click me to play! 🎮
                </div>
            </div>
        </div>
    );
};

export default SimplifiedSummaryCards;