import AddTransactionForm from '../../components/AddTransactionForm';
import { createMockAccount, createMockCategory, render, screen, user } from '../test-utils';

describe('AddTransactionForm', () => {
    const mockAccounts = [
        createMockAccount({ id: 1, name: 'Checking' }),
        createMockAccount({ id: 2, name: 'Savings' })
    ];

    const mockCategories = [
        createMockCategory({ id: 1, name: 'Groceries' }),
        createMockCategory({ id: 2, name: 'Utilities' })
    ];

    const defaultProps = {
        onSave: jest.fn(),
        onCancel: jest.fn(),
        accounts: mockAccounts,
        categories: mockCategories,
        darkMode: false
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all form fields', () => {
        render(<AddTransactionForm {...defaultProps} />);

        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/payee/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/memo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/cleared/i)).toBeInTheDocument();
    });

    it('handles expense transaction submission', async () => {
        render(<AddTransactionForm {...defaultProps} />);

        // Fill out form
        await user.type(screen.getByLabelText(/payee/i), 'Grocery Store');
        await user.type(screen.getByLabelText(/amount/i), '-50.00');
        await user.selectOptions(screen.getByLabelText(/category/i), '1');
        await user.type(screen.getByLabelText(/memo/i), 'Weekly groceries');
        await user.click(screen.getByLabelText(/cleared/i));

        // Submit form
        await user.click(screen.getByText(/add transaction/i));

        // Verify submission
        expect(defaultProps.onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                payee: 'Grocery Store',
                amount: -50.00,
                categoryId: 1,
                memo: 'Weekly groceries',
                cleared: true,
                isIncome: false
            }),
            false
        );
    });

    it('handles income transaction submission', async () => {
        render(<AddTransactionForm {...defaultProps} />);

        await user.type(screen.getByLabelText(/payee/i), 'Salary');
        await user.type(screen.getByLabelText(/amount/i), '1000.00');

        await user.click(screen.getByText(/add transaction/i));

        expect(defaultProps.onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                payee: 'Salary',
                amount: 1000.00,
                categoryId: null,
                isIncome: true
            }),
            false
        );
    });

    it('handles transfer transaction submission', async () => {
        render(<AddTransactionForm {...defaultProps} />);

        await user.click(screen.getByLabelText(/transfer/i));
        await user.selectOptions(screen.getByLabelText(/transfer to account/i), '2');
        await user.type(screen.getByLabelText(/amount/i), '100.00');

        await user.click(screen.getByText(/add transaction/i));

        expect(defaultProps.onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                transfer: true,
                transferAccountId: 2,
                amount: 100.00,
                categoryId: null
            }),
            false
        );
    });

    it('validates required fields', async () => {
        render(<AddTransactionForm {...defaultProps} />);

        const submitButton = screen.getByText(/add transaction/i);
        expect(submitButton).toBeDisabled();

        await user.type(screen.getByLabelText(/payee/i), 'Test');
        expect(submitButton).toBeDisabled();

        await user.type(screen.getByLabelText(/amount/i), '50.00');
        expect(submitButton).not.toBeDisabled();
    });

    it('handles save and add another', async () => {
        render(<AddTransactionForm {...defaultProps} />);

        await user.type(screen.getByLabelText(/payee/i), 'Test');
        await user.type(screen.getByLabelText(/amount/i), '50.00');

        await user.click(screen.getByTitle('Save and add another'));

        expect(defaultProps.onSave).toHaveBeenCalledWith(
            expect.any(Object),
            true
        );
    });

    it('handles cancel', async () => {
        render(<AddTransactionForm {...defaultProps} />);

        await user.click(screen.getByText('Cancel'));

        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('pre-fills form when editing transaction', () => {
        const transaction = {
            date: '2025-06-19',
            payee: 'Existing Payee',
            amount: -75.00,
            categoryId: 2,
            accountId: 1,
            memo: 'Existing memo',
            cleared: true
        };

        render(<AddTransactionForm {...defaultProps} transaction={transaction} />);

        expect(screen.getByLabelText(/payee/i)).toHaveValue('Existing Payee');
        expect(screen.getByLabelText(/amount/i)).toHaveValue('-75.00');
        expect(screen.getByLabelText(/category/i)).toHaveValue('2');
        expect(screen.getByLabelText(/memo/i)).toHaveValue('Existing memo');
        expect(screen.getByLabelText(/cleared/i)).toBeChecked();
    });
});
