import { getExpensesFromPlanningItems, getSavingsGoalsFromPlanningItems } from './dataModelUtils';
import { formatCurrency, formatPercentage } from './formatUtils';
import { getFrequencyLabel } from './frequencyUtils';

export const exportToYNAB = ({
    calculations,
    categorizedExpenses,
    planningItems = [],
    currentPay,
    bufferPercentage,
    viewMode,
    frequencyOptions,
}) => {
    // If planningItems are provided, use them instead of categorizedExpenses
    let exportData;

    if (planningItems.length > 0 && !categorizedExpenses) {
        // Convert planningItems to the format expected by the export function
        const expenses = getExpensesFromPlanningItems(planningItems);
        const savingsGoals = getSavingsGoalsFromPlanningItems(planningItems);

        // Group by category
        const categoriesByIdMap = {};

        // Process expenses
        expenses.forEach(expense => {
            if (!categoriesByIdMap[expense.categoryId]) {
                categoriesByIdMap[expense.categoryId] = {
                    name: `Category ${expense.categoryId}`, // Will be replaced with actual name later
                    total: 0,
                    percentage: 0,
                    expenses: [],
                    goals: []
                };
            }

            const expenseWithCalculations = {
                ...expense,
                biweeklyAmount: calculations?.expenseAllocations?.find(a => a.id === expense.id)?.biweeklyAmount || 0,
                percentage: calculations?.expenseAllocations?.find(a => a.id === expense.id)?.percentage || 0,
                isFullyFunded: calculations?.expenseAllocations?.find(a => a.id === expense.id)?.isFullyFunded || false
            };

            categoriesByIdMap[expense.categoryId].expenses.push(expenseWithCalculations);
            categoriesByIdMap[expense.categoryId].total += expenseWithCalculations.biweeklyAmount || 0;
        });

        // Process savings goals
        savingsGoals.forEach(goal => {
            if (!categoriesByIdMap[goal.categoryId]) {
                categoriesByIdMap[goal.categoryId] = {
                    name: `Category ${goal.categoryId}`, // Will be replaced with actual name later
                    total: 0,
                    percentage: 0,
                    expenses: [],
                    goals: []
                };
            }

            const goalWithCalculations = {
                ...goal,
                biweeklyAmount: calculations?.goalAllocations?.find(a => a.id === goal.id)?.biweeklyAmount || 0,
                percentage: calculations?.goalAllocations?.find(a => a.id === goal.id)?.percentage || 0,
                isFullyFunded: calculations?.goalAllocations?.find(a => a.id === goal.id)?.isFullyFunded || false
            };

            categoriesByIdMap[goal.categoryId].goals.push(goalWithCalculations);
            categoriesByIdMap[goal.categoryId].total += goalWithCalculations.biweeklyAmount || 0;
        });

        // Calculate percentages
        Object.values(categoriesByIdMap).forEach(category => {
            category.percentage = currentPay > 0 ? (category.total / currentPay) * 100 : 0;
        });

        exportData = Object.values(categoriesByIdMap);
    } else {
        // Use the provided categorizedExpenses
        exportData = Object.values(categorizedExpenses).map((category) => ({
            category: category.name,
            biweeklyTotal: category.total,
            percentage: category.percentage,
            items: [
                ...category.expenses.map(
                    (exp) =>
                        `${exp.name}: ${viewMode === 'amount'
                            ? formatCurrency(exp.biweeklyAmount)
                            : formatPercentage(exp.percentage)
                        }/paycheck (${exp.amount} ${getFrequencyLabel(exp.frequency).toLowerCase()
                        })${exp.priorityState === 'paused' ? ' [PAUSED]' : ''}${exp.isFullyFunded ? ' [FUNDED]' : ''
                        }`
                ),
                ...category.goals.map(
                    (goal) =>
                        `${goal.name} (Goal): ${viewMode === 'amount'
                            ? formatCurrency(goal.biweeklyAmount)
                            : formatPercentage(goal.percentage)
                        }/paycheck${goal.priorityState === 'paused' ? ' [PAUSED]' : ''}${goal.isFullyFunded ? ' [COMPLETE]' : ''
                        }`
                ),
            ],
        }));
    }

    const exportText =
        `BI-WEEKLY BUDGET BREAKDOWN\n` +
        `Take-home pay: ${formatCurrency(currentPay)}\n` +
        `Total allocations: ${formatCurrency(calculations.totalBiweeklyAllocation)} (${formatPercentage(
            (calculations.totalBiweeklyAllocation / currentPay) * 100
        )})\n` +
        `Buffer (${bufferPercentage}%): ${formatCurrency(calculations.bufferAmount)}\n` +
        `Total with buffer: ${formatCurrency(calculations.totalWithBuffer)} (${formatPercentage(calculations.allocationPercentage)})\n` +
        `Remaining: ${formatCurrency(calculations.remainingIncome)} (${formatPercentage(
            (calculations.remainingIncome / currentPay) * 100
        )})\n\n` +
        exportData
            .map(
                (cat) =>
                    `${cat.category.toUpperCase()} - ${formatCurrency(cat.biweeklyTotal)}/paycheck (${formatPercentage(cat.percentage)})\n${cat.items
                        .map((item) => `• ${item}`)
                        .join('\n')}`
            )
            .join('\n\n');

    // Show visual feedback and try clipboard
    const button = document.querySelector('[data-export-button]');
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Copying...';

        setTimeout(() => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(exportText).then(() => {
                    button.innerHTML = '✅ Copied to Clipboard!';
                    setTimeout(() => button.innerHTML = originalText, 2000);
                }).catch(() => {
                    button.innerHTML = '📋 Click to Copy Again';
                    setTimeout(() => button.innerHTML = originalText, 2000);
                    prompt('Copy this text for YNAB:', exportText);
                });
            } else {
                button.innerHTML = '📋 Manual Copy Required';
                setTimeout(() => button.innerHTML = originalText, 2000);
                prompt('Copy this text for YNAB:', exportText);
            }
        }, 500);
    } else {
        // Fallback if button not found
        if (navigator.clipboard) {
            navigator.clipboard.writeText(exportText).then(() => {
                alert('Budget data copied to clipboard!');
            }).catch(() => {
                prompt('Copy this text for YNAB:', exportText);
            });
        } else {
            prompt('Copy this text for YNAB:', exportText);
        }
    }
};