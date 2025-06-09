import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, ChevronDown, ChevronRight, ChevronUp, GripVertical } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';

const DraggableCategory = ({
	category,
	index,
	children,
	onReorder,
	...otherProps
}) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setMounted(true), 10);
		return () => clearTimeout(timer);
	}, []);

	const [{ isDragging }, drag] = useDrag({
		type: 'category',
		item: { index, id: category.id },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const [, drop] = useDrop({
		accept: 'category',
		hover: (item) => {
			if (item.index !== index) {
				onReorder(item.index, index);
				item.index = index;
			}
		},
	});

	if (!mounted) {
		return <div className="transition-opacity">{children}</div>;
	}

	return (
		<div
			ref={(node) => drag(drop(node))}
			style={{
				opacity: isDragging ? 0.5 : 1,
				cursor: isDragging ? 'grabbing' : 'grab'
			}}
			className="transition-opacity"
		>
			{children}
		</div>
	);
};

const DraggableExpense = ({
	expense,
	index,
	categoryId,
	children,
	onReorder,
	...otherProps
}) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setMounted(true), 10);
		return () => clearTimeout(timer);
	}, []);

	const [{ isDragging }, drag] = useDrag({
		type: 'expense',
		item: { index, id: expense.id, categoryId },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const [, drop] = useDrop({
		accept: 'expense',
		hover: (item) => {
			if (item.index !== index && item.categoryId === categoryId) {
				onReorder(item.index, index);
				item.index = index;
			}
		},
	});

	if (!mounted) {
		return <div className="transition-opacity">{children}</div>;
	}

	return (
		<div
			ref={(node) => drag(drop(node))}
			style={{
				opacity: isDragging ? 0.5 : 1,
				cursor: isDragging ? 'grabbing' : 'grab'
			}}
			className="transition-opacity"
		>
			{children}
		</div>
	);
};

const DraggableGoal = ({
	goal,
	index,
	categoryId,
	children,
	onReorder,
	...otherProps
}) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setMounted(true), 10);
		return () => clearTimeout(timer);
	}, []);

	const [{ isDragging }, drag] = useDrag({
		type: 'goal',
		item: { index, id: goal.id, categoryId },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const [, drop] = useDrop({
		accept: 'goal',
		hover: (item) => {
			if (item.index !== index && item.categoryId === categoryId) {
				onReorder(item.index, index);
				item.index = index;
			}
		},
	});

	if (!mounted) {
		return <div className="transition-opacity">{children}</div>;
	}

	return (
		<div
			ref={(node) => drag(drop(node))}
			style={{
				opacity: isDragging ? 0.5 : 1,
				cursor: isDragging ? 'grabbing' : 'grab'
			}}
			className="transition-opacity"
		>
			{children}
		</div>
	);
};

const CategoriesSection = ({
	categorizedExpenses,
	darkMode,
	viewMode,
	frequencyOptions,
	timeline,
	onAddCategory,
	onAddExpense,
	onAddGoal,
	onEditCategory,
	onEditExpense,
	onEditGoal,
	onDeleteCategory,
	onDeleteExpense,
	onDeleteGoal,
	setExpenses,
	setSavingsGoals,
	setCategories,
	setPreselectedCategory,
	onMoveCategoryUp,
	onMoveCategoryDown,
	onMoveExpense,
	onMoveGoal,
	onReorderCategories,
	onReorderExpenses,
	onReorderGoals,
	categories,
}) => {
	const priorityColors = {
		essential: 'border-red-400 bg-red-100 text-red-900',
		important: 'border-yellow-400 bg-yellow-100 text-yellow-900',
		'nice-to-have': 'border-green-400 bg-green-100 text-green-900',
	};

	// CORRECTED helper function to get timeline info for an item
	const getTimelineInfo = (itemId, itemType) => {
		// Check if timeline exists and has the right structure
		if (!timeline || !timeline.timelines) return null;

		// Find the timeline item in the appropriate array
		const timelineItem = timeline.timelines.all.find(item =>
			item.id === itemId && item.type === itemType
		);

		return timelineItem || null;
	};

	// CORRECTED helper function to get urgency indicator
	const getUrgencyDisplay = (timelineItem) => {
		if (!timelineItem || !timelineItem.urgencyIndicator) return null;

		const { emoji, label, color } = timelineItem.urgencyIndicator;

		// Map the color class names properly
		const colorClass = color.includes('red') ? 'text-red-600 bg-red-100' :
			color.includes('yellow') ? 'text-yellow-600 bg-yellow-100' :
				color.includes('green') ? 'text-green-600 bg-green-100' :
					'text-gray-600 bg-gray-100';

		return (
			<span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colorClass}`} title={`${label} priority`}>
				{emoji} {label}
			</span>
		);
	};

	// CORRECTED helper function to get timeline message
	const getTimelineMessage = (timelineItem) => {
		if (!timelineItem || !timelineItem.timeline || !timelineItem.timeline.message) return null;

		return (
			<div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center font-medium">
				<span className="mr-1">📅</span>
				<span>{timelineItem.timeline.message}</span>
			</div>
		);
	};

	// Helper to check if item has deadline
	const hasDeadline = (timelineItem) => {
		return timelineItem && timelineItem.timeline && timelineItem.timeline.hasDeadline;
	};

	// Helper to get urgency level for styling
	const getUrgencyLevel = (timelineItem) => {
		if (!timelineItem) return 'none';
		const score = timelineItem.urgencyScore || 0;
		if (score >= 80) return 'critical';
		if (score >= 60) return 'high';
		if (score >= 30) return 'medium';
		return 'low';
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">Budget Items by Category</h2>
				<div className="flex space-x-2">
					<button
						onClick={onAddCategory}
						className="bg-purple-600 text-white px-2 sm:px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center"
					>
						<Plus className="w-4 h-4 mr-1" />
						<span className="hidden sm:inline">Category</span>
					</button>
					<button
						onClick={onAddExpense}
						className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
					>
						<Plus className="w-4 h-4 mr-1" />
						<span className="hidden sm:inline">Expense</span>
					</button>
					<button
						onClick={onAddGoal}
						className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
					>
						<Target className="w-4 h-4 mr-1" />
						<span className="hidden sm:inline">Goal</span>
					</button>
				</div>
			</div>

			{/* Timeline Overview Panel */}
			{timeline && timeline.timelines && timeline.timelines.summary && (
				<div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
					<h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
						📊 Timeline Overview
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div className="text-center">
							<div className="text-red-600 font-bold text-lg">{timeline.timelines.summary.critical || 0}</div>
							<div className="text-red-700 dark:text-red-300">🔴 Critical</div>
						</div>
						<div className="text-center">
							<div className="text-yellow-600 font-bold text-lg">
								{(timeline.timelines.summary.withDeadlines || 0) - (timeline.timelines.summary.critical || 0)}
							</div>
							<div className="text-yellow-700 dark:text-yellow-300">🟡 Upcoming</div>
						</div>
						<div className="text-center">
							<div className="text-green-600 font-bold text-lg">{timeline.timelines.summary.onTrack || 0}</div>
							<div className="text-green-700 dark:text-green-300">🟢 On Track</div>
						</div>
						<div className="text-center">
							<div className="text-blue-600 font-bold text-lg">{timeline.timelines.summary.fullyFunded || 0}</div>
							<div className="text-blue-700 dark:text-blue-300">✅ Funded</div>
						</div>
					</div>
				</div>
			)}

			<div className="space-y-4">
				{categorizedExpenses.map((category, categoryIndex) => (
					<DraggableCategory
						key={category.id}
						category={category}
						index={categoryIndex}
						onReorder={onReorderCategories}
					>
						<div className={`bg-theme-primary rounded-lg shadow-lg overflow-hidden`}>
							<div className="p-4 relative">
								<div className={`absolute left-0 top-0 bottom-0 w-2 ${category.color}`}></div>
								<div className="flex items-center justify-between mb-3">
									<div
										className="flex items-center cursor-pointer flex-1 hover:bg-black/10 rounded px-2 py-1 transition-colors"
										onClick={() => {
											setCategories(prev =>
												prev.map(cat =>
													cat.id === category.id
														? { ...cat, collapsed: !cat.collapsed }
														: cat
												)
											);
										}}
									>
										<GripVertical className="w-4 h-4 mr-2 text-gray-400 hover:text-gray-600 cursor-grab flex-shrink-0" />

										{category.collapsed ? (
											<ChevronRight className="w-4 h-4 mr-2" />
										) : (
											<ChevronDown className="w-4 h-4 mr-2" />
										)}
										<div className={`w-6 h-6 rounded-full ${category.color} mr-3 shadow-lg border-2 border-white dark:border-white`}></div>
										<h3 className="font-semibold">{category.name}</h3>
										<span className="ml-2 text-sm text-gray-500">
											{viewMode === 'amount'
												? `$${category.total.toFixed(2)}/bi-weekly`
												: `${category.percentage.toFixed(1)}%`
											}
										</span>
									</div>
									<div className="flex space-x-1">
										<button
											onClick={(e) => {
												e.stopPropagation();
												setPreselectedCategory(category.id);
												onAddGoal();
											}}
											className="p-1 text-green-600 rounded text-sm flex items-center hover:bg-black/10 rounded"
											title="Add goal to this category"
										>
											<Target className="w-4 h-4" />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												setPreselectedCategory(category.id);
												onAddExpense();
											}}
											className="p-1 hover:bg-black/10 rounded text-blue-400 hover:text-blue-300"
											title="Add expense to this category"
										>
											<Plus className="w-4 h-4" />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												onEditCategory(category);
											}}
											className="p-1 hover:bg-black/10 rounded"
											title="Edit this category"
										>
											<Edit2 className="w-4 h-4" />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												onDeleteCategory(category);
											}}
											className="p-1 hover:bg-black/10 rounded text-red-400"
											title="Delete this category"
										>
											<Trash2 className="w-4 h-4" />
										</button>
										<div className="flex flex-col">
											<button
												onClick={(e) => {
													e.stopPropagation();
													onMoveCategoryUp(category.id);
												}}
												disabled={categoryIndex === 0}
												className={`p-1 rounded ${categoryIndex === 0 ? 'text-gray-400' : 'hover:bg-black/10'}`}
											>
												<ChevronUp className="w-3 h-3" />
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													onMoveCategoryDown(category.id);
												}}
												disabled={categoryIndex === categorizedExpenses.length - 1}
												className={`p-1 rounded ${categoryIndex === categorizedExpenses.length - 1 ? 'text-gray-400' : 'hover:bg-black/10'}`}
											>
												<ChevronDown className="w-3 h-3" />
											</button>
										</div>
									</div>
								</div>
							</div>

							{!category.collapsed && (
								<div className="space-y-2">
									{category.expenses.length === 0 && category.goals.length === 0 ? (
										<p className="text-gray-500 text-sm italic p-4">No items in this category</p>
									) : (
										<div className="space-y-2">
											{/* EXPENSES with timeline integration */}
											{category.expenses.map((expense, expenseIndex) => {
												const timelineItem = getTimelineInfo(expense.id, 'expense');
												// const urgencyLevel = getUrgencyLevel(timelineItem);
												console.log(`Expense: ${expense.name}`);
												console.log('- Has dueDate:', expense.dueDate);
												console.log('- Timeline item:', timelineItem);
												console.log('- Timeline has deadline:', timelineItem?.timeline?.hasDeadline);
												console.log('- Available paychecks:', timelineItem?.timeline?.availablePaychecks);
												console.log('- Last paycheck date:', timelineItem?.timeline?.lastPaycheckDate);
												console.log('- Funding date:', timelineItem?.timeline?.fundingDate);

												return (
													<DraggableExpense
														key={`exp-${expense.id}`}
														expense={expense}
														index={expenseIndex}
														categoryId={category.id}
														onReorder={(dragIndex, hoverIndex) => onReorderExpenses(dragIndex, hoverIndex, category.id)}
													>
														<div
															className={`border-l-4 ${priorityColors[expense.priority]} ${expense.isFullyFunded ? 'opacity-75' : ''
																} ${expense.allocationPaused ? 'opacity-60' : ''} rounded-r`}
														>
															<div
																className="px-3 py-2 cursor-pointer transition-colors hover:bg-black/10"
																onClick={() => {
																	setExpenses(prev =>
																		prev.map(exp =>
																			exp.id === expense.id
																				? { ...exp, collapsed: !exp.collapsed }
																				: exp
																		)
																	);
																}}
															>
																<div className="flex items-center justify-between">
																	<div className="flex items-center flex-1 min-w-0">
																		<GripVertical className="w-4 h-4 mr-2 text-gray-400 hover:text-gray-600 cursor-grab flex-shrink-0" />

																		{expense.collapsed ? (
																			<ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
																		) : (
																			<ChevronDown className="w-4 h-4 mr-2 flex-shrink-0" />
																		)}
																		<div className="flex-1 min-w-0">
																			<div className="flex items-center">
																				<span className="font-medium truncate">{expense.name}</span>
																				{expense.priorityState === 'active' && (
																					<span className="text-xs ml-2" title="Active">🟢</span>
																				)}
																				{expense.priorityState === 'paused' && (
																					<span className="text-xs ml-2" title="Paused">⏸️</span>
																				)}
																				{expense.priorityState === 'complete' && (
																					<span className="text-xs ml-2" title="Funded">✅</span>
																				)}
																				<div className="flex items-center ml-2 space-x-1 flex-shrink-0">
																					{expense.allocationPaused && (
																						<span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded">
																							PAUSED
																						</span>
																					)}
																					{expense.isFullyFunded && !expense.allocationPaused && (
																						<span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
																							FUNDED
																						</span>
																					)}
																				</div>
																			</div>
																		</div>
																	</div>
																	<div className="flex items-center space-x-3 flex-shrink-0">
																		<div className="text-right">
																			<div className="font-semibold">
																				{viewMode === 'amount'
																					? `$${expense.biweeklyAmount.toFixed(2)}`
																					: `${expense.percentage.toFixed(1)}%`
																				}
																			</div>
																			<div className="text-xs text-gray-500">bi-weekly</div>
																		</div>
																		<div className="flex space-x-1">
																			<div className="flex flex-col">
																				<button
																					onClick={(e) => {
																						e.stopPropagation();
																						onMoveExpense(expense.id, 'up');
																					}}
																					disabled={expenseIndex === 0}
																					className={`p-1 rounded ${expenseIndex === 0 ? 'text-gray-400' : 'hover:bg-black/10'}`}
																				>
																					<ChevronUp className="w-3 h-3" />
																				</button>
																				<button
																					onClick={(e) => {
																						e.stopPropagation();
																						onMoveExpense(expense.id, 'down');
																					}}
																					disabled={expenseIndex === category.expenses.length - 1}
																					className={`p-1 rounded ${expenseIndex === category.expenses.length - 1 ? 'text-gray-400' : 'hover:bg-black/10'}`}
																				>
																					<ChevronDown className="w-3 h-3" />
																				</button>
																			</div>
																			<button
																				onClick={(e) => {
																					e.stopPropagation();
																					onEditExpense(expense);
																				}}
																				className="p-1 hover:bg-black/10 rounded"
																			>
																				<Edit2 className="w-3 h-3" />
																			</button>
																			<button
																				onClick={(e) => {
																					e.stopPropagation();
																					onDeleteExpense(expense);
																				}}
																				className="p-1 hover:bg-black/10 rounded text-red-400"
																			>
																				<Trash2 className="w-3 h-3" />
																			</button>
																		</div>
																	</div>
																</div>
															</div>

															{!expense.collapsed && (
																<div className="px-3 pb-3 bg-gray-50">
																	<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
																		${expense.amount}{' '}
																		{frequencyOptions.find(f => f.value === expense.frequency)?.label.toLowerCase()}
																	</div>

																	{expense.remainingNeeded > 0 && (
																		<div className="text-xs text-blue-500">
																			${expense.remainingNeeded.toFixed(2)} remaining to save
																		</div>
																	)}

																	{/* Simple timeline countdown - shows when you'll have enough saved */}
																	{timelineItem && timelineItem.timeline && timelineItem.timeline.hasDeadline && (
																		<div className="text-xs text-green-600 mt-1 flex items-center">
																			<span className="mr-1">✅</span>
																			<span>
																				{timelineItem.timeline.fundingDate ? (
																					<>Ready by {timelineItem.timeline.fundingDate.toLocaleDateString()} ({timelineItem.timeline.paychecksNeeded} paychecks)</>
																				) : timelineItem.timeline.lastPaycheckDate ? (
																					<>Ready by {timelineItem.timeline.lastPaycheckDate.toLocaleDateString()} ({timelineItem.timeline.availablePaychecks} paychecks)</>
																				) : (
																					<>Due: {expense.dueDateDate}</>
																				)}
																			</span>
																		</div>
																	)}
																</div>
															)}
														</div>
													</DraggableExpense>
												);
											})}

											{/* GOALS with timeline integration */}
											{category.goals.map((goal, goalIndex) => {

												// DEBUG: Put this FIRST, before any other code
												console.log('Goal object:', goal);
												if (!goal) {
													console.log('Goal is undefined/null at index:', goalIndex);
													return null;
												}
												const safeGoal = {
													...goal,
													biweeklyAmount: goal.biweeklyAmount || 0,
													percentage: goal.percentage || 0,
													fundingProgress: goal.fundingProgress || 0,
													targetAmount: goal.targetAmount || 0,
													alreadySaved: goal.alreadySaved || 0,
													remainingNeeded: goal.remainingNeeded || 0
												};
												const timelineItem = getTimelineInfo(goal.id, 'goal');
												const urgencyLevel = getUrgencyLevel(timelineItem);
												return (
													<DraggableGoal
														key={`goal-${goal.id}`}
														goal={goal}
														index={goalIndex}
														categoryId={category.id}
														onReorder={(dragIndex, hoverIndex) => onReorderGoals(dragIndex, hoverIndex, category.id)}
													>
														<div
															className={`border-l-4 border-green-400 ${darkMode
																? 'bg-green-100 text-green-900'
																: 'bg-green-100 text-green-900'
																} ${goal.isFullyFunded ? 'opacity-75' : ''} ${goal.allocationPaused ? 'opacity-60' : ''
																} rounded-r`}
														>
															<div
																className="px-3 py-2 cursor-pointer transition-colors hover:bg-black/10"
																onClick={() => {
																	setSavingsGoals(prev =>
																		prev.map(g =>
																			g.id === goal.id
																				? { ...g, collapsed: !g.collapsed }
																				: g
																		)
																	);
																}}
															>
																<div className="flex items-center justify-between">
																	<div className="flex items-center flex-1 min-w-0">
																		<GripVertical className="w-4 h-4 mr-2 text-gray-400 hover:text-gray-600 cursor-grab flex-shrink-0" />

																		{goal.collapsed ? (
																			<ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
																		) : (
																			<ChevronDown className="w-4 h-4 mr-2 flex-shrink-0" />
																		)}
																		<Target className="w-4 h-4 mr-2 flex-shrink-0" />
																		<div className="flex-1 min-w-0">
																			<div className="flex items-center">
																				<span className="font-medium truncate">{goal.name}</span>
																				{goal.priorityState === 'active' && (
																					<span className="text-xs ml-2" title="Active">🟢</span>
																				)}
																				{goal.priorityState === 'paused' && (
																					<span className="text-xs ml-2" title="Paused">⏸️</span>
																				)}
																				{goal.priorityState === 'complete' && (
																					<span className="text-xs ml-2" title="Funded">✅</span>
																				)}
																				<span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded ml-2">
																					{safeGoal.fundingProgress.toFixed(0)}%
																				</span>
																				<div className="flex items-center ml-2 space-x-1 flex-shrink-0">
																					{goal.allocationPaused && (
																						<span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded">
																							PAUSED
																						</span>
																					)}
																					{goal.isFullyFunded && !goal.allocationPaused && (
																						<span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
																							COMPLETE
																						</span>
																					)}
																				</div>
																			</div>
																		</div>
																	</div>
																	<div className="flex items-center space-x-3 flex-shrink-0">
																		<div className="text-right">
																			<div className="font-semibold">
																				{viewMode === 'amount'
																					? `$${safeGoal.biweeklyAmount.toFixed(2)}`
																					: `${safeGoal.percentage.toFixed(1)}%`
																				}
																			</div>
																			<div className="text-xs text-gray-500">bi-weekly</div>
																		</div>
																		<div className="flex space-x-1">
																			<div className="flex flex-col">
																				<button
																					onClick={(e) => {
																						e.stopPropagation();
																						onMoveGoal(goal.id, 'up');
																					}}
																					disabled={goalIndex === 0}
																					className={`p-1 rounded ${goalIndex === 0 ? 'text-gray-400' : 'hover:bg-black/10'}`}
																				>
																					<ChevronUp className="w-3 h-3" />
																				</button>
																				<button
																					onClick={(e) => {
																						e.stopPropagation();
																						onMoveGoal(goal.id, 'down');
																					}}
																					disabled={goalIndex === category.goals.length - 1}
																					className={`p-1 rounded ${goalIndex === category.goals.length - 1 ? 'text-gray-400' : 'hover:bg-black/10'}`}
																				>
																					<ChevronDown className="w-3 h-3" />
																				</button>
																			</div>
																			<button
																				onClick={(e) => {
																					e.stopPropagation();
																					onEditGoal(goal);
																				}}
																				className="p-1 hover:bg-black/10 rounded"
																			>
																				<Edit2 className="w-3 h-3" />
																			</button>
																			<button
																				onClick={(e) => {
																					e.stopPropagation();
																					onDeleteGoal(goal);
																				}}
																				className="p-1 hover:bg-black/10 rounded text-red-400"
																			>
																				<Trash2 className="w-3 h-3" />
																			</button>
																		</div>
																	</div>
																</div>
															</div>
															{!goal.collapsed && (
																<div className={`px-3 pb-3 ${darkMode ? 'bg-green-200' : 'bg-green-200'}`}>
																	<div className={`text-sm ${darkMode ? 'text-green-100' : 'text-gray-700'} mb-2`}>
																		Target: ${goal.targetAmount.toLocaleString()} by {goal.targetDate}
																	</div>

																	<div className="space-y-1">
																		<div className="flex justify-between text-xs">
																			<span>
																				Progress: ${goal.alreadySaved || 0} / ${goal.targetAmount.toLocaleString()}
																			</span>
																			<span>{safeGoal.fundingProgress.toFixed(0)}%</span>
																		</div>
																		<div className="w-full bg-gray-200 rounded-full h-2">
																			<div
																				className={`h-2 rounded-full ${goal.isFullyFunded ? 'bg-green-500' : 'bg-green-400'}`}
																				style={{ width: `${Math.min(100, goal.fundingProgress)}%` }}
																			></div>
																		</div>

																		{goal.remainingNeeded > 0 && (
																			<div className="text-xs text-green-700">
																				${goal.remainingNeeded.toLocaleString()} remaining to save
																			</div>
																		)}
																	</div>

																	{/* ADD: Simple timeline countdown for goals - same as expenses */}
																	{timelineItem && timelineItem.timeline && timelineItem.timeline.hasDeadline && (
																		<div className="text-xs text-green-600 mt-2 flex items-center">
																			<span className="mr-1">✅</span>
																			<span>
																				{timelineItem.timeline.fundingDate ? (
																					<>Ready by {timelineItem.timeline.fundingDate.toLocaleDateString()} ({timelineItem.timeline.paychecksNeeded} paychecks)</>
																				) : timelineItem.timeline.lastPaycheckDate ? (
																					<>Ready by {timelineItem.timeline.lastPaycheckDate.toLocaleDateString()} ({timelineItem.timeline.availablePaychecks} paychecks)</>
																				) : (
																					<>Target: {goal.targetDate}</>
																				)}
																			</span>
																		</div>
																	)}
																</div>
															)}


														</div>
													</DraggableGoal>
												);
											})}

										</div>
									)}
								</div>
							)}
						</div>
					</DraggableCategory>
				))}
			</div>
		</div>
	);
};

export default CategoriesSection;