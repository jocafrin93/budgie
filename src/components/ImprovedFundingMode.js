// import React, { useState, useMemo, useEffect } from 'react';
// import {
//     DollarSign,
//     AlertTriangle,
//     CheckCircle,
//     TrendingUp,
//     Zap,
//     Target,
//     Calendar,
//     Clock,
//     ArrowRight,
//     Wallet,
//     Calculator,
//     Lightbulb,
//     PieChart,
//     RefreshCw,
//     ToggleLeft,
//     ToggleRight
// } from 'lucide-react';
// import CurrencyInput from './CurrencyInput';

// // Smart Funding Suggestion Card
// const FundingSuggestion = ({
//     suggestion,
//     onAccept,
//     onCustomAmount,
//     availableFunds,
//     fundingMode
// }) => {
//     // Initialize custom amount based on current funding mode
//     const [customAmount, setCustomAmount] = useState(
//         fundingMode === 'monthly' ? suggestion.monthlyAmount : suggestion.perPaycheckAmount
//     );

//     // Update custom amount when funding mode changes
//     useEffect(() => {
//         setCustomAmount(fundingMode === 'monthly' ?
//             Math.min(suggestion.monthlyAmount || 0, availableFunds) :
//             Math.min(suggestion.perPaycheckAmount || 0, availableFunds));
//     }, [fundingMode, suggestion, availableFunds]);

//     const getPriorityColor = () => {
//         switch (suggestion.priority) {
//             case 'critical': return 'border-red-400 bg-red-50 dark:bg-red-900/20';
//             case 'high': return 'border-orange-400 bg-orange-50 dark:bg-orange-900/20';
//             case 'medium': return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
//             default: return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
//         }
//     };

//     const getPriorityIcon = () => {
//         switch (suggestion.priority) {
//             case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
//             case 'high': return <TrendingUp className="w-4 h-4 text-orange-600" />;
//             case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
//             default: return <Target className="w-4 h-4 text-blue-600" />;
//         }
//     };

//     return (
//         <div className={`p-4 rounded-lg border-2 ${getPriorityColor()}`}>
//             <div className="flex items-start justify-between mb-3">
//                 <div className="flex items-start space-x-3">
//                     {getPriorityIcon()}
//                     <div className="flex-1">
//                         <h4 className="font-semibold text-theme-primary">{suggestion.categoryName}</h4>
//                         <p className="text-sm text-theme-secondary mt-1">{suggestion.reason}</p>

//                         {suggestion.urgentItems && suggestion.urgentItems.length > 0 && (
//                             <div className="mt-2">
//                                 <p className="text-xs text-theme-tertiary">Upcoming:</p>
//                                 <div className="text-xs text-theme-secondary">
//                                     {suggestion.urgentItems.slice(0, 2).map(item => (
//                                         <div key={item.id} className="flex items-center space-x-1">
//                                             <Calendar className="w-3 h-3" />
//                                             <span>{item.name} - ${item.amount}</span>
//                                             {item.dueDate && (
//                                                 <span className="text-theme-tertiary">
//                                                     ({new Date(item.dueDate).toLocaleDateString()})
//                                                 </span>
//                                             )}
//                                         </div>
//                                     ))}
//                                     {suggestion.urgentItems.length > 2 && (
//                                         <div className="text-theme-tertiary">
//                                             +{suggestion.urgentItems.length - 2} more
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 <div className="text-right">
//                     <div className="text-lg font-bold text-theme-primary">
//                         ${suggestion.amount.toFixed(2)}
//                     </div>
//                     <div className="text-xs text-theme-secondary">
//                         {suggestion.frequencyLabel || suggestion.priority.toUpperCase()}
//                     </div>
//                 </div>
//             </div>

//             <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-2">
//                     <CurrencyInput
//                         value={customAmount}
//                         onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
//                         className="w-24 text-sm"
//                     />
//                     <button
//                         onClick={() => onCustomAmount(suggestion.categoryId, customAmount)}
//                         disabled={customAmount <= 0 || customAmount > availableFunds}
//                         className="btn-secondary px-3 py-1 text-sm rounded disabled:opacity-50"
//                     >
//                         Fund Custom
//                     </button>
//                 </div>

