import UnifiedCategoryCard from '../../components/UnifiedCategoryCard';
import { createMockCategory, createMockTransaction, render, screen, user } from '../test-utils';

describe('UnifiedCategoryCard', () => {
    const mockCategory = createMockCategory({
        id: 1,
        name: 'Groceries',
        color: 'bg-blue-500',
        allocated: 500,
        spent: 300
    });

    const mockExpenses = [
        createMockTransaction({
            id: 1,
            categoryId: 1,
            name: 'Weekly Groceries',
            amount: 200,
            biweeklyAmount: 100,
            frequency: 'weekly'
        }),
        createMockTransaction({
            id: 2,
            categoryId: 1,
            name: 'Special Diet Items',
            amount: 100,
            biweeklyAmount: 50,
            frequency: 'weekly'
        })
    ];

    const mockSavingsGoals = [
        {
            id: 1,
            categoryId: 1,
            name: 'Emergency Groceries',
            targetAmount: 1000,
            alreadySaved: 200,
            biweeklyAmount: 50
        }
    ];

    const defaultProps = {
        category: mockCategory,
        expenses: mockExpenses,
        savingsGoals: mockSavingsGoals,
        viewMode: 'planning',
        onFund: jest.fn(),
        onEditCategory: jest.fn(),
        onDeleteCategory: jest.fn(),
        onAddItem: jest.fn(),
        onEditExpense: jest.fn(),
        onEditGoal: jest.fn(),
        onDeleteExpense: jest.fn(),
        onDeleteGoal: jest.fn(),
        frequencyOptions: [
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders category information correctly', () => {
        render(<UnifiedCategoryCard {...defaultProps} />);

        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('$200.00 available')).toBeInTheDocument();
        expect(screen.getByText('$150.00/bi-weekly planned')).toBeInTheDocument();
    });

    it('handles category collapse/expand', async () => {
        render(<UnifiedCategoryCard {...defaultProps} />);

        // Initially expanded
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();

        // Click to collapse
        await user.click(screen.getByText('Groceries'));
        expect(screen.queryByText('Weekly Groceries')).not.toBeInTheDocument();

        // Click to expand
        await user.click(screen.getByText('Groceries'));
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
    });

    it('shows funding interface in funding mode', async () => {
        render(<UnifiedCategoryCard {...defaultProps} viewMode="funding" />);

        const amountInput = screen.getByPlaceholderText('Amount');
        const fundButton = screen.getByText('Fund');

        await user.type(amountInput, '100');
        await user.click(fundButton);

        expect(defaultProps.onFund).toHaveBeenCalledWith(mockCategory.id, 100);
    });

    it('displays overspent status when applicable', () => {
        const overspentCategory = {
            ...mockCategory,
            allocated: 200,
            spent: 300
        };

        render(<UnifiedCategoryCard {...defaultProps} category={overspentCategory} />);

        expect(screen.getByText('-$100.00 available')).toHaveClass('text-theme-red');
        expect(screen.getByText('Overspent')).toBeInTheDocument();
    });

    it('handles expense deletion', async () => {
        render(<UnifiedCategoryCard {...defaultProps} />);

        const deleteButtons = screen.getAllByTitle('Delete expense');
        await user.click(deleteButtons[0]);

        expect(defaultProps.onDeleteExpense).toHaveBeenCalledWith(mockExpenses[0]);
    });

    it('handles goal deletion', async () => {
        render(<UnifiedCategoryCard {...defaultProps} />);

        const deleteButtons = screen.getAllByTitle('Delete goal');
        await user.click(deleteButtons[0]);

        expect(defaultProps.onDeleteGoal).toHaveBeenCalledWith(mockSavingsGoals[0]);
    });

    it('displays savings goal progress', () => {
        render(<UnifiedCategoryCard {...defaultProps} />);

        expect(screen.getByText('20%')).toBeInTheDocument();
        expect(screen.getByText('$200 saved')).toBeInTheDocument();
    });

    it('handles adding new items', async () => {
        render(<UnifiedCategoryCard {...defaultProps} />);

        const addButton = screen.getByTitle('Add item to this category');
        await user.click(addButton);

        expect(defaultProps.onAddItem).toHaveBeenCalledWith(mockCategory.id);
    });

    it('shows correct funding status based on allocated amount', () => {
        // Fully funded
        const fullyFundedCategory = {
            ...mockCategory,
            allocated: 1000,
            spent: 300
        };
        const { rerender } = render(<UnifiedCategoryCard {...defaultProps} category={fullyFundedCategory} />);
        expect(screen.getByText('Fully funded')).toBeInTheDocument();

        // Partially funded
        const partiallyFundedCategory = {
            ...mockCategory,
            allocated: 600,
            spent: 300
        };
        rerender(<UnifiedCategoryCard {...defaultProps} category={partiallyFundedCategory} />);
        expect(screen.getByText('Partially funded')).toBeInTheDocument();

        // Needs funding
        const needsFundingCategory = {
            ...mockCategory,
            allocated: 400,
            spent: 300
        };
        rerender(<UnifiedCategoryCard {...defaultProps} category={needsFundingCategory} />);
        expect(screen.getByText('Needs funding')).toBeInTheDocument();
    });

    it('displays timeline messages when provided', () => {
        const timeline = {
            timelines: {
                all: [
                    {
                        id: 1,
                        type: 'expense',
                        urgencyIndicator: {
                            emoji: '⚠️',
                            label: 'High',
                            color: 'red'
                        },
                        timeline: {
                            message: 'Due in 2 days'
                        }
                    }
                ]
            }
        };

        render(<UnifiedCategoryCard {...defaultProps} timeline={timeline} />);

        expect(screen.getByText('Due in 2 days')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
    });
});
