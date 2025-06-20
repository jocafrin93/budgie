const { http } = require('msw');
const { setupServer } = require('msw/node');

// Define handlers using v2 syntax
const handlers = [
    http.get('/api/transactions', () => {
        return new Response(
            JSON.stringify([
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
            ]),
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }),
];

// Setup requests interception using the given handlers.
const server = setupServer(...handlers);

module.exports = { server, handlers };