//                 <button
//                     onClick={() => onAccept({
//                         ...suggestion,
//                         amount: fundingMode === 'monthly' ?
//                             Math.min(suggestion.monthlyAmount || 0, availableFunds) :
//                             Math.min(suggestion.perPaycheckAmount || 0, availableFunds)
//                     })}
//                     disabled={(fundingMode === 'monthly' ? suggestion.monthlyAmount : suggestion.perPaycheckAmount) > availableFunds}
//                     className="btn-success px-4 py-2 text-sm rounded disabled:opacity-50 flex items-center space-x-1"
//                 >
//                     <span>Fund ${(fundingMode === 'monthly' ?
//                         Math.min(suggestion.monthlyAmount || 0, availableFunds) :
//                         Math.min(suggestion.perPaycheckAmount || 0, availableFunds)).toFixed(0)}</span>
//                     <span className="text-xs">{suggestion.buttonLabel}</span>
//                     <ArrowRight className="w-3 h-3" />
//                 </button>
//             </div>
//         </div>
//     );
// };

// // Funding Allocation Summary
// const AllocationSummary = ({ allocations, totalBudget }) => {
//     const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
//     const remaining = totalBudget - totalAllocated;

//     return (
//         <div className="bg-theme-secondary rounded-lg p-4">
//             <h3 className="font-semibold text-theme-primary mb-3 flex items-center">
//                 <PieChart className="w-4 h-4 mr-2" />
//                 Funding Allocation Summary
//             </h3>

//             <div className="space-y-2">
//                 {allocations.map(allocation => (
//                     <div key={allocation.categoryId} className="flex items-center justify-between text-sm">
//                         <div className="flex items-center space-x-2">
//                             <div className={`w-3 h-3 rounded-full ${allocation.categoryColor}`}></div>
//                             <span className="text-theme-primary">{allocation.categoryName}</span>
//                         </div>
//                         <span className="font-medium text-theme-primary">
//                             ${allocation.amount.toFixed(2)}
//                         </span>
//                     </div>
//                 ))}

//                 <div className="border-t border-theme-primary pt-2 mt-2">
//                     <div className="flex items-center justify-between font-semibold">
//                         <span className="text-theme-primary">Remaining</span>
//                         <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
//                             ${remaining.toFixed(2)}
//                         </span>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// // Main Improved Funding Mode Component
// const ImprovedFundingMode = ({
//     categories,
//     availableFunds: initialAvailableFunds,
//     onFundCategory,
//     paySchedule,
//     planningItems = [],
//     activeBudgetAllocations = [],
//     payFrequency,
//     payFrequencyOptions
// }) => {
//     const [availableFunds, setAvailableFunds] = useState(initialAvailableFunds);
//     const [fundingAllocations, setFundingAllocations] = useState([]);
//     const [showAdvanced, setShowAdvanced] = useState(false);
//     const [fundingMode, setFundingMode] = useState('per-paycheck'); // 'monthly' or 'per-paycheck'

//     useEffect(() => {
//         setAvailableFunds(initialAvailableFunds);
//     }, [initialAvailableFunds]);


//     // Helper function to get per-paycheck amount based on frequency
//     const getPerPaycheckAmount = (item) => {
//         if (!item) return 0;

//         // Get paycheck frequency multiplier
//         const payFreqOption = payFrequencyOptions?.find(opt => opt.value === payFrequency) ||
//             { value: 'bi-weekly', paychecksPerMonth: 2.17 };
//         const paychecksPerMonth = payFreqOption.paychecksPerMonth || 2.17;

//         if (item.type === 'savings-goal') {
//             // For savings goals, convert monthly contribution to per-paycheck
//             return (item.monthlyContribution || 0) / paychecksPerMonth;
//         } else {
//             // For expenses, handle based on frequency
//             const frequencyMap = {
//                 'weekly': (item.amount || 0) / (paychecksPerMonth / 4.33),
//                 'bi-weekly': (item.amount || 0) / (paychecksPerMonth / 2.17),
//                 'every-3-weeks': (item.amount || 0) / (paychecksPerMonth / 1.44),
//                 'monthly': (item.amount || 0) / paychecksPerMonth,
//                 'every-6-weeks': (item.amount || 0) / (paychecksPerMonth / 0.72),
//                 'every-7-weeks': (item.amount || 0) / (paychecksPerMonth / 0.62),
//                 'every-8-weeks': (item.amount || 0) / (paychecksPerMonth / 0.54),
//                 'quarterly': (item.amount || 0) / (paychecksPerMonth * 3),
//                 'annually': (item.amount || 0) / (paychecksPerMonth * 12),
//                 'per-paycheck': item.amount || 0
//             };

