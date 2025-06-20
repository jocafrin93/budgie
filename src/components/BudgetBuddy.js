/**
 * BudgetBuddy component
 * A gamified representation of budget health with a pet that evolves based on funding progress
 */
import React, { useState, useEffect } from 'react';

const BudgetBuddy = ({
  planningItems = [],
  availableToAllocate = 0,
  urgentItems = 0,
  className = '',
}) => {
  // Calculate pet stats
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
    const budgetHealth = availableToAllocate >= 0 ? 100 : Math.max(0, 100 + (availableToAllocate / 100));

    return { fundingPercentage, budgetHealth, totalItems, fundedItems };
  };

  const stats = calculatePetStats();

  // Pet state
  const [petMood, setPetMood] = useState('happy');
  const [petStage, setPetStage] = useState('chick');
  const [isAnimating, setIsAnimating] = useState(false);

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

  // Pet SVG rendering
  const getCompactPetSVG = () => {
    // Base styles for different stages
    const stageStyles = {
      chick: { width: 30, height: 30, color: '#FFD54F' },
      child: { width: 32, height: 32, color: '#FFCA28' },
      teen: { width: 34, height: 34, color: '#FFC107' },
      adult: { width: 36, height: 36, color: '#FFB300' },
      master: { width: 38, height: 38, color: '#FFA000' },
    };

    // Animation class based on state
    const animationClass = isAnimating ? 'animate-bounce' : '';

    // SVG for the pet (simplified version)
    return (
      <div 
        className={`${animationClass} transition-all duration-300`} 
        style={{ 
          width: stageStyles[petStage].width, 
          height: stageStyles[petStage].height 
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          fill={stageStyles[petStage].color}
          className="drop-shadow-md"
        >
          {/* Simple bird shape */}
          <circle cx="50" cy="50" r="40" />
          <circle cx="65" cy="40" r="5" fill="black" />
          <path d="M75,50 Q90,60 75,70" stroke="black" strokeWidth="3" fill="none" />
          {petMood === 'happy' && <path d="M40,60 Q50,70 60,60" stroke="black" strokeWidth="3" fill="none" />}
          {petMood === 'sad' && <path d="M40,70 Q50,60 60,70" stroke="black" strokeWidth="3" fill="none" />}
          {petMood === 'excited' && <path d="M40,60 Q50,75 60,60" stroke="black" strokeWidth="3" fill="none" />}
          {petMood === 'sleepy' && <path d="M40,65 Q50,65 60,65" stroke="black" strokeWidth="3" fill="none" />}
          {petMood === 'sick' && <path d="M40,65 Q50,55 60,65" stroke="black" strokeWidth="3" fill="none" />}
          {petMood === 'neutral' && <path d="M40,65 Q50,65 60,65" stroke="black" strokeWidth="3" fill="none" />}
        </svg>
      </div>
    );
  };

  // Helper functions for pet status
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

  // Handle pet interaction
  const handlePetClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div 
      className={`bg-theme-primary rounded-lg p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${className}`}
      onClick={handlePetClick}
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

      {/* Status indicators */}
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
  );
};

export default BudgetBuddy;