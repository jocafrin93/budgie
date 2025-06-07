import React from 'react';
import { Plus, Edit2, Trash2, Target, ChevronDown, ChevronRight, ChevronUp, GripVertical } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';

const DraggableCategory = ({
    category,
    index,
    children,
    onReorder,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown
}) => {
    const [{ isDragging }, drag, dragPreview] = useDrag({
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

    return (
        <div
            ref={dragPreview}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            className="transition-opacity"
        >
            <div ref={drop}>
                {React.cloneElement(children, { dragHandle: drag })}
            </div>
        </div>
    );
};

const DraggableExpense = ({
    expense,
    index,
    categoryId,
    children,
    onReorder,
}) => {
    const [{ isDragging }, drag, dragPreview] = useDrag({
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

    return (
        <div
            ref={dragPreview}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            className="transition-opacity"
        >
            <div ref={drop}>
                {React.cloneElement(children, { dragHandle: drag })}
            </div>
        </div>
    );
};

const DraggableGoal = ({
    goal,
    index,
    categoryId,
    children,
    onReorder,
}) => {
    const [{ isDragging }, drag, dragPreview] = useDrag({
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

    return (
        <div
            ref={dragPreview}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            className="transition-opacity"
        >
            <div ref={drop}>
                {React.cloneElement(children, { dragHandle: drag })}
            </div>
        </div>
    );
};

const CategoriesSection = ({
    categorizedExpenses,
    darkMode,
    viewMode,
    frequencyOptions,
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
}) => {
    const priorityColors = {
        essential: 'border-red-400 bg-red-100 text-red-900',
        important: 'border-yellow-400 bg-yellow-100 text-yellow-900',
        'nice-to-have': 'border-green-400 bg-green-100 text-green-900',
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

            <div className="space-y-4">
                {categorizedExpenses.map((category, categoryIndex) => (
                    <DraggableCategory
                        key={category.id}
                        category={category}
                        index={categoryIndex}
                        onReorder={onReorderCategories}
                        onMoveUp={() => onMoveCategoryUp(category.id)}
                        onMoveDown={() => onMoveCategoryDown(category.id)}
                        canMoveUp={categoryIndex > 0}
                        canMoveDown={categoryIndex < categorizedExpenses.length - 1}
                    >
                        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
                            <div className="p-4 relative">
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${category.color}`}></div>
                                <div className="flex items-center justify-between mb-3">
                                    {/* Drag handle for category */}
                                    <div
                                        className="flex items-center flex-1 group"
                                    >
                                        <div
                                            className="mr-2 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                            ref={(node) => {
                                                // Get dragHandle from props passed by DraggableCategory
                                                if (node && category.dragHandle) {
                                                    category.dragHandle(node);
                                                }
                                            }}
                                            title="Drag to reorder"
                                        >
                                            <GripVertical className="w-4 h-4 text-gray-400" />
                                        </div>

                                        <div
                                            className="flex items-center cursor-pointer flex-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors"
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
                                            {category.collapsed ? (
                                                <ChevronRight className="w-4 h-4 mr-2" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 mr-2" />
                                            )}
                                            <div className={`w-6 h-6 rounded-full ${category.color} mr-3 shadow-lg border-2 border-white dark:border-white`}></div>
                                            <h3 className="font-semibold select-none">{category.name}</h3>
                                            <span className="ml-2 text-sm text-gray-500 select-none">
                                                {viewMode === 'amount'
                                                    ? `$${category.total.toFixed(2)}/bi-weekly`
                                                    : `${category.percentage.toFixed(1)}%`
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex space-x-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreselectedCategory(category.id);
                                                onAddExpense();
                                            }}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-blue-400 hover:text-blue-300"
                                            title="Add expense to this category"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditCategory(category);
                                            }}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteCategory(category);
                                            }}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-400"
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
                                                className={`p-1 rounded ${categoryIndex === 0 ? 'text-gray-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                            >
                                                <ChevronUp className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMoveCategoryDown(category.id);
                                                }}
                                                disabled={categoryIndex === categorizedExpenses.length - 1}
                                                className={`p-1 rounded ${categoryIndex === categorizedExpenses.length - 1 ? 'text-gray-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
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
                                            {category.expenses.map((expense, expenseIndex) => (
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
                                                        <div className="p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center flex-1 min-w-0">
                                                                    {/* Drag handle for expense */}
                                                                    <div
                                                                        className="mr-2 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        ref={(node) => {
                                                                            if (node && expense.dragHandle) {
                                                                                expense.dragHandle(node);
                                                                            }
                                                                        }}
                                                                        title="Drag to reorder"
                                                                    >
                                                                        <GripVertical className="w-3 h-3 text-gray-400" />
                                                                    </div>

                                                                    <div
                                                                        className="flex items-center cursor-pointer flex-1 min-w-0"
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
                                                                        {expense.collapsed ? (
                                                                            <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
                                                                        ) : (
                                                                            <ChevronDown className="w-4 h-4 mr-2 flex-shrink-0" />
                                                                        )}

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center">
                                                                                <span className="font-medium truncate select-none">{expense.name}</span>
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
                                                                </div>

                                                                <div className="flex items-center space-x-3 flex-shrink-0">
                                                                    <div className="text-right">
                                                                        <div className="font-semibold select-none">
                                                                            {viewMode === 'amount'
                                                                                ? `$${expense.biweeklyAmount.toFixed(2)}`
                                                                                : `${expense.percentage.toFixed(1)}%`
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 select-none">bi-weekly</div>
                                                                    </div>
                                                                    <div className="flex space-x-1">
                                                                        <div className="flex flex-col">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onMoveExpense(expense.id, 'up');
                                                                                }}
                                                                                disabled={expenseIndex === 0}
                                                                                className={`p-1 rounded ${expenseIndex === 0 ? 'text-gray-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                                            >
                                                                                <ChevronUp className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onMoveExpense(expense.id, 'down');
                                                                                }}
                                                                                disabled={expenseIndex === category.expenses.length - 1}
                                                                                className={`p-1 rounded ${expenseIndex === category.expenses.length - 1 ? 'text-gray-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                                            >
                                                                                <ChevronDown className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onEditExpense(expense);
                                                                            }}
                                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                                                        >
                                                                            <Edit2 className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onDeleteExpense(expense);
                                                                            }}
                                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-400"
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
                                                            </div>
                                                        )}
                                                    </div>
                                                </DraggableExpense>
                                            ))}

                                            {category.goals.map((goal, goalIndex) => (
                                                <DraggableGoal
                                                    key={`goal-${goal.id}`}
                                                    goal={goal}
                                                    index={goalIndex}
                                                    categoryId={category.id}
                                                    onReorder={(dragIndex, hoverIndex) => onReorderGoals(dragIndex, hoverIndex, category.id)}
                                                >
                                                    <div
                                                        className={`border-l-4 border-green-400 bg-green-100 text-green-900 ${goal.isFullyFunded ? 'opacity-75' : ''
                                                            } ${goal.allocationPaused ? 'opacity-60' : ''} rounded-r`}
                                                    >
                                                        <div className="p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center flex-1 min-w-0">
                                                                    {/* Drag handle for goal */}
                                                                    <div
                                                                        className="mr-2 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        ref={(node) => {
                                                                            if (node && goal.dragHandle) {
                                                                                goal.dragHandle(node);
                                                                            }
                                                                        }}
                                                                        title="Drag to reorder"
                                                                    >
                                                                        <GripVertical className="w-3 h-3 text-gray-400" />
                                                                    </div>

                                                                    <div
                                                                        className="flex items-center cursor-pointer flex-1 min-w-0"
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
                                                                        {goal.collapsed ? (
                                                                            <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
                                                                        ) : (
                                                                            <ChevronDown className="w-4 h-4 mr-2 flex-shrink-0" />
                                                                        )}
                                                                        <Target className="w-4 h-4 mr-2 flex-shrink-0" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center">
                                                                                <span className="font-medium truncate select-none">{goal.name}</span>
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
                                                                                    {goal.fundingProgress.toFixed(0)}%
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
                                                                </div>

                                                                <div className="flex items-center space-x-3 flex-shrink-0">
                                                                    <div className="text-right">
                                                                        <div className="font-semibold select-none">
                                                                            {viewMode === 'amount'
                                                                                ? `$${goal.biweeklyAmount.toFixed(2)}`
                                                                                : `${goal.percentage.toFixed(1)}%`
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 select-none">bi-weekly</div>
                                                                    </div>
                                                                    <div className="flex space-x-1">
                                                                        <div className="flex flex-col">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onMoveGoal(goal.id, 'up');
                                                                                }}
                                                                                disabled={goalIndex === 0}
                                                                                className={`p-1 rounded ${goalIndex === 0 ? 'text-gray-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                                            >
                                                                                <ChevronUp className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onMoveGoal(goal.id, 'down');
                                                                                }}
                                                                                disabled={goalIndex === category.goals.length - 1}
                                                                                className={`p-1 rounded ${goalIndex === category.goals.length - 1 ? 'text-gray-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                                            >
                                                                                <ChevronDown className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onEditGoal(goal);
                                                                            }}
                                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                                                        >
                                                                            <Edit2 className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onDeleteGoal(goal);
                                                                            }}
                                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-400"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {!goal.collapsed && (
                                                            <div className="px-3 pb-3 bg-green-200">
                                                                <div className="text-sm text-gray-700 dark:text-gray-400 mb-2">
                                                                    Target: ${goal.targetAmount.toLocaleString()} by {goal.targetDate}
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span>
                                                                            Progress: ${goal.alreadySaved || 0} / ${goal.targetAmount.toLocaleString()}
                                                                        </span>
                                                                        <span>{goal.fundingProgress.toFixed(0)}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className={`h-2 rounded-full ${goal.isFullyFunded ? 'bg-green-500' : 'bg-green-400'
                                                                                }`}
                                                                            style={{ width: `${Math.min(100, goal.fundingProgress)}%` }}
                                                                        ></div>
                                                                    </div>

                                                                    {goal.remainingNeeded > 0 && (
                                                                        <div className="text-xs text-green-700">
                                                                            ${goal.remainingNeeded.toLocaleString()} remaining to save
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </DraggableGoal>
                                            ))}
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