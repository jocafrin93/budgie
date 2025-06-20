import { rest } from 'msw';

// Define handlers for mocking API requests
export const handlers = [
    // Example handler for future API endpoints
    rest.get('/api/transactions', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                // Sample transaction data
                {
                    id: 1,
                    date: '2025-06-19',
                    payee: 'Sample Payee',
                    amount: -50.00,
                    categoryId: 1,
                    accountId: 1,
                    memo: 'Test transaction',
                    cleared: false,
                }
            ])
        );
    }),
];
