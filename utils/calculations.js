export const calculateBiweeklyAllocation = (expense, roundingOption, frequencyOptions) => {
    if (expense.priorityState === "paused" || expense.priorityState === "complete") return 0;

    const { amount, frequency, alreadySaved = 0 } = expense;
    const remainingAmount = Math.max(0, amount - alreadySaved);

    if (remainingAmount <= 0) return 0;

    if (frequency === "per-paycheck") {
        if (roundingOption === 0) return remainingAmount;
        return Math.ceil(remainingAmount / roundingOption) * roundingOption;
    }

    const freqData = frequencyOptions.find((f) => f.value === frequency);
    if (!freqData) return 0;

    const yearlyAmount = amount * freqData.weeksPerYear;
    const biweeklyAmount = yearlyAmount / 26;
    const adjustedBiweeklyAmount = (remainingAmount / amount) * biweeklyAmount;

    if (roundingOption === 0) return adjustedBiweeklyAmount;
    return Math.ceil(adjustedBiweeklyAmount / roundingOption) * roundingOption;
};

export const calculateGoalBiweeklyAllocation = (goal, roundingOption) => {
    if (goal.priorityState === "paused" || goal.priorityState === "complete") return 0;

    const { targetAmount, monthlyContribution, alreadySaved = 0 } = goal;
    const remainingAmount = Math.max(0, targetAmount - alreadySaved);

    if (remainingAmount <= 0) return 0;

    const monthlyAmount = monthlyContribution;
    const biweeklyAmount = (monthlyAmount * 12) / 26;

    if (roundingOption === 0) return biweeklyAmount;
    return Math.ceil(biweeklyAmount / roundingOption) * roundingOption;
};

export const generatePaycheckDates = (paySchedule) => {
    const dates = [];
    const [year, month, day] = paySchedule.startDate.split("-").map(Number);
    const startDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(startDate);
    const daysBetween = paySchedule.frequency === "bi-weekly" ? 14 : 30;

    let safetyCount = 0;
    while (currentDate < today && safetyCount < 100) {
        currentDate.setDate(currentDate.getDate() + daysBetween);
        safetyCount++;
    }

    for (let i = 0; i < 26; i++) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + daysBetween);
    }

    return dates;
  };