//             return frequencyMap[item.frequency] || (item.amount || 0) / paychecksPerMonth;
//         }
//     };

//     // Get frequency label for display
//     const getFrequencyLabel = (item) => {
//         if (!item) return '';

//         if (item.type === 'savings-goal') {
//             return 'monthly contribution';
//         }

//         const frequencyLabels = {
//             'weekly': 'weekly',
//             'bi-weekly': 'every 2 weeks',
//             'every-3-weeks': 'every 3 weeks',
//             'monthly': 'monthly',
//             'every-6-weeks': 'every 6 weeks',
//             'every-7-weeks': 'every 7 weeks',
//             'every-8-weeks': 'every 8 weeks',
//             'quarterly': 'quarterly',
//             'annually': 'annually',
//             'per-paycheck': 'per paycheck'
//         };

//         return frequencyLabels[item.frequency] || '';
//     };

//     // Calculate funding needs and priorities
//     const fundingAnalysis = useMemo(() => {
//         const categoryAnalysis = categories.map(category => {
//             // Get active items for this category
//             const activeItems = planningItems.filter(item =>
//                 item.categoryId === category.id && item.isActive
//             );


//             // Calculate needs based on funding mode
//             const itemNeeds = activeItems.map(item => {
//                 const perPaycheckAmount = getPerPaycheckAmount(item);
//                 const monthlyAmount = item.type === 'savings-goal'
//                     ? (item.monthlyContribution || 0)
//                     : perPaycheckAmount * (payFrequencyOptions?.find(opt => opt.value === payFrequency)?.paychecksPerMonth || 2.17);

//                 // Calculate how much is already allocated for this item
//                 const alreadySaved = item.alreadySaved || 0;
//                 const totalNeeded = item.type === 'savings-goal' ? item.targetAmount : item.amount;
//                 const remainingNeeded = Math.max(0, totalNeeded - alreadySaved);

//                 // Adjust amounts based on what's already saved
//                 const adjustedPerPaycheckAmount = remainingNeeded > 0 ? perPaycheckAmount : 0;
//                 const adjustedMonthlyAmount = remainingNeeded > 0 ? monthlyAmount : 0;

//                 return {
//                     item,
//                     perPaycheckAmount: adjustedPerPaycheckAmount,
//                     monthlyAmount: adjustedMonthlyAmount,
//                     frequencyLabel: getFrequencyLabel(item),
//                     originalAmount: item.type === 'savings-goal' ? item.targetAmount : item.amount,
//                     alreadySaved,
//                     remainingNeeded
//                 };
//             });

//             // Calculate total needs
//             const monthlyNeeds = itemNeeds.reduce((total, data) => total + data.monthlyAmount, 0);
//             const perPaycheckNeeds = itemNeeds.reduce((total, data) => total + data.perPaycheckAmount, 0);

//             // Calculate current envelope balance
//             const currentBalance = (category.allocated || 0) - (category.spent || 0);
//             const monthlyShortfall = Math.max(0, monthlyNeeds - currentBalance);
//             const perPaycheckShortfall = Math.max(0, perPaycheckNeeds - (currentBalance / (payFrequencyOptions?.find(opt => opt.value === payFrequency)?.paychecksPerMonth || 2.17)));

//             // Use the appropriate shortfall based on funding mode
//             const shortfall = fundingMode === 'monthly' ? monthlyShortfall : perPaycheckShortfall;

//             // Find urgent items (due soon)
//             const urgentItems = activeItems.filter(item => {
//                 if (item.dueDate) {
//                     const dueDate = new Date(item.dueDate);
//                     const now = new Date();
//                     const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
//                     return daysUntilDue <= 30 && daysUntilDue >= 0;
//                 }
//                 return false;
//             }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

