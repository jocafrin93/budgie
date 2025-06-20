import TransactionsTab from '../../components/TransactionsTab';
import { createMockAccount, createMockCategory, createMockTransaction, render, screen, user } from '../test-utils';

describe('TransactionsTab', () => {
    const mockAccounts = [
        createMockAccount({ id: 1, name: 'Checking' }),
        createMockAccount({ id: 2, name: 'Savings' })
    ];

    const mockCategories = [
        createMockCategory({ id: 1, name: 'Groceries' }),
        createMockCategory({ id: 2, name: 'Utilities' })
    ];

    const mockTransactions = [
        createMockTransaction({
            id: 1,
            date: '2025-06-19',
            payee: 'Grocery Store',
            amount: -50.00,
            categoryId: 1,
            accountId: 1,
            cleared: true
        }),
        createMockTransaction({
            id: 2,
            date: '2025-06-19',
            payee: 'Salary',
            amount: 1000.00,
            accountId: 1,
            cleared: false
        }),
        createMockTransaction({
            id: 3,
            date: '2025-06-19',
            payee: 'Transfer',
            amount: 100.00,
            accountId: 1,
            transferAccountId: 2,
            transfer: true
        })
    ];

    const defaultProps = {
        transactions: mockTransactions,
        accounts: mockAccounts,
        categories: mockCategories,
        darkMode: false,
        onAddTransaction: jest.fn(),
        onEditTransaction: jest.fn(),
        onDeleteTransaction: jest.fn()
    };

    it('renders without crashing', () => {
        render(<TransactionsTab {...defaultProps} />);
        expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    it('displays correct number of transactions', () => {
        render(<TransactionsTab {...defaultProps} />);
        expect(screen.getByText('3 transactions')).toBeInTheDocument();
    });

    it('filters transactions by type', async () => {
        render(<TransactionsTab {...defaultProps} />);

        // Filter by income
        const typeFilter = screen.getByLabelText('Transaction Type');
        await user.selectOptions(typeFilter, 'income');

        // Should only show the salary transaction
        expect(screen.getByText('Salary')).toBeInTheDocument();
        expect(screen.queryByText('Grocery Store')).not.toBeInTheDocument();
    });

    it('filters transactions by search term', async () => {
        render(<TransactionsTab {...defaultProps} />);

        const searchInput = screen.getByPlaceholderText(/search transactions/i);
        await user.type(searchInput, 'Grocery');

        expect(screen.getByText('Grocery Store')).toBeInTheDocument();
        expect(screen.queryByText('Salary')).not.toBeInTheDocument();
    });

    it('handles transaction deletion', async () => {
        render(<TransactionsTab {...defaultProps} />);

        const deleteButtons = screen.getAllByTitle('Delete');
        await user.click(deleteButtons[0]);

        expect(defaultProps.onDeleteTransaction).toHaveBeenCalledWith({
            type: 'transaction',
            id: mockTransactions[0].id,
            name: mockTransactions[0].payee,
            message: 'Delete this transaction?',
        });
    });

    it('displays correct transaction amounts', () => {
        render(<TransactionsTab {...defaultProps} />);

        // Find amounts by their class and parent class
        const amounts = screen.getAllByText((content, element) => {
            const isInAmountColumn = element.closest('.col-span-2.flex.items-center.justify-end');
            return element.classList.contains('font-semibold') && isInAmountColumn;
        });

        const amountTexts = amounts.map(el => el.textContent);
        expect(amountTexts).toContain('-$50.00');
        expect(amountTexts).toContain('$1,000.00');
        expect(amountTexts).toContain('$100.00');
    });

    it('shows cleared status indicator', () => {
        render(<TransactionsTab {...defaultProps} />);

        const clearedTransaction = screen.getByText('Grocery Store')
            .closest('.grid-cols-12');
        expect(clearedTransaction).toHaveTextContent('✓');
    });
});
