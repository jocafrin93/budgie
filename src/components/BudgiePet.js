import React, { useState, useEffect } from 'react';
import { Heart, Star, Zap, Target } from 'lucide-react';

const BudgiePet = ({
    calculations,
    timeline,
    expenses = [],
    savingsGoals = [],
    remainingIncome = 0
}) => {
    const [petMood, setPetMood] = useState('happy');
    const [petStage, setPetStage] = useState('chick');
    const [isAnimating, setIsAnimating] = useState(false);
    const [showMessage, setShowMessage] = useState('');

    // Calculate pet stats based on financial health
    const calculatePetStats = () => {
        const totalItems = expenses.length + savingsGoals.length;
        const fundedItems = expenses.filter(e => e.isFullyFunded).length +
            savingsGoals.filter(g => g.isFullyFunded).length;
        const activeItems = expenses.filter(e => e.priorityState === 'active').length +
            savingsGoals.filter(g => g.priorityState === 'active').length;

        const fundingPercentage = totalItems > 0 ? (fundedItems / totalItems) * 100 : 0;
        const budgetHealth = remainingIncome >= 0 ? 100 : Math.max(0, 100 + (remainingIncome / 100));
        const criticalItems = timeline?.timelines?.summary?.critical || 0;

        return {
            fundingPercentage,
            budgetHealth,
            criticalItems,
            totalItems,
            fundedItems,
            activeItems
        };
    };

    const stats = calculatePetStats();

    // Determine pet mood and stage
    useEffect(() => {
        const { fundingPercentage, budgetHealth, criticalItems } = stats;

        // Determine mood
        if (criticalItems > 2) {
            setPetMood('sick');
            setShowMessage("I'm worried about those deadlines! 😰");
        } else if (budgetHealth < 50) {
            setPetMood('sad');
            setShowMessage("The budget is looking tight... 😔");
        } else if (fundingPercentage > 75) {
            setPetMood('excited');
            setShowMessage("Wow! Look at all those funded goals! 🎉");
        } else if (fundingPercentage > 50) {
            setPetMood('happy');
            setShowMessage("Great progress on our goals! 😊");
        } else if (fundingPercentage < 25) {
            setPetMood('sleepy');
            setShowMessage("I could use some goal progress... 😴");
        } else {
            setPetMood('neutral');
            setShowMessage("Keep up the good work! 🐣");
        }

        // Determine growth stage
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

        // Clear message after 3 seconds
        const timer = setTimeout(() => setShowMessage(''), 3000);
        return () => clearTimeout(timer);
    }, [stats.fundingPercentage, stats.budgetHealth, stats.criticalItems]);

    // Animation trigger
    const triggerAnimation = () => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
    };

    // Pet SVG based on mood and stage
    const getPetSVG = () => {
        const size = petStage === 'chick' ? 40 : petStage === 'child' ? 50 : petStage === 'teen' ? 60 : petStage === 'adult' ? 70 : 80;
        const bodyColor = petMood === 'sick' ? '#94a3b8' : petMood === 'sad' ? '#a1a1aa' : '#fbbf24';
        const eyeState = petMood === 'sleepy' ? 'closed' : 'open';
        const blushColor = petMood === 'excited' ? '#f87171' : 'transparent';

        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                className={`transition-all duration-500 ${isAnimating ? 'animate-bounce' : ''}`}
            >
                {/* Body */}
                <ellipse cx="50" cy="65" rx="25" ry="20" fill={bodyColor} />

                {/* Head */}
                <circle cx="50" cy="35" r="18" fill={bodyColor} />

                {/* Beak */}
                <polygon points="50,42 45,47 55,47" fill="#f97316" />

                {/* Eyes */}
                {eyeState === 'open' ? (
                    <>
                        <circle cx="45" cy="32" r="3" fill="#1f2937" />
                        <circle cx="55" cy="32" r="3" fill="#1f2937" />
                        <circle cx="46" cy="31" r="1" fill="white" />
                        <circle cx="56" cy="31" r="1" fill="white" />
                    </>
                ) : (
                    <>
                        <line x1="42" y1="32" x2="48" y2="32" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                        <line x1="52" y1="32" x2="58" y2="32" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                    </>
                )}

                {/* Blush */}
                <circle cx="38" cy="38" r="4" fill={blushColor} opacity="0.6" />
                <circle cx="62" cy="38" r="4" fill={blushColor} opacity="0.6" />

                {/* Wings */}
                <ellipse cx="35" cy="55" rx="8" ry="12" fill={bodyColor} opacity="0.8" />
                <ellipse cx="65" cy="55" rx="8" ry="12" fill={bodyColor} opacity="0.8" />

                {/* Tail feathers (grow with stage) */}
                {petStage !== 'chick' && (
                    <ellipse cx="50" cy="85" rx="15" ry="8" fill={bodyColor} opacity="0.7" />
                )}

                {/* Crown (master stage only) */}
                {petStage === 'master' && (
                    <polygon points="50,15 48,20 52,20" fill="#ffd700" />
                )}

                {/* Mood indicators */}
                {petMood === 'sick' && (
                    <text x="50" y="10" textAnchor="middle" fontSize="12" fill="#ef4444">😷</text>
                )}
                {petMood === 'excited' && (
                    <text x="50" y="10" textAnchor="middle" fontSize="12">✨</text>
                )}
            </svg>
        );
    };

    const getStageLabel = () => {
        const stages = {
            chick: '🐣 Baby Budgie',
            child: '🐤 Young Budgie',
            teen: '🦜 Teen Budgie',
            adult: '🦜 Adult Budgie',
            master: '👑 Master Budgie'
        };
        return stages[petStage];
    };

    const getMoodColor = () => {
        const colors = {
            happy: 'text-green-500',
            excited: 'text-yellow-500',
            neutral: 'text-blue-500',
            sad: 'text-gray-500',
            sleepy: 'text-purple-500',
            sick: 'text-red-500'
        };
        return colors[petMood];
    };

    return (
        <div className="bg-theme-primary rounded-lg p-4 shadow-lg border border-theme-primary">
            <div className="text-center">
                {/* Pet Display */}
                <div
                    className="flex justify-center mb-3 cursor-pointer"
                    onClick={triggerAnimation}
                >
                    {getPetSVG()}
                </div>

                {/* Pet Info */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-theme-primary">
                        {getStageLabel()}
                    </div>

                    {/* Health Stats */}
                    <div className="flex justify-center space-x-3 text-xs">
                        <div className="flex items-center space-x-1">
                            <Heart className={`w-3 h-3 ${getMoodColor()}`} />
                            <span className="text-theme-secondary">
                                {Math.round(stats.fundingPercentage)}%
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3 text-theme-blue" />
                            <span className="text-theme-secondary">
                                {stats.fundedItems}/{stats.totalItems}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, stats.fundingPercentage)}%` }}
                        />
                    </div>

                    {/* Pet Message */}
                    {showMessage && (
                        <div className="bg-theme-secondary p-2 rounded text-xs text-theme-primary border border-theme-primary animate-fade-in">
                            {showMessage}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex justify-center space-x-2 mt-3">
                        {stats.criticalItems > 0 && (
                            <div className="flex items-center text-xs text-red-500">
                                <Zap className="w-3 h-3 mr-1" />
                                {stats.criticalItems} urgent
                            </div>
                        )}
                        {stats.fundingPercentage >= 100 && (
                            <div className="flex items-center text-xs text-yellow-500">
                                <Star className="w-3 h-3 mr-1" />
                                All funded!
                            </div>
                        )}
                    </div>

                    {/* Interaction Hint */}
                    <div className="text-xs text-theme-tertiary">
                        Click me to play! 🎮
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default BudgiePet;