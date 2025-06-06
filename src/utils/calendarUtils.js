export const generatePaycheckDates = (paySchedule) => {
    const dates = [];
    const [year, month, day] = paySchedule.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(startDate);
    const daysBetween = paySchedule.frequency === 'bi-weekly' ? 14 : 30;

    // Move currentDate to first future paycheck
    let safetyCount = 0;
    while (currentDate < today && safetyCount < 100) {
        currentDate.setDate(currentDate.getDate() + daysBetween);
        safetyCount++;
    }

    // Generate next 26 paychecks
    for (let i = 0; i < 26; i++) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + daysBetween);
    }

    return dates;
};

export const generatePaycheckEventsWithSplit = (paySchedule, currentPay, accounts) => {
    const events = [];
    const primaryDates = generatePaycheckDates(paySchedule);

    primaryDates.forEach((date, index) => {
        const primaryAmount = paySchedule.splitPaycheck
            ? paySchedule.primaryAmount
            : currentPay;
        const primaryAccount = accounts.find(acc => acc.id === paySchedule.primaryAccountId);

        // Add primary paycheck
        events.push({
            date: new Date(date),
            type: 'paycheck',
            subtype: 'primary',
            title: paySchedule.splitPaycheck
                ? `${primaryAccount?.name || 'Primary Bank'}`
                : `Paycheck #${index + 1}`,
            amount: primaryAmount,
            description: `${paySchedule.splitPaycheck ? 'Main deposit' : 'Bi-weekly income'
                }: $${primaryAmount.toFixed(2)}${primaryAccount ? ` → ${primaryAccount.name}` : ''
                }`,
            accountId: paySchedule.splitPaycheck ? paySchedule.primaryAccountId : null,
        });

        // Add secondary paycheck if split is enabled
        if (paySchedule.splitPaycheck && paySchedule.secondaryAmount > 0) {
            const secondaryDate = new Date(date);
            secondaryDate.setDate(date.getDate() - paySchedule.secondaryDaysEarly);
            const secondaryAccount = accounts.find(acc => acc.id === paySchedule.secondaryAccountId);

            events.push({
                date: secondaryDate,
                type: 'paycheck',
                subtype: 'secondary',
                title: `${secondaryAccount?.name || 'Secondary Bank'}`,
                amount: paySchedule.secondaryAmount,
                description: `Early deposit: $${paySchedule.secondaryAmount.toFixed(2)} (${paySchedule.secondaryDaysEarly
                    } days early) → ${secondaryAccount?.name || 'Secondary Bank'}`,
                accountId: paySchedule.secondaryAccountId,
            });
        }
    });

    return events.sort((a, b) => a.date - b.date);
};

export const generateCalendarEvents = (
    paySchedule,
    currentPay,
    savingsGoals,
    expenses,
    categories,
    frequencyOptions,
    accounts
) => {
    const events = [];
    const paycheckEvents = generatePaycheckEventsWithSplit(paySchedule, currentPay, accounts);
    events.push(...paycheckEvents);

    // Add goal deadlines
    savingsGoals.forEach(goal => {
        if (goal.targetDate) {
            const [year, month, day] = goal.targetDate.split('-').map(Number);
            const deadline = new Date(year, month - 1, day);

            events.push({
                date: deadline,
                type: 'goal-deadline',
                title: goal.name,
                amount: goal.targetAmount,
                description: `Target: $${goal.targetAmount.toLocaleString()}`,
                category: categories.find(c => c.id === goal.categoryId)?.name,
                isRecurring: false,
                occurrenceNumber: 1,
            });
        }
    });

    // Generate recurring expense due dates
    expenses.forEach(expense => {
        if (expense.dueDate) {
            try {
                const [year, month, day] = expense.dueDate.split('-').map(Number);
                const firstDueDate = new Date(year, month - 1, day);

                if (expense.isRecurringExpense && expense.frequency && expense.frequency !== 'per-paycheck') {
                    const freqData = frequencyOptions.find(f => f.value === expense.frequency);
                    if (freqData && freqData.weeksPerYear > 0) {
                        const daysBetween = Math.round(365 / freqData.weeksPerYear);
                        let currentDate = new Date(firstDueDate);
                        const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                        let occurrenceCount = 1;

                        while (currentDate <= endDate && occurrenceCount <= 8) {
                            events.push({
                                date: new Date(currentDate),
                                type: 'expense-due',
                                title: expense.name,
                                amount: expense.amount,
                                description: `$${expense.amount} due`,
                                category: categories.find(c => c.id === expense.categoryId)?.name,
                                isRecurring: true,
                                occurrenceNumber: occurrenceCount,
                            });

                            currentDate = new Date(currentDate.getTime() + daysBetween * 24 * 60 * 60 * 1000);
                            occurrenceCount++;
                        }
                    }
                } else {
                    // Single occurrence
                    events.push({
                        date: firstDueDate,
                        type: 'expense-due',
                        title: expense.name,
                        amount: expense.amount,
                        description: `$${expense.amount} due`,
                        category: categories.find(c => c.id === expense.categoryId)?.name,
                        isRecurring: false,
                        occurrenceNumber: 1,
                    });
                }
            } catch (error) {
                console.error('Error processing expense date:', expense.name, error);
            }
        }
    });

    return events.sort((a, b) => a.date - b.date);
  };
