// Enhanced GoalFieldGroup.js with percentage support for monthly contribution

import { addMonths, format } from 'date-fns';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { dollarToPercentage, percentageToDollar } from '../../utils/moneyUtils';
import CurrencyField from './CurrencyField';
import DateField from './DateField';
import PercentageField from './PercentageField';

/**
 * Component for managing goal-specific form fields with automatic calculations
 * Enhanced to support percentage-based monthly contributions
 */
const GoalFieldGroup = ({ formValues, onChange, errors = {}, currentPay = 0 }) => {
  // Track which fields have been explicitly modified by the user
  const [modifiedFields, setModifiedFields] = useState({
    targetAmount: false,
    targetDate: false,
    monthlyContribution: false
  });

  // Track whether monthly contribution should be shown as percentage
  const [usePercentageForMonthly, setUsePercentageForMonthly] = useState(false);

  // Use internal state for displayed values to ensure immediate UI updates
  const [displayValues, setDisplayValues] = useState({
    targetAmount: formValues.targetAmount || '',
    targetDate: formValues.targetDate || format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    monthlyContribution: formValues.monthlyContribution || '',
    monthlyPercentage: formValues.monthlyPercentage || ''
  });

  // Track which field is being auto-calculated
  const [calculatedField, setCalculatedField] = useState(null);

  // Track if monthly contribution has a value to show recalculation options
  const [showRecalculationOptions, setShowRecalculationOptions] = useState(false);

  // Use refs to prevent calculation loops
  const isCalculating = useRef(false);

  // Update display values when external form values change
  useEffect(() => {
    if (!isCalculating.current) {
      setDisplayValues({
        targetAmount: formValues.targetAmount || '',
        targetDate: formValues.targetDate || format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
        monthlyContribution: formValues.monthlyContribution || '',
        monthlyPercentage: formValues.monthlyPercentage || ''
      });
    }
  }, [formValues]);

  // Update recalculation options visibility when monthly contribution changes
  useEffect(() => {
    // Show recalculation options when monthly contribution has a value
    const hasMonthlyValue = parseFloat(displayValues.monthlyContribution) > 0;
    setShowRecalculationOptions(calculatedField === 'monthlyContribution' || hasMonthlyValue);
  }, [displayValues.monthlyContribution, calculatedField]);

  // Handle manual field changes
  const handleFieldChange = (fieldName, value) => {
    console.log(`GoalFieldGroup: ${fieldName} changed to:`, value);

    // Mark field as modified
    setModifiedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Update display values
    setDisplayValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Propagate change to parent form
    onChange({
      target: {
        name: fieldName,
        value: value
      }
    });
  };

  // Handle percentage/dollar toggle for monthly contribution
  const handleMonthlyModeToggle = (usePercentage) => {
    if (usePercentage && !usePercentageForMonthly && displayValues.monthlyContribution && currentPay > 0) {
      // Convert dollar to percentage
      const convertedPercentage = dollarToPercentage(parseFloat(displayValues.monthlyContribution), currentPay);
      setDisplayValues(prev => ({
        ...prev,
        monthlyPercentage: convertedPercentage
      }));
      onChange({
        target: {
          name: 'monthlyPercentage',
          value: convertedPercentage
        }
      });
    } else if (!usePercentage && usePercentageForMonthly && displayValues.monthlyPercentage && currentPay > 0) {
      // Convert percentage to dollar
      const convertedAmount = percentageToDollar(parseFloat(displayValues.monthlyPercentage), currentPay);
      setDisplayValues(prev => ({
        ...prev,
        monthlyContribution: convertedAmount
      }));
      onChange({
        target: {
          name: 'monthlyContribution',
          value: convertedAmount
        }
      });
    }
    setUsePercentageForMonthly(usePercentage);
  };

  // Handle recalculation clicks
  const handleRecalculate = (fieldToCalculate) => {
    console.log(`Recalculating ${fieldToCalculate}...`);
    setCalculatedField(fieldToCalculate);

    // Reset the modified flag for the field we're about to calculate
    setModifiedFields(prev => ({
      ...prev,
      [fieldToCalculate]: false
    }));
  };

  // Auto-calculation logic
  useEffect(() => {
    const targetAmount = parseFloat(displayValues.targetAmount) || 0;
    const monthlyContribution = parseFloat(displayValues.monthlyContribution) || 0;
    const targetDate = displayValues.targetDate ?
      new Date(displayValues.targetDate) : addMonths(new Date(), 12);

    // Count explicitly modified fields with valid values
    const hasTargetAmount = modifiedFields.targetAmount && targetAmount > 0;
    const hasMonthlyContribution = modifiedFields.monthlyContribution && monthlyContribution > 0;
    const hasTargetDate = modifiedFields.targetDate && targetDate > new Date();

    // Count how many fields have been explicitly modified by user and have valid values
    const filledFieldCount = [hasTargetAmount, hasMonthlyContribution, hasTargetDate].filter(Boolean).length;

    // Only calculate if exactly 2 fields have values
    if (filledFieldCount === 2) {
      isCalculating.current = true;

      try {
        // Calculate monthly contribution
        if (!hasMonthlyContribution && hasTargetAmount && hasTargetDate) {
          setCalculatedField('monthlyContribution');

          // Calculate months between now and target date
          const now = new Date();
          const monthsUntilTarget = Math.max(1,
            (targetDate.getFullYear() - now.getFullYear()) * 12 +
            (targetDate.getMonth() - now.getMonth())
          );

          // Calculate monthly contribution
          const calculatedContribution = targetAmount / monthsUntilTarget;

          // Update both display and parent form
          const formattedValue = calculatedContribution.toFixed(2);
          setDisplayValues(prev => ({
            ...prev,
            monthlyContribution: formattedValue
          }));

          onChange({
            target: {
              name: 'monthlyContribution',
              value: formattedValue
            }
          });
        }

        // Calculate target amount
        else if (!hasTargetAmount && hasMonthlyContribution && hasTargetDate) {
          setCalculatedField('targetAmount');

          // Calculate months between now and target date
          const now = new Date();
          const monthsUntilTarget = Math.max(1,
            (targetDate.getFullYear() - now.getFullYear()) * 12 +
            (targetDate.getMonth() - now.getMonth())
          );

          // Calculate target amount
          const calculatedAmount = monthlyContribution * monthsUntilTarget;

          // Update both display and parent form
          const formattedValue = calculatedAmount.toFixed(2);
          setDisplayValues(prev => ({
            ...prev,
            targetAmount: formattedValue
          }));

          onChange({
            target: {
              name: 'targetAmount',
              value: formattedValue
            }
          });
        }

        // Calculate target date
        else if (!hasTargetDate && hasTargetAmount && hasMonthlyContribution) {
          setCalculatedField('targetDate');

          // Calculate months needed
          const monthsNeeded = Math.ceil(targetAmount / monthlyContribution);

          // Calculate future date
          const calculatedDate = addMonths(new Date(), monthsNeeded);
          const formattedDate = format(calculatedDate, 'yyyy-MM-dd');

          // Update both display and parent form
          setDisplayValues(prev => ({
            ...prev,
            targetDate: formattedDate
          }));

          onChange({
            target: {
              name: 'targetDate',
              value: formattedDate
            }
          });
        }
      } catch (error) {
        console.error("Error in calculation:", error);
      } finally {
        // Reset calculation flag after a short delay to prevent loops
        setTimeout(() => {
          isCalculating.current = false;
        }, 100);
      }
    } else {
      // If not exactly 2 fields filled, clear calculated field marker
      setCalculatedField(null);
    }
  }, [displayValues, modifiedFields, onChange]);

  // Get hint text for fields
  const getFieldHint = (fieldName) => {
    if (calculatedField === fieldName) {
      return "Auto-calculated";
    }
    return "";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium mt-4">Goal Details</h3>

      <div className="bg-theme-secondary border border-theme-secondary p-3 mb-4 rounded-md text-sm text-theme-secondary">
        <div className="mt-1 text-xs">
          <span className="text-red-500">*</span> Required field
        </div>
        <div className="mt-1">
          Fill in two fields to automatically calculate the third.
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center mb-1">
          <label htmlFor="targetAmount" className="text-sm font-medium text-theme-primary">
            Target Amount <span className="text-red-500">*</span>
          </label>
          {showRecalculationOptions && (
            <button
              type="button"
              className="ml-2 p-1 rounded focus:outline-none text-theme-primary hover:bg-theme-hover"
              onClick={() => handleRecalculate('targetAmount')}
              title="Click to recalculate target amount based on monthly contribution and date"
            >
              <RefreshCcw size={16} />
            </button>
          )}
        </div>
        <CurrencyField
          name="targetAmount"
          value={displayValues.targetAmount}
          error={errors.targetAmount}
          hint={getFieldHint('targetAmount')}
          onChange={(e) => handleFieldChange('targetAmount', e.target.value)}
          hideLabel={true}
        />
      </div>

      <div className="relative">
        <div className="flex items-center mb-1">
          <label htmlFor="targetDate" className="text-sm font-medium text-theme-primary">
            Target Date
          </label>
          {showRecalculationOptions && (
            <button
              type="button"
              className="ml-2 p-1 rounded focus:outline-none text-theme-primary hover:bg-theme-hover"
              onClick={() => handleRecalculate('targetDate')}
              title="Click to recalculate target date based on monthly contribution and amount"
            >
              <RefreshCcw size={16} />
            </button>
          )}
        </div>
        <DateField
          name="targetDate"
          value={displayValues.targetDate}
          error={errors.targetDate}
          hint={getFieldHint('targetDate')}
          onChange={(e) => handleFieldChange('targetDate', e.target.value)}
          hideLabel={true}
        />
      </div>

      {/* Enhanced Monthly Contribution with Percentage Support */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-theme-primary">
          How much will you save each month?
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleMonthlyModeToggle(false)}
            className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${!usePercentageForMonthly
              ? 'btn-primary'
              : 'bg-theme-secondary text-theme-primary hover:bg-theme-hover'
              }`}
          >
            <span className="mr-1">💰</span>
            Dollar Amount
          </button>
          <button
            type="button"
            onClick={() => handleMonthlyModeToggle(true)}
            className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${usePercentageForMonthly
              ? 'btn-success'
              : 'bg-theme-secondary text-theme-primary hover:bg-theme-hover'
              }`}
          >
            <span className="mr-1">📊</span>
            % of Paycheck
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center mb-1">
          <label className="text-sm font-medium text-theme-primary">
            Monthly Contribution
          </label>
          {showRecalculationOptions && (
            <button
              type="button"
              className="ml-2 p-1 rounded focus:outline-none text-theme-primary hover:bg-theme-hover"
              onClick={() => handleRecalculate('monthlyContribution')}
              title="Click to recalculate monthly contribution based on target amount and date"
            >
              <RefreshCcw size={16} />
            </button>
          )}
        </div>

        {usePercentageForMonthly ? (
          <PercentageField
            name="monthlyPercentage"
            value={displayValues.monthlyPercentage}
            error={errors.monthlyContribution}
            hint={currentPay > 0 ? `Approx. $${percentageToDollar(displayValues.monthlyPercentage || 0, currentPay).toFixed(2)} per month` : getFieldHint('monthlyContribution')}
            onChange={(e) => {
              handleFieldChange('monthlyPercentage', e.target.value);
              // Also update the monthlyContribution field with converted value
              if (currentPay > 0) {
                const dollarAmount = percentageToDollar(e.target.value, currentPay);
                handleFieldChange('monthlyContribution', dollarAmount);
              }
            }}
            hideLabel={true}
          />
        ) : (
          <CurrencyField
            name="monthlyContribution"
            value={displayValues.monthlyContribution}
            error={errors.monthlyContribution}
            hint={currentPay > 0 ? `Approx. ${dollarToPercentage(displayValues.monthlyContribution || 0, currentPay).toFixed(1)}% of income` : getFieldHint('monthlyContribution')}
            onChange={(e) => {
              handleFieldChange('monthlyContribution', e.target.value);
              // Also update the monthlyPercentage field with converted value
              if (currentPay > 0) {
                const percentageAmount = dollarToPercentage(e.target.value, currentPay);
                handleFieldChange('monthlyPercentage', percentageAmount);
              }
            }}
            hideLabel={true}
          />
        )}
      </div>
    </div>
  );
};

export default GoalFieldGroup;