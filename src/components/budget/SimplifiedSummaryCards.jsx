/**
 * SimplifiedSummaryCards component
 * Displays summary cards for budget overview
 * Modernized for the new design system
 */
import { useMemo } from 'react';
import SummaryCard from './SummaryCard';

const SimplifiedSummaryCards = ({
    accounts = [],
    categories = [],
    planningItems = [],
    className = '',
}) => {
    // Calculate summary data
    const summaryData = useMemo(() => {
        // Calculate available to allocate
        const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        const totalAllocated = categories.reduce((sum, category) => sum + (category.allocated || 0), 0);
        const availableToAllocate = totalBalance - totalAllocated;

        // Calculate budget progress
        const totalPlanned = planningItems.reduce((sum, item) => {
            if (!item.isActive) return sum;
            return sum + (item.type === 'savings-goal' ? (item.monthlyContribution || 0) : (item.amount || 0));
        }, 0);
        const totalIncome = accounts.reduce((sum, account) => sum + (account.monthlyIncome || 0), 0);
        const budgetProgress = totalIncome > 0 ? (totalPlanned / totalIncome) * 100 : 0;

        // Find urgent items
        const now = new Date();
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const urgentItems = planningItems.filter(item => {
            if (!item.isActive) return false;

            const targetDate = item.type === 'savings-goal'
                ? new Date(item.targetDate)
                : new Date(item.dueDate);

            return targetDate <= thirtyDaysFromNow && targetDate >= now;
        });

        // Calculate funding percentage for budget buddy
        const totalItems = planningItems.length;
        const fundedItems = planningItems.filter(item => {
            // Check if item is fully funded based on its current savings vs target
            if (item.type === 'savings-goal') {
                return (item.alreadySaved || 0) >= (item.targetAmount || 0);
            } else {
                return (item.alreadySaved || 0) >= (item.amount || 0);
            }
        }).length;
        const fundingPercentage = totalItems > 0 ? (fundedItems / totalItems) * 100 : 0;

        return {
            availableToAllocate,
            budgetProgress,
            urgentItems: urgentItems.length,
            urgentItemsList: urgentItems,
            fundingPercentage,
        };
    }, [accounts, categories, planningItems]);

    // Format currency helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
            {/* Available to Allocate Card */}
            <SummaryCard
                title="Available to Allocate"
                value={formatCurrency(summaryData.availableToAllocate)}
                description="Unallocated funds"
                icon="💰"
                color={summaryData.availableToAllocate >= 0 ? 'green' : 'red'}
            />

            {/* Budget Progress Card */}
            <SummaryCard
                title="Budget Progress"
                value={`${Math.round(summaryData.budgetProgress)}%`}
                description="of income planned"
                icon="📊"
                progress={summaryData.budgetProgress}
                progressColor={
                    summaryData.budgetProgress > 100 ? 'red' :
                        summaryData.budgetProgress > 90 ? 'yellow' :
                            'gradient'
                }
            />

            {/* Needs Attention Card */}
            <SummaryCard
                title="Needs Attention"
                value={summaryData.urgentItems.toString()}
                description={`item${summaryData.urgentItems !== 1 ? 's' : ''} due soon`}
                icon="⚠️"
                color={
                    summaryData.urgentItems > 5 ? 'red' :
                        summaryData.urgentItems > 0 ? 'yellow' :
                            'green'
                }
            >
                {summaryData.urgentItems > 0 && (
                    <div className="text-xs text-gray-500 dark:text-dark-400 mt-2">
                        {summaryData.urgentItemsList.slice(0, 2).map((item, index) => (
                            <div key={index} className="truncate">
                                • {item.name}
                            </div>
                        ))}
                        {summaryData.urgentItemsList.length > 2 && (
                            <div className="text-gray-600 dark:text-dark-300">
                                +{summaryData.urgentItemsList.length - 2} more
                            </div>
                        )}
                    </div>
                )}
            </SummaryCard>

            {/* Budget Health Card (simplified Budget Buddy) */}
            <SummaryCard
                title="Budget Health"
                value={`${Math.round(summaryData.fundingPercentage)}%`}
                description="goals funded"
                icon="🎯"
                progress={summaryData.fundingPercentage}
                progressColor="gradient"
            >
                {summaryData.fundingPercentage >= 100 && (
                    <div className="text-xs text-success mt-1">
                        🎉 All goals funded!
                    </div>
                )}
                {summaryData.urgentItems > 0 && (
                    <div className="text-xs text-error mt-1 flex items-center">
                        ⚠️ {summaryData.urgentItems} urgent items
                    </div>
                )}
            </SummaryCard>
        </div>
    );
};

export default SimplifiedSummaryCards;
