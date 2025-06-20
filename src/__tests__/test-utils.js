import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Sample test data generators
export const createMockTransaction = (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    date: '2025-06-19',
    payee: 'Test Payee',
    amount: -50.00,
    categoryId: 1,
    accountId: 1,
    memo: 'Test transaction',
    cleared: false,
    ...overrides
});

export const createMockCategory = (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    name: 'Test Category',
    color: 'bg-blue-500',
    allocated: 0,
    spent: 0,
    ...overrides
});

export const createMockAccount = (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    name: 'Test Account',
    balance: 1000,
    type: 'checking',
    ...overrides
});

// Custom render function that includes common providers/context
const customRender = (ui, options = {}) => {
    const {
        initialTransactions = [],
        initialCategories = [],
        initialAccounts = [],
        darkMode = false,
        ...renderOptions
    } = options;

    // Add any providers here
    const Wrapper = ({ children }) => {
        return (
            <div className={darkMode ? 'dark' : ''}>
                {children}
            </div>
        );
    };

    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Helper for simulating user interactions
export const user = userEvent;

// Common test assertions
export const expectTextContent = (element, text) => {
    expect(element).toHaveTextContent(text);
};

export const expectToBeVisible = (element) => {
    expect(element).toBeVisible();
};

export const expectToBeDisabled = (element) => {
    expect(element).toBeDisabled();
};

// Helper for waiting for elements
export const waitForElement = async (getElement) => {
    let element;
    try {
        element = await waitFor(() => {
            const el = getElement();
            expect(el).toBeInTheDocument();
            return el;
        });
    } catch (error) {
        throw new Error(`Element not found: ${error.message}`);
    }
    return element;
};

// Helper for mocking window methods
export const mockWindowMethods = () => {
    const original = window;
    beforeAll(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        });
    });

    afterAll(() => {
        window = original;
    });
};
