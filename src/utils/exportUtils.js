export const exportToYNAB = ({
    calculations,
    categorizedExpenses,
    currentPay,
    bufferPercentage,
    viewMode,
    frequencyOptions,
}) => {
    const exportData = Object.values(categorizedExpenses).map((category) => ({
        category: category.name,
        biweeklyTotal: category.total,
        percentage: category.percentage,
        items: [
            ...category.expenses.map(
                (exp) =>
                    `${exp.name}: ${viewMode === 'amount'
                        ? `$${exp.biweeklyAmount.toFixed(2)}`
                        : `${exp.percentage.toFixed(1)}%`
                    }/paycheck (${exp.amount} ${frequencyOptions.find((f) => f.value === exp.frequency)?.label.toLowerCase()
                    })${exp.priorityState === 'paused' ? ' [PAUSED]' : ''}${exp.isFullyFunded ? ' [FUNDED]' : ''
                    }`
            ),
            ...category.goals.map(
                (goal) =>
                    `${goal.name} (Goal): ${viewMode === 'amount'
                        ? `$${goal.biweeklyAmount.toFixed(2)}`
                        : `${goal.percentage.toFixed(1)}%`
                    }/paycheck${goal.priorityState === 'paused' ? ' [PAUSED]' : ''}${goal.isFullyFunded ? ' [COMPLETE]' : ''
                    }`
            ),
        ],
    }));

    const exportText =
        `BI-WEEKLY BUDGET BREAKDOWN\n` +
        `Take-home pay: $${currentPay.toFixed(2)}\n` +
        `Total allocations: $${calculations.totalBiweeklyAllocation.toFixed(2)} (${(
            (calculations.totalBiweeklyAllocation / currentPay) * 100
        ).toFixed(1)}%)\n` +
        `Buffer (${bufferPercentage}%): $${calculations.bufferAmount.toFixed(2)}\n` +
        `Total with buffer: $${calculations.totalWithBuffer.toFixed(2)} (${calculations.allocationPercentage.toFixed(1)}%)\n` +
        `Remaining: $${calculations.remainingIncome.toFixed(2)} (${(
            (calculations.remainingIncome / currentPay) * 100
        ).toFixed(1)}%)\n\n` +
        exportData
            .map(
                (cat) =>
                    `${cat.category.toUpperCase()} - $${cat.biweeklyTotal.toFixed(2)}/paycheck (${cat.percentage.toFixed(1)}%)\n${cat.items
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
