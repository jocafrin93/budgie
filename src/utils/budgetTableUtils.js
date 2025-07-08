// src/utils/budgetTableUtils.js

/**
 * Transform categories and planning items into the format expected by BudgetCategoriesTable
 * @param {Array} categories - Categories from useCategoryManagement
 * @param {Array} planningItems - Planning items from useDataModel
 * @param {Array} accounts - Account data for calculations
 * @returns {Array} Transformed data for the table
 */
export const transformDataForBudgetTable = (categories = [], planningItems = [], accounts = []) => {
    return categories.map(category => {
        // Get planning items for this category
        const categoryItems = planningItems.filter(item =>
            item.categoryId === category.id && item.isActive
        );

        // Calculate totals for the category
        const monthlyNeed = categoryItems.reduce((sum, item) => {
            if (item.type === 'savings-goal') {
                return sum + (item.monthlyContribution || 0);
            } else {
                // For expenses, calculate monthly amount based on frequency
                return sum + calculateMonthlyAmount(item.amount || 0, item.frequency || 'monthly');
            }
        }, 0);

        // Calculate per paycheck amount (assuming bi-weekly)
        const perPaycheck = monthlyNeed / 2.17; // Approximate monthly to bi-weekly conversion

        // Transform sub-items
        const subItems = categoryItems.map(item => ({
            id: item.id,
            parentId: category.id,
            name: item.name,
            amount: item.amount || (item.type === 'savings-goal' ? item.monthlyContribution : 0),
            frequency: item.frequency || 'monthly',
            monthlyNeed: item.type === 'savings-goal'
                ? (item.monthlyContribution || 0)
                : calculateMonthlyAmount(item.amount || 0, item.frequency || 'monthly'),
            perPaycheck: (item.type === 'savings-goal'
                ? (item.monthlyContribution || 0)
                : calculateMonthlyAmount(item.amount || 0, item.frequency || 'monthly')) / 2.17,
            allocated: item.allocated || 0,
            spent: 0, // TODO: Calculate from transactions
            available: (item.allocated || 0) - 0, // allocated - spent
            dueDate: item.dueDate || null,
            paychecksUntilDue: item.dueDate ? calculatePaychecksUntilDue(item.dueDate) : null,
            isSubItem: true,
            isActive: item.isActive || true,
            type: item.type
        }));

        return {
            id: category.id,
            name: category.name,
            type: category.type || 'multiple',
            monthlyNeed,
            perPaycheck,
            allocated: category.allocated || 0,
            spent: category.spent || 0,
            available: category.available || 0,
            dueDate: category.type === 'single' && subItems.length > 0 ? subItems[0].dueDate : null,
            color: category.color || 'bg-blue-500',
            isActive: category.isActive !== false, // Default to true if not specified
            isParent: true,
            subItems
        };
    });
};

/**
 * Calculate monthly amount based on frequency
 * @param {number} amount - The amount
 * @param {string} frequency - The frequency (monthly, weekly, bi-weekly, etc.)
 * @returns {number} Monthly amount
 */
const calculateMonthlyAmount = (amount, frequency) => {
    const multipliers = {
        'daily': 30.44, // Average days per month
        'weekly': 4.33, // Average weeks per month
        'bi-weekly': 2.17, // Average bi-weekly periods per month
        'every-2-weeks': 2.17,
        'monthly': 1,
        'quarterly': 1 / 3,
        'semi-annually': 1 / 6,
        'annually': 1 / 12,
        'every-6-weeks': 52 / 6 / 12, // 52 weeks / 6 weeks / 12 months
        'every-8-weeks': 52 / 8 / 12,
        'every-3-months': 4,
        'every-6-months': 2,
        'yearly': 1 / 12
    };

    return amount * (multipliers[frequency] || 1);
};

/**
 * Calculate how many paychecks until due date (assuming bi-weekly pay)
 * @param {string} dueDate - Due date string
 * @returns {number|null} Number of paychecks until due
 */
const calculatePaychecksUntilDue = (dueDate) => {
    if (!dueDate) return null;

    // Parse dates safely to avoid timezone issues
    const parseDateSafely = (dateInput) => {
        if (!dateInput) return null;
        let dateObj;
        if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateInput.split('-').map(Number);
            dateObj = new Date(year, month - 1, day);
        } else if (typeof dateInput === 'string' && dateInput.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [month, day, year] = dateInput.split('/').map(Number);
            dateObj = new Date(year, month - 1, day);
        } else {
            dateObj = new Date(dateInput);
        }
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    };

    const due = parseDateSafely(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 0) return 0;

    // Assuming bi-weekly pay (every 14 days)
    return Math.ceil(daysUntilDue / 14);
};

/**
 * Get due date urgency level
 * @param {string} dateString - Due date string
 * @returns {string} Urgency level
 */
export const getDueDateUrgency = (dateString) => {
    if (!dateString) return 'none';
    const dueDate = new Date(dateString);
    const today = new Date();
    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'urgent';
    if (daysUntil <= 30) return 'soon';
    return 'future';
};

/**
 * Get urgency styling classes
 * @param {string} urgency - Urgency level
 * @returns {string} CSS classes
 */
export const getUrgencyStyles = (urgency) => {
    switch (urgency) {
        case 'overdue':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'urgent':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'soon':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'future':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
            return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

/**
 * Format due date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
export const formatDueDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