//             // Calculate priority
//             let priority = 'low';
//             let priorityScore = 0;

//             if (currentBalance < 0) {
//                 priority = 'critical';
//                 priorityScore = 100;
//             } else if (urgentItems.length > 0) {
//                 const nearestDue = Math.min(...urgentItems.map(item =>
//                     (new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
//                 ));
//                 if (nearestDue <= 7) {
//                     priority = 'critical';
//                     priorityScore = 90;
//                 } else if (nearestDue <= 14) {
//                     priority = 'high';
//                     priorityScore = 75;
//                 } else {
//                     priority = 'medium';
//                     priorityScore = 50;
//                 }
//             } else if (shortfall > 0) {
//                 if (shortfall >= monthlyNeeds * 0.5) {
//                     priority = 'high';
//                     priorityScore = 60;
//                 } else {
//                     priority = 'medium';
//                     priorityScore = 30;
//                 }
//             }

//             // Determine funding reason
//             let reason = 'Maintain healthy balance';
//             if (currentBalance < 0) {
//                 reason = 'Negative balance - needs immediate funding';
//             } else if (urgentItems.length > 0) {
//                 reason = `${urgentItems.length} item(s) due within 30 days`;
//             } else if (shortfall > 0) {
//                 reason = `$${shortfall.toFixed(0)} short for monthly needs`;
//             }

//             return {
//                 categoryId: category.id,
//                 categoryName: category.name,
//                 categoryColor: category.color,
//                 monthlyNeeds,
//                 perPaycheckNeeds,
//                 currentBalance,
//                 shortfall,
//                 urgentItems,
//                 priority,
//                 priorityScore,
//                 reason,
//                 itemNeeds,
//                 suggestedAmount: Math.min(shortfall || (fundingMode === 'monthly' ? monthlyNeeds : perPaycheckNeeds) * 0.25, availableFunds)
//             };
//         }).filter(analysis => analysis.shortfall > 0 || analysis.urgentItems.length > 0)
//             .sort((a, b) => b.priorityScore - a.priorityScore);

//         return categoryAnalysis;
//     }, [categories, planningItems, availableFunds]);

//     // Generate smart funding suggestions
//     const smartSuggestions = useMemo(() => {
//         let remainingFunds = availableFunds;
//         const suggestions = [];

//         fundingAnalysis.forEach(analysis => {
//             if (remainingFunds <= 0) return;

//             // Get the appropriate needs value based on funding mode
//             const needsValue = fundingMode === 'monthly' ? analysis.monthlyNeeds : analysis.perPaycheckNeeds;

//             // Calculate the suggested amount based on the funding mode
//             const suggestedAmount = Math.min(
//                 analysis.shortfall || needsValue * 0.25,
//                 remainingFunds
//             );

//             if (suggestedAmount > 0) {
//                 // For urgent items, prioritize funding them directly
//                 if (analysis.urgentItems.length > 0) {
//                     // Find the most urgent item
//                     const mostUrgentItem = analysis.urgentItems[0];
//                     const itemNeed = analysis.itemNeeds.find(need => need.item.id === mostUrgentItem.id);

//                     if (itemNeed) {
//                         const itemAmount = fundingMode === 'monthly'
//                             ? itemNeed.monthlyAmount
//                             : itemNeed.perPaycheckAmount;

//                         // Store both amounts to allow toggling without recalculating
//                         const itemSuggestion = {
//                             categoryId: analysis.categoryId,
//                             categoryName: analysis.categoryName,
//                             amount: Math.min(itemAmount, remainingFunds),
//                             monthlyAmount: itemNeed.monthlyAmount,
//                             perPaycheckAmount: itemNeed.perPaycheckAmount,
//                             priority: analysis.priority,
//                             reason: `Due soon: ${mostUrgentItem.name}`,
//                             urgentItems: [mostUrgentItem],
//                             frequencyLabel: itemNeed.frequencyLabel,
//                             buttonLabel: fundingMode === 'monthly' ? '/month' : '/paycheck',
//                             originalFrequency: itemNeed.item.frequency,
//                             originalAmount: itemNeed.originalAmount
//                         };

