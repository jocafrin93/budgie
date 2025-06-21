import { addMonths, format } from 'date-fns';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CurrencyField from './CurrencyField';
import DateField from './DateField';

/**
 * Component for managing goal-specific form fields with automatic calculations
 */
const GoalFieldGroup = ({ formValues, onChange, errors = {} }) => {
  // Track which fields have been explicitly modified by the user
  const [modifiedFields, setModifiedFields] = useState({
    targetAmount: false,
    targetDate: false,
    monthlyContribution: false
  });

  // Use internal state for displayed values to ensure immediate UI updates
  const [displayValues, setDisplayValues] = useState({
    targetAmount: formValues.targetAmount || '',
    targetDate: formValues.targetDate || format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    monthlyContribution: formValues.monthlyContribution || ''
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
        monthlyContribution: formValues.monthlyContribution || ''
      });
    }
  }, [formValues]);

  // Update recalculation options visibility when monthly contribution changes
  useEffect(() => {
    // Show recalculation options when monthly contribution has a value
    const hasMonthlyValue = parseFloat(displayValues.monthlyContribution) > 0;
    setShowRecalculationOptions(calculatedField === 'monthlyContribution' || hasMonthlyValue);
  }, [displayValues.monthlyContribution, calculatedField]);

  // Handle manual recalculation when refresh icon is clicked
  const handleRecalculate = (fieldToRecalculate) => {
    console.log(`Manually recalculating ${fieldToRecalculate}`);

    // Clear the field to be recalculated
    setDisplayValues(prev => ({
      ...prev,
      [fieldToRecalculate]: ''
    }));

    // Reset modified state for the field to recalculate
    setModifiedFields(prev => ({
      ...prev,
      [fieldToRecalculate]: false
    }));

    // Notify parent form
    onChange({
      target: {
        name: fieldToRecalculate,
        value: ''
      }
    });

    // Force a calculation check
    isCalculating.current = false;
  };

  // Handle user input for any field
  const handleFieldChange = (fieldName, value) => {
    console.log(`User changed ${fieldName} to:`, value);

    // Count how many fields currently have values
    const targetAmount = parseFloat(displayValues.targetAmount) || 0;
    const monthlyContribution = parseFloat(displayValues.monthlyContribution) || 0;
    const targetDate = displayValues.targetDate ? new Date(displayValues.targetDate) : null;

    const hasValidValues = {
      targetAmount: targetAmount > 0,
      monthlyContribution: monthlyContribution > 0,
      targetDate: targetDate && targetDate > new Date()
    };

    const filledFieldCount = Object.values(hasValidValues).filter(Boolean).length;

    // Mark this field as explicitly modified by user
    setModifiedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Special handling for changing the calculated field (monthly contribution)
    if (calculatedField === fieldName) {
      console.log(`User changed the calculated field (${fieldName})`);

      // Just update the value without auto-recalculating anything
      setDisplayValues(prev => ({
        ...prev,
        [fieldName]: value
      }));

      // Notify parent form
      onChange({
        target: {
          name: fieldName,
          value
        }
      });
    }
    // If user changed a field and all three fields have values, 
    // clear the last calculated field to allow recalculation
    else if (filledFieldCount === 3 && calculatedField && fieldName !== calculatedField) {
      console.log(`Clearing calculated field: ${calculatedField} to allow recalculation`);

      // Clear the calculated field's value
      setDisplayValues(prev => ({
        ...prev,
        [calculatedField]: '',
        [fieldName]: value
      }));

      // Reset modified state for calculated field
      setModifiedFields(prev => ({
        ...prev,
        [calculatedField]: false
      }));

      // Notify parent form of both changes
      onChange({
        target: {
          name: calculatedField,
          value: ''
        }
      });

      onChange({
        target: {
          name: fieldName,
          value
        }
      });

      setCalculatedField(null);
    } else {
      // Normal handling for non-full case
      // Immediately update display value for responsive UI
      setDisplayValues(prev => ({
        ...prev,
        [fieldName]: value
      }));

      // Notify parent form of the change
      onChange({
        target: {
          name: fieldName,
          value
        }
      });
    }

    // Force a fresh calculation check
    isCalculating.current = false;
  };

  // Calculate the third field whenever display values or modified fields change
  useEffect(() => {
    // Skip if already calculating to prevent loops
    if (isCalculating.current) return;

    // Extract field values as numbers
    const targetAmount = parseFloat(displayValues.targetAmount) || 0;
    const monthlyContribution = parseFloat(displayValues.monthlyContribution) || 0;
    const targetDate = displayValues.targetDate ? new Date(displayValues.targetDate) : addMonths(new Date(), 12);

    // Count explicitly modified fields with valid values
    const hasTargetAmount = modifiedFields.targetAmount && targetAmount > 0;
    const hasMonthlyContribution = modifiedFields.monthlyContribution && monthlyContribution > 0;
    const hasTargetDate = modifiedFields.targetDate && targetDate > new Date();

    // Count how many fields have been explicitly modified by user and have valid values
    const filledFieldCount = [hasTargetAmount, hasMonthlyContribution, hasTargetDate].filter(Boolean).length;

    console.log('Checking calculations...', {
      targetAmount,
      monthlyContribution,
      targetDate: displayValues.targetDate,
      modifiedFields,
      calculatedField,
      hasTargetAmount,
      hasMonthlyContribution,
      hasTargetDate,
      filledFieldCount
    });

    // Only calculate if exactly 2 fields have values
    if (filledFieldCount === 2) {
      console.log("Two fields filled, determining which to calculate...");
      isCalculating.current = true;

      try {
        // Calculate monthly contribution
        if (!hasMonthlyContribution && hasTargetAmount && hasTargetDate) {
          console.log("Calculating monthly contribution");
          setCalculatedField('monthlyContribution');

          // Calculate months between now and target date
          const now = new Date();
          const monthsUntilTarget = Math.max(1,
            (targetDate.getFullYear() - now.getFullYear()) * 12 +
            (targetDate.getMonth() - now.getMonth())
          );

          // Calculate monthly contribution
          const calculatedContribution = targetAmount / monthsUntilTarget;
          console.log(`Calculated monthly contribution: $${calculatedContribution.toFixed(2)} (${targetAmount} ÷ ${monthsUntilTarget} months)`);

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
          console.log("Calculating target amount");
          setCalculatedField('targetAmount');

          // Calculate months between now and target date
          const now = new Date();
          const monthsUntilTarget = Math.max(1,
            (targetDate.getFullYear() - now.getFullYear()) * 12 +
            (targetDate.getMonth() - now.getMonth())
          );

          // Calculate target amount
          const calculatedAmount = monthlyContribution * monthsUntilTarget;
          console.log(`Calculated target amount: $${calculatedAmount.toFixed(2)} (${monthlyContribution} × ${monthsUntilTarget} months)`);

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
          console.log("Calculating target date");
          setCalculatedField('targetDate');

          // Calculate months needed
          const monthsNeeded = Math.ceil(targetAmount / monthlyContribution);
          console.log(`Calculated months needed: ${monthsNeeded} months (${targetAmount} ÷ ${monthlyContribution})`);

          // Calculate future date
          const calculatedDate = addMonths(new Date(), monthsNeeded);
          const formattedDate = format(calculatedDate, 'yyyy-MM-dd');
          console.log(`Calculated target date: ${format(calculatedDate, 'MMM dd, yyyy')}`);

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

      <div className="bg-theme-background border border-theme-border p-3 mb-4 rounded-md text-sm text-theme-secondary">
        Fill in two fields to automatically calculate the third.
        <div className="mt-1 text-xs">
          <span className="text-red-500">*</span> Required field
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
              className="ml-2 p-1 rounded focus:outline-none text-theme-primary"
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
              className="ml-2 p-1 rounded focus:outline-none text-theme-primary"
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

      <CurrencyField
        label="Monthly Contribution"
        name="monthlyContribution"
        value={displayValues.monthlyContribution}
        error={errors.monthlyContribution}
        hint={getFieldHint('monthlyContribution')}
        onChange={(e) => handleFieldChange('monthlyContribution', e.target.value)}
      />

    </div>
  );
};

export default GoalFieldGroup;