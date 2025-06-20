/**
 * GoalFieldGroup component
 * A specialized field group for goal calculations where 2 of 3 fields can be entered
 * and the third is calculated automatically
 */
import React, { useEffect, useState } from 'react';
import CurrencyField from './CurrencyField';
import DateField from './DateField';

const GoalFieldGroup = ({
  targetAmount,
  targetDate,
  monthlyContribution,
  onTargetAmountChange,
  onTargetDateChange,
  onMonthlyContributionChange,
  alreadySaved = 0,
  className = '',
}) => {
  // Track which fields have been modified by the user
  const [modifiedFields, setModifiedFields] = useState({
    targetAmount: !!targetAmount,
    targetDate: !!targetDate,
    monthlyContribution: !!monthlyContribution,
  });

  // Handle target amount change
  const handleTargetAmountChange = (e) => {
    setModifiedFields(prev => ({ ...prev, targetAmount: true }));
    if (onTargetAmountChange) {
      onTargetAmountChange(e);
    }
  };

  // Handle target date change
  const handleTargetDateChange = (e) => {
    setModifiedFields(prev => ({ ...prev, targetDate: true }));
    if (onTargetDateChange) {
      onTargetDateChange(e);
    }
  };

  // Handle monthly contribution change
  const handleMonthlyContributionChange = (e) => {
    setModifiedFields(prev => ({ ...prev, monthlyContribution: true }));
    if (onMonthlyContributionChange) {
      onMonthlyContributionChange(e);
    }
  };

  // Auto-calculate the third field when two fields are provided
  useEffect(() => {
    const fieldsModified = Object.values(modifiedFields).filter(Boolean).length;
    
    // Only auto-calculate when exactly 2 fields have been modified
    if (fieldsModified === 2) {
      const remainingAmount = Math.max(0, (parseFloat(targetAmount) || 0) - (parseFloat(alreadySaved) || 0));
      
      // Calculate monthly contribution based on target amount and date
      if (!modifiedFields.monthlyContribution && modifiedFields.targetAmount && modifiedFields.targetDate && remainingAmount > 0) {
        const today = new Date();
        const target = new Date(targetDate);
        
        // Only calculate if the target date is in the future
        if (target > today) {
          const monthsUntilTarget = Math.max(1, (target - today) / (1000 * 60 * 60 * 24 * 30.44));
          const requiredMonthly = remainingAmount / monthsUntilTarget;
          
          if (requiredMonthly > 0 && isFinite(requiredMonthly)) {
            const event = {
              target: {
                value: requiredMonthly.toFixed(2)
              }
            };
            
            if (onMonthlyContributionChange) {
              onMonthlyContributionChange(event);
            }
          }
        }
      }
      
      // Calculate target amount based on monthly contribution and date
      if (!modifiedFields.targetAmount && modifiedFields.monthlyContribution && modifiedFields.targetDate) {
        const today = new Date();
        const target = new Date(targetDate);
        
        // Only calculate if the target date is in the future
        if (target > today) {
          const monthsUntilTarget = Math.max(1, (target - today) / (1000 * 60 * 60 * 24 * 30.44));
          const calculatedAmount = (parseFloat(monthlyContribution) || 0) * monthsUntilTarget + (parseFloat(alreadySaved) || 0);
          
          if (calculatedAmount > 0 && isFinite(calculatedAmount)) {
            const event = {
              target: {
                value: calculatedAmount.toFixed(2)
              }
            };
            
            if (onTargetAmountChange) {
              onTargetAmountChange(event);
            }
          }
        }
      }
      
      // Calculate target date based on target amount and monthly contribution
      if (!modifiedFields.targetDate && modifiedFields.targetAmount && modifiedFields.monthlyContribution) {
        const monthlyAmount = parseFloat(monthlyContribution) || 0;
        
        // Only calculate if monthly contribution is greater than zero
        if (monthlyAmount > 0) {
          const remainingAmount = Math.max(0, (parseFloat(targetAmount) || 0) - (parseFloat(alreadySaved) || 0));
          const monthsNeeded = remainingAmount / monthlyAmount;
          
          if (monthsNeeded > 0 && isFinite(monthsNeeded)) {
            const today = new Date();
            const targetDate = new Date(today);
            targetDate.setMonth(today.getMonth() + Math.ceil(monthsNeeded));
            
            const event = {
              target: {
                value: targetDate.toISOString().split('T')[0]
              }
            };
            
            if (onTargetDateChange) {
              onTargetDateChange(event);
            }
          }
        }
      }
    }
  }, [
    targetAmount, 
    targetDate, 
    monthlyContribution, 
    alreadySaved, 
    modifiedFields, 
    onTargetAmountChange, 
    onTargetDateChange, 
    onMonthlyContributionChange
  ]);

  return (
    <div className={`space-y-4 ${className}`}>
      <CurrencyField
        name="targetAmount"
        label="Target Amount"
        value={targetAmount}
        onChange={handleTargetAmountChange}
        placeholder="Total goal amount"
        required
        hint={!modifiedFields.targetAmount && modifiedFields.monthlyContribution && modifiedFields.targetDate ? 
          "Auto-calculated based on monthly contribution and target date" : ""}
      />
      
      <DateField
        name="targetDate"
        label="Target Date"
        value={targetDate}
        onChange={handleTargetDateChange}
        required
        hint={!modifiedFields.targetDate && modifiedFields.targetAmount && modifiedFields.monthlyContribution ? 
          "Auto-calculated based on target amount and monthly contribution" : ""}
      />
      
      <CurrencyField
        name="monthlyContribution"
        label="Monthly Contribution"
        value={monthlyContribution}
        onChange={handleMonthlyContributionChange}
        placeholder="Amount per month"
        hint={!modifiedFields.monthlyContribution && modifiedFields.targetAmount && modifiedFields.targetDate ? 
          "Auto-calculated based on target amount and date" : ""}
      />
    </div>
  );
};

export default GoalFieldGroup;