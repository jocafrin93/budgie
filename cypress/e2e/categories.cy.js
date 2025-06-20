describe('Category Management', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.clearTestData();
        cy.setupTestCategories();
    });

    it('should handle basic category operations', () => {
        // Add a new category
        cy.addCategory({
            name: 'Test Category',
            color: 'bg-red-500'
        });

        // Verify category was added
        cy.verifyCategory({
            name: 'Test Category',
            allocated: 0,
            spent: 0
        });

        // Edit category
        cy.contains('Test Category')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.get('[title="Edit category"]').click();
            });

        cy.get('input[placeholder="Category Name"]').clear().type('Updated Category');
        cy.contains('button', 'Update Category').click();

        // Verify changes
        cy.contains('Updated Category').should('exist');
        cy.contains('Test Category').should('not.exist');

        // Delete category
        cy.contains('Updated Category')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.get('[title="Delete category"]').click();
            });

        cy.contains('Delete this category?');
        cy.contains('button', 'Delete').click();

        cy.contains('Updated Category').should('not.exist');
    });

    it('should handle category funding', () => {
        // Fund a category
        cy.fundCategory('Groceries', 200);

        // Verify funding
        cy.verifyCategory({
            name: 'Groceries',
            allocated: 200,
            spent: 0
        });

        // Add an expense
        cy.addTransaction({
            payee: 'Grocery Store',
            amount: -150,
            account: 'Checking',
            category: 'Groceries',
            memo: 'Weekly groceries'
        });

        // Verify remaining amount
        cy.contains('Groceries')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.contains('$50.00 available').should('exist');
            });
    });

    it('should handle overspending', () => {
        // Fund category with $100
        cy.fundCategory('Groceries', 100);

        // Add expense that exceeds funding
        cy.addTransaction({
            payee: 'Grocery Store',
            amount: -150,
            account: 'Checking',
            category: 'Groceries',
            memo: 'Overspent groceries'
        });

        // Verify overspent status
        cy.contains('Groceries')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.contains('-$50.00 available').should('have.class', 'text-theme-red');
                cy.contains('Overspent').should('exist');
            });

        // Add more funding to cover overspending
        cy.fundCategory('Groceries', 50);

        // Verify balance is now zero
        cy.contains('Groceries')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.contains('$0.00 available').should('exist');
                cy.contains('Overspent').should('not.exist');
            });
    });

    it('should handle multiple expenses in category', () => {
        // Fund category
        cy.fundCategory('Utilities', 300);

        // Add multiple expenses
        const expenses = [
            {
                payee: 'Electric Company',
                amount: -100,
                category: 'Utilities',
                memo: 'Electricity bill'
            },
            {
                payee: 'Water Company',
                amount: -75,
                category: 'Utilities',
                memo: 'Water bill'
            },
            {
                payee: 'Internet Provider',
                amount: -80,
                category: 'Utilities',
                memo: 'Internet bill'
            }
        ];

        expenses.forEach(expense => {
            cy.addTransaction({
                ...expense,
                account: 'Checking'
            });
        });

        // Verify category totals
        cy.contains('Utilities')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.contains('$45.00 available').should('exist');
                cy.contains('$255.00 spent').should('exist');
                cy.contains('3 items').should('exist');
            });
    });

    it('should handle category collapse/expand', () => {
        // Add some expenses
        cy.addTransaction({
            payee: 'Movie Theater',
            amount: -50,
            account: 'Checking',
            category: 'Entertainment',
            memo: 'Movie night'
        });

        // Initially expanded
        cy.contains('Entertainment')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.contains('Movie Theater').should('be.visible');
                cy.contains('Movie night').should('be.visible');
            });

        // Collapse category
        cy.contains('Entertainment').click();
        cy.contains('Movie Theater').should('not.be.visible');
        cy.contains('Movie night').should('not.be.visible');

        // Expand category
        cy.contains('Entertainment').click();
        cy.contains('Movie Theater').should('be.visible');
        cy.contains('Movie night').should('be.visible');
    });

    it('should show correct funding status indicators', () => {
        // Test fully funded
        cy.fundCategory('Groceries', 200);
        cy.contains('Groceries')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.contains('Fully funded').should('exist');
            });

        // Test partially funded
        cy.addTransaction({
            payee: 'Grocery Store',
            amount: -150,
            account: 'Checking',
            category: 'Groceries'
        });
        cy.contains('Groceries')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.contains('$50.00 available').should('exist');
                cy.contains('Partially funded').should('exist');
            });

        // Test overspent
        cy.addTransaction({
            payee: 'Grocery Store',
            amount: -100,
            account: 'Checking',
            category: 'Groceries'
        });
        cy.contains('Groceries')
            .parents('.bg-theme-primary')
            .within(() => {
                cy.contains('-$50.00 available').should('exist');
                cy.contains('Overspent').should('exist');
            });
    });
});
