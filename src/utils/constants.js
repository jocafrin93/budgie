export const frequencyOptions = [
    { value: 'weekly', label: 'Weekly', weeksPerYear: 52, paychecksPerMonth: 4.33, isRegular: true },
    { value: 'bi-weekly', label: 'Bi-weekly', weeksPerYear: 26, paychecksPerMonth: 2.17, isRegular: true },
    { value: 'every-3-weeks', label: 'Every 3 weeks', weeksPerYear: 17.33, paychecksPerMonth: 1.44, isRegular: false },
    { value: 'monthly', label: 'Monthly', weeksPerYear: 12, paychecksPerMonth: 1, isRegular: true },
    { value: 'every-5-weeks', label: 'Every 5 weeks', weeksPerYear: 10.4, paychecksPerMonth: 0.87, isRegular: false },
    { value: 'every-6-weeks', label: 'Every 6 weeks', weeksPerYear: 8.67, paychecksPerMonth: 0.72, isRegular: false },
    { value: 'every-7-weeks', label: 'Every 7 weeks', weeksPerYear: 7.43, paychecksPerMonth: 0.62, isRegular: false },
    { value: 'bi-monthly', label: 'Every other month', weeksPerYear: 6, paychecksPerMonth: 0.5, isRegular: true },
    { value: 'quarterly', label: 'Quarterly', weeksPerYear: 4, paychecksPerMonth: 0.33, isRegular: true },
    { value: 'semi-annually', label: 'Every 6 months', weeksPerYear: 2, paychecksPerMonth: 0.17, isRegular: true },
    { value: 'annually', label: 'Annually', weeksPerYear: 1, paychecksPerMonth: 0.083, isRegular: true },
    { value: 'per-paycheck', label: 'Per Paycheck (Direct)', weeksPerYear: 26, paychecksPerMonth: 2.17, isRegular: true }
];

export const priorityColors = {
    essential: "border-red-400 bg-red-100 text-red-900",
    important: "border-yellow-400 bg-yellow-100 text-yellow-900",
    "nice-to-have": "border-green-400 bg-green-100 text-green-900",
};

export const categoryColors = [
    "bg-gradient-to-r from-purple-500 to-pink-500",
    "bg-gradient-to-r from-pink-500 to-blue-500",
    "bg-gradient-to-r from-orange-500 to-red-600",
    "bg-gradient-to-r from-green-500 to-yellow-400",
    "bg-gradient-to-r from-pink-500 to-red-500",
    "bg-gradient-to-r from-yellow-400 to-orange-500",
    "bg-gradient-to-r from-purple-600 to-teal-500",
    "bg-gradient-to-r from-violet-600 to-purple-800",
];

