// ***********************************************
// Custom commands for Budgie app testing
// ***********************************************

// Command to add a test transaction
Cypress.Commands.add('addTransaction', (transaction) => {
    cy.contains('Add Transaction').click();

    if (transaction.transfer) {
        cy.contains('This is a transfer between accounts').click();
        cy.get('select').first().select(transaction.fromAccount);
        cy.get('select').eq(1).select(transaction.toAccount);
    } else {
        cy.get('input[placeholder="Payee (e.g., Employer, Store Name)"]').type(transaction.payee);
        cy.get('select').first().select(transaction.account);
        if (!transaction.isIncome) {
            cy.get('select').eq(2).select(transaction.category);
        }
    }

    cy.get('input[placeholder="0.00"]').type(transaction.amount.toString());

    if (transaction.memo) {
        cy.get('input[placeholder="Additional details..."]').type(transaction.memo);
    }

    if (transaction.cleared) {
        cy.get('input[type="checkbox"]').first().check();
    }

    cy.contains('Add Transaction').click();
});

// Command to add a test category
Cypress.Commands.add('addCategory', (category) => {
    cy.contains('Add Category').click();
    cy.get('input[placeholder="Category Name"]').type(category.name);
    if (category.color) {
        cy.get('select[name="color"]').select(category.color);
    }
    cy.contains('button', 'Add Category').click();
});

// Command to add multiple test transactions
Cypress.Commands.add('setupTestTransactions', () => {
    const transactions = [
        {
            payee: 'Grocery Store',
            amount: -50.00,
            account: 'Checking',
            category: 'Groceries',
            memo: 'Weekly groceries',
            cleared: true
        },
        {
            payee: 'Employer',
            amount: 1000.00,
            account: 'Checking',
            isIncome: true,
            cleared: true
        },
        {
            transfer: true,
            fromAccount: 'Checking',
            toAccount: 'Savings',
            amount: 100.00
        }
    ];

    transactions.forEach(transaction => {
        cy.addTransaction(transaction);
    });
});

// Command to verify transaction exists
Cypress.Commands.add('verifyTransaction', (transaction) => {
    if (transaction.transfer) {
        cy.contains(`Transfer to ${transaction.toAccount}`).should('exist');
    } else {
        cy.contains(transaction.payee).should('exist');
    }

    const amount = transaction.amount < 0 ?
        `-$${Math.abs(transaction.amount).toFixed(2)}` :
        `$${transaction.amount.toFixed(2)}`;
    cy.contains(amount).should('exist');

    if (transaction.memo) {
        cy.contains(transaction.memo).should('exist');
    }
});

// Command to set up test categories
Cypress.Commands.add('setupTestCategories', () => {
    const categories = [
        { name: 'Groceries', color: 'bg-blue-500' },
        { name: 'Utilities', color: 'bg-green-500' },
        { name: 'Entertainment', color: 'bg-purple-500' }
    ];

    categories.forEach(category => {
        cy.addCategory(category);
    });
});

// Command to verify category exists
Cypress.Commands.add('verifyCategory', (category) => {
    cy.contains(category.name).should('exist');
    if (category.allocated) {
        cy.contains(`$${category.allocated.toFixed(2)} allocated`).should('exist');
    }
    if (category.spent) {
        cy.contains(`$${category.spent.toFixed(2)} spent`).should('exist');
    }
});

// Command to fund a category
Cypress.Commands.add('fundCategory', (categoryName, amount) => {
    cy.contains(categoryName)
        .parents('.bg-theme-primary')
        .within(() => {
            cy.get('input[placeholder="Amount"]').type(amount.toString());
            cy.contains('Fund').click();
        });
});

// Command to clear all data (useful for test cleanup)
Cypress.Commands.add('clearTestData', () => {
    cy.window().then((win) => {
        win.localStorage.clear();
    });
    cy.reload();
});

// Command to verify summary amounts
Cypress.Commands.add('verifySummaryAmounts', ({ income, expenses, net }) => {
    if (income !== undefined) {
        cy.contains('Total Income').parent().contains(`$${income.toFixed(2)}`);
    }
    if (expenses !== undefined) {
        cy.contains('Total Expenses').parent().contains(`$${expenses.toFixed(2)}`);
    }
    if (net !== undefined) {
        cy.contains('Net Amount').parent().contains(`$${net.toFixed(2)}`);
    }
});
