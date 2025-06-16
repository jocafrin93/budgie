import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

const SimplifiedSummaryCards = ({
    calculations,
    accounts = [],
    categories = [],
    currentPay,
    expenses = [],
    savingsGoals = [],
    timeline
}) => {
    const [petMood, setPetMood] = useState('happy');
    const [petStage, setPetStage] = useState('chick');
    const [isAnimating, setIsAnimating] = useState(false);

    // Calculate real money available to allocate
    const totalAccountBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalAllocated = categories.reduce((sum, category) => sum + (category.allocated || 0), 0);
    const availableToAllocate = totalAccountBalance - totalAllocated;

    // Calculate budget progress from calculations
    const totalPlanned = calculations?.totalBiweeklyAllocation || 0;
    const budgetProgress = currentPay > 0 ? (totalPlanned / currentPay) * 100 : 0;

    // Calculate urgent items from timeline
    const urgentItems = timeline?.timelines?.critical?.length || 0;

    // Calculate pet stats for the budget buddy
    const calculatePetStats = () => {
        const totalItems = expenses.length + savingsGoals.length;
        const fundedItems = expenses.filter(e => e.isFullyFunded).length +
            savingsGoals.filter(g => g.isFullyFunded).length;

        const fundingPercentage = totalItems > 0 ? (fundedItems / totalItems) * 100 : 0;
        const budgetHealth = calculations?.remainingIncome >= 0 ? 100 : Math.max(0, 100 + (calculations?.remainingIncome / 100));

        return { fundingPercentage, budgetHealth, totalItems, fundedItems };
    };

    const stats = calculatePetStats();

    // Update pet mood and stage based on budget health
    useEffect(() => {
        const { fundingPercentage, budgetHealth } = stats;

        // Determine mood
        if (urgentItems > 2) {
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
    }, [stats.fundingPercentage, stats.budgetHealth, urgentItems]);

    // Compact pet SVG
    const getCompactPetSVG = () => {
        const bodyColor = petMood === 'sick' ? '#94a3b8' : petMood === 'sad' ? '#a1a1aa' : '#fbbf24';
        const eyeState = petMood === 'sleepy' ? 'closed' : 'open';
        const blushColor = petMood === 'excited' ? '#f87171' : 'transparent';

        return (
            <svg
                width="32"
                height="32"
                viewBox="0 0 100 100"
                className={`transition-all duration-300 ${isAnimating ? 'animate-bounce' : ''}`}
            >
                {/* Body */}
                <ellipse cx="50" cy="65" rx="20" ry="15" fill={bodyColor} />
                {/* Head */}
                <circle cx="50" cy="35" r="15" fill={bodyColor} />
                {/* Beak */}
                <polygon points="50,40 46,44 54,44" fill="#f97316" />
                {/* Eyes */}
                {eyeState === 'open' ? (
                    <>
                        <circle cx="46" cy="32" r="2" fill="#1f2937" />
                        <circle cx="54" cy="32" r="2" fill="#1f2937" />
                        <circle cx="46.5" cy="31.5" r="0.5" fill="white" />
                        <circle cx="54.5" cy="31.5" r="0.5" fill="white" />
                    </>
                ) : (
                    <>
                        <line x1="44" y1="32" x2="48" y2="32" stroke="#1f2937" strokeWidth="1.5" />
                        <line x1="52" y1="32" x2="56" y2="32" stroke="#1f2937" strokeWidth="1.5" />
                    </>
                )}
                {/* Blush */}
                <circle cx="38" cy="38" r="3" fill={blushColor} opacity="0.6" />
                <circle cx="62" cy="38" r="3" fill={blushColor} opacity="0.6" />
                {/* Crown for master */}
                {petStage === 'master' && (
                    <polygon points="50,18 48,23 52,23" fill="#ffd700" />
                )}
            </svg>
        );
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
                        <p className={`text-2xl font-bold ${availableToAllocate >= 0 ? 'text-theme-green' : 'text-theme-red'}`}>
                            ${Math.abs(availableToAllocate).toFixed(2)}
                        </p>
                        <p className="text-xs text-theme-secondary">
                            {availableToAllocate >= 0 ? 'ready to fund categories' : 'overallocated'}
                        </p>
                    </div>
                    <div className="text-2xl">
                        {availableToAllocate >= 0 ? '💰' : <AlertTriangle className="w-6 h-6 text-theme-red" />}
                    </div>
                </div>
            </div>

            {/* Budget Progress Card */}
            <div className="bg-theme-primary rounded-lg p-4 shadow-lg">
                <h3 className="text-sm font-medium text-theme-tertiary mb-1">Budget Progress</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-bold text-theme-blue">
                            ${totalPlanned.toFixed(2)}
                        </p>
                        <p className="text-xs text-theme-secondary">
                            of ${currentPay.toFixed(2)} planned ({budgetProgress.toFixed(0)}%)
                        </p>
                    </div>
                    <div className="text-2xl">
                        📊
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-theme-tertiary rounded-full h-2 mt-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${budgetProgress > 100 ? 'bg-red-500' :
                            budgetProgress > 90 ? 'bg-yellow-500' :
                                'bg-green-500'
                            }`}
                        style={{ width: `${Math.min(100, budgetProgress)}%` }}
                    />
                </div>
            </div>

            {/* Urgent Items Card */}
            <div className="bg-theme-primary rounded-lg p-4 shadow-lg">
                <h3 className="text-sm font-medium text-theme-tertiary mb-1">Needs Attention</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-2xl font-bold ${urgentItems > 0 ? 'text-theme-red' : 'text-theme-green'}`}>
                            {urgentItems}
                        </p>
                        <p className="text-xs text-theme-secondary">
                            {urgentItems > 0 ? 'items need funding soon' : 'all caught up!'}
                        </p>
                    </div>
                    <div className="text-2xl">
                        {urgentItems > 0 ? '⚠️' : '✅'}
                    </div>
                </div>

                {urgentItems > 0 && (
                    <div className="mt-2">
                        <div className="text-xs text-theme-red font-medium">
                            {urgentItems === 1 ? 'Critical deadline approaching' : `${urgentItems} critical deadlines`}
                        </div>
                    </div>
                )}
            </div>

            {/* Budget Buddy Pet Card */}
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
                {urgentItems > 0 && (
                    <div className="text-xs text-theme-red mt-1 flex items-center">
                        ⚠️ {urgentItems} urgent items
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