/**
 * SimplifiedSummaryCards component
 * Displays summary cards for budget overview
 */
import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatUtils';
import SummaryCard from './SummaryCard';
import BudgetBuddy from './BudgetBuddy';

const SimplifiedSummaryCards = ({
  accounts = [],
  categories = [],
  planningItems = [],
  activeBudgetAllocations = [],
  timelines = {},
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

    return {
      availableToAllocate,
      budgetProgress,
      urgentItems: urgentItems.length,
      urgentItemsList: urgentItems,
    };
  }, [accounts, categories, planningItems]);

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
          <div className="text-xs text-theme-tertiary mt-2">
            {summaryData.urgentItemsList.slice(0, 2).map((item, index) => (
              <div key={index} className="truncate">
                • {item.name}
              </div>
            ))}
            {summaryData.urgentItemsList.length > 2 && (
              <div className="text-theme-secondary">
                +{summaryData.urgentItemsList.length - 2} more
              </div>
            )}
          </div>
        )}
      </SummaryCard>

      {/* Budget Buddy Card */}
      <BudgetBuddy
        planningItems={planningItems}
        availableToAllocate={summaryData.availableToAllocate}
        urgentItems={summaryData.urgentItems}
      />
    </div>
  );
};

export default SimplifiedSummaryCards;