//                         suggestions.push(itemSuggestion);
//                         remainingFunds -= itemSuggestion.amount;
//                     }
//                 } else {
//                     // General category funding
//                     suggestions.push({
//                         categoryId: analysis.categoryId,
//                         categoryName: analysis.categoryName,
//                         amount: suggestedAmount,
//                         monthlyAmount: analysis.monthlyNeeds,
//                         perPaycheckAmount: analysis.perPaycheckNeeds,
//                         priority: analysis.priority,
//                         reason: analysis.reason,
//                         urgentItems: analysis.urgentItems,
//                         frequencyLabel: fundingMode === 'monthly' ? 'monthly need' : 'per paycheck',
//                         buttonLabel: fundingMode === 'monthly' ? '/month' : '/paycheck'
//                     });
//                     remainingFunds -= suggestedAmount;
//                 }
//             }
//         });

//         return suggestions;
//     }, [fundingAnalysis, availableFunds, fundingMode]);

//     // Handle funding actions
//     const handleAcceptSuggestion = (suggestion) => {
//         onFundCategory(suggestion.categoryId, suggestion.amount);
//         setAvailableFunds(prev => prev - suggestion.amount);

//         setFundingAllocations(prev => [
//             ...prev,
//             {
//                 categoryId: suggestion.categoryId,
//                 categoryName: suggestion.categoryName,
//                 categoryColor: categories.find(c => c.id === suggestion.categoryId)?.color,
//                 amount: suggestion.amount
//             }
//         ]);
//     };

//     const handleCustomFunding = (categoryId, amount) => {
//         if (amount <= availableFunds && amount > 0) {
//             onFundCategory(categoryId, amount);
//             setAvailableFunds(prev => prev - amount);

//             const category = categories.find(c => c.id === categoryId);
//             setFundingAllocations(prev => [
//                 ...prev,
//                 {
//                     categoryId,
//                     categoryName: category?.name || 'Unknown',
//                     categoryColor: category?.color,
//                     amount
//                 }
//             ]);
//         }
//     };

//     const handleAutoFundAll = () => {
//         smartSuggestions.forEach(suggestion => {
//             handleAcceptSuggestion(suggestion);
//         });
//     };

//     const handleResetFunding = () => {
//         setAvailableFunds(initialAvailableFunds);
//         setFundingAllocations([]);
//     };

//     const totalSuggested = smartSuggestions.reduce((sum, s) => sum + (s.amount || 0), 0);
//     const isOverallocated = availableFunds < 0;

//     return (
//         <div className="space-y-6">
//             {/* Funding Header */}
//             <div className="bg-theme-primary rounded-lg p-6 shadow-lg">
//                 <div className="flex justify-between items-start mb-4">
//                     <div>
//                         <h2 className="text-2xl font-bold text-theme-primary flex items-center">
//                             <Zap className="w-6 h-6 mr-2 text-blue-500" />
//                             Smart Funding Assistant
//                         </h2>
//                         <p className="text-theme-secondary">
//                             AI-powered funding recommendations based on your available money
//                         </p>
//                     </div>

//                     <div className="text-right">
//                         <div className="text-sm text-theme-secondary">Available to Allocate</div>
//                         <div className="flex items-center justify-end space-x-2">
//                             {availableFunds < 0 && <AlertTriangle className="w-5 h-5 text-red-600" />}
//                             <div className={`text-3xl font-bold ${availableFunds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                                 {availableFunds >= 0 ? '$' : '-$'}{Math.abs(availableFunds).toFixed(2)}
//                             </div>
//                         </div>
//                         <div className="text-sm text-theme-tertiary">
//                             {availableFunds >= 0 ? 'from account balances' : 'allocated beyond balances'}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Funding Mode Toggle */}
//             <div className="mb-4 flex items-center justify-end">
//                 <span className="text-sm text-theme-secondary mr-2">Funding Mode:</span>
//                 <button
//                     onClick={() => setFundingMode(fundingMode === 'monthly' ? 'per-paycheck' : 'monthly')}
//                     className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-theme-secondary text-sm"
//                 >
//                     {fundingMode === 'per-paycheck' ? (
//                         <>
//                             <span>Per Paycheck</span>
//                             <ToggleRight className="w-4 h-4 text-green-500" />
//                         </>
//                     ) : (
//                         <>
//                             <span>Monthly</span>
//                             <ToggleLeft className="w-4 h-4" />
//                         </>
//                     )}
//                 </button>
//             </div>

//             {/* Quick Actions */}
//             <div className="flex flex-wrap gap-3">
//                 <button
//                     onClick={handleAutoFundAll}
//                     disabled={smartSuggestions.length === 0 || isOverallocated || totalSuggested > availableFunds}
//                     className="btn-success px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
//                 >
//                     <Zap className="w-4 h-4" />
//                     <span>Auto-Fund All (${totalSuggested.toFixed(0)})</span>
//                 </button>

//                 <button
//                     onClick={handleResetFunding}
//                     className="btn-secondary px-4 py-2 rounded-lg flex items-center space-x-2"
//                 >
//                     <RefreshCw className="w-4 h-4" />
//                     <span>Reset</span>
//                 </button>

//                 <button
//                     onClick={() => setShowAdvanced(!showAdvanced)}
//                     className="btn-secondary px-4 py-2 rounded-lg flex items-center space-x-2"
//                 >
//                     <Calculator className="w-4 h-4" />
//                     <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
//                 </button>
//             </div>
//             {/* Funding Suggestions */}
//             <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-theme-primary flex items-center">
//                     <Lightbulb className="w-5 h-5 mr-2" />
//                     Smart Funding Recommendations
//                 </h3>

//                 {smartSuggestions.length === 0 ? (
//                     <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
//                         <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
//                         <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
//                             All Categories Well Funded!
//                         </h3>
//                         <p className="text-green-700 dark:text-green-300">
//                             Your categories have sufficient funds for upcoming expenses.
//                         </p>
//                     </div>
//                 ) : (
//                     <div className="space-y-3">
//                         {smartSuggestions.map(suggestion => (
//                             <FundingSuggestion
//                                 key={suggestion.categoryId}
//                                 suggestion={suggestion}
//                                 onAccept={handleAcceptSuggestion}
//                                 onCustomAmount={handleCustomFunding}
//                                 availableFunds={availableFunds}
//                                 fundingMode={fundingMode}
//                             />
//                         ))}
//                     </div>
//                 )}
//             </div>

//             {/* Allocation Summary */}
//             {fundingAllocations.length > 0 && (
//                 <AllocationSummary
//                     allocations={fundingAllocations}
//                     totalBudget={initialAvailableFunds}
//                 />
//             )}

//             {/* Advanced Options */}
//             {showAdvanced && (
//                 <div className="bg-theme-secondary rounded-lg p-6">
//                     <h3 className="font-semibold text-theme-primary mb-4">Advanced Funding Options</h3>

//                     <div className="grid md:grid-cols-2 gap-4">
//                         <div>
//                             <h4 className="font-medium text-theme-primary mb-2">Funding Strategy</h4>
//                             <div className="space-y-2 text-sm">
//                                 <label className="flex items-center space-x-2">
//                                     <input type="radio" name="strategy" defaultChecked />
//                                     <span>Priority-based (recommended)</span>
//                                 </label>
//                                 <label className="flex items-center space-x-2">
//                                     <input type="radio" name="strategy" />
//                                     <span>Equal distribution</span>
//                                 </label>
//                                 <label className="flex items-center space-x-2">
//                                     <input type="radio" name="strategy" />
//                                     <span>Emergency-only</span>
//                                 </label>
//                             </div>
//                         </div>

//                         <div>
//                             <h4 className="font-medium text-theme-primary mb-2">Buffer Settings</h4>
//                             <div className="space-y-2 text-sm">
//                                 <label className="flex items-center justify-between">
//                                     <span>Reserve buffer:</span>
//                                     <input
//                                         type="number"
//                                         defaultValue={10}
//                                         className="w-16 px-2 py-1 text-xs border rounded"
//                                     />
//                                     <span>%</span>
//                                 </label>
//                                 <label className="flex items-center space-x-2">
//                                     <input type="checkbox" defaultChecked />
//                                     <span>Consider upcoming paycheck</span>
//                                 </label>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ImprovedFundingMode;
