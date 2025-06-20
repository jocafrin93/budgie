describe('Transaction Management', () => {
    beforeEach(() => {
        // Visit the app before each test
        cy.visit('http://localhost:3000');
    });

    it('should add a new expense transaction', () => {
        // Click add transaction button
        cy.contains('Add Transaction').click();

        // Fill out the transaction form
        cy.get('input[placeholder="Payee (e.g., Employer, Store Name)"]').type('Grocery Store');
        cy.get('input[placeholder="0.00"]').type('-50.00');
        cy.get('select').first().select('Checking'); // Select account
        cy.get('select').eq(2).select('Groceries'); // Select category
        cy.get('input[placeholder="Additional details..."]').type('Weekly groceries');
        cy.get('input[type="checkbox"]').first().check(); // Mark as cleared

        // Submit the form
        cy.contains('Add Transaction').click();

        // Verify the transaction appears in the list
        cy.contains('Grocery Store').should('exist');
        cy.contains('-$50.00').should('exist');
        cy.contains('Weekly groceries').should('exist');
    });

    it('should add a new income transaction', () => {
        cy.contains('Add Transaction').click();

        cy.get('input[placeholder="Payee (e.g., Employer, Store Name)"]').type('Employer');
        cy.get('input[placeholder="0.00"]').type('1000.00');
        cy.get('select').first().select('Checking');

        cy.contains('Add Transaction').click();

        cy.contains('Employer').should('exist');
        cy.contains('$1,000.00').should('exist');
        cy.contains('Income Transaction').should('exist');
    });

    it('should handle transaction filtering', () => {
        // Add test transactions if needed
        // Filter by type
        cy.get('select').contains('All Types').parent().select('income');
        cy.contains('Grocery Store').should('not.exist');
        cy.contains('Employer').should('exist');

        // Filter by search
        cy.get('input[placeholder="Search transactions..."]').type('Grocery');
        cy.contains('Grocery Store').should('exist');
        cy.contains('Employer').should('not.exist');

        // Clear filters
        cy.contains('Clear Filters').click();
        cy.contains('Grocery Store').should('exist');
        cy.contains('Employer').should('exist');
    });

    it('should edit an existing transaction', () => {
        // Find and click edit button for first transaction
        cy.get('[title="Edit"]').first().click();

        // Modify the transaction
        cy.get('input[placeholder="Payee (e.g., Employer, Store Name)"]').clear().type('Updated Store');
        cy.get('input[placeholder="0.00"]').clear().type('-75.00');

        // Save changes
        cy.contains('Update Transaction').click();

        // Verify changes
        cy.contains('Updated Store').should('exist');
        cy.contains('-$75.00').should('exist');
    });

    it('should delete a transaction', () => {
        // Store initial transaction count
        cy.get('.grid-cols-12').its('length').then((initialCount) => {
            // Click delete button for first transaction
            cy.get('[title="Delete"]').first().click();

            // Confirm deletion
            cy.contains('Delete this transaction?');
            cy.contains('button', 'Delete').click();

            // Verify transaction was removed
            cy.get('.grid-cols-12').should('have.length', initialCount - 1);
        });
    });

    it('should handle transfer between accounts', () => {
        cy.contains('Add Transaction').click();

        // Check transfer checkbox
        cy.contains('This is a transfer between accounts').click();

        // Select accounts and amount
        cy.get('select').first().select('Checking');
        cy.get('select').eq(1).select('Savings');
        cy.get('input[placeholder="0.00"]').type('100.00');

        cy.contains('Add Transaction').click();

        // Verify transfer appears correctly
        cy.contains('Transfer to Savings').should('exist');
        cy.contains('$100.00').should('exist');
    });

    it('should show correct transaction summaries', () => {
        // Add some test transactions if needed
        // Check summary calculations
        cy.contains('Total Income').parent().contains('$1,000.00');
        cy.contains('Total Expenses').parent().contains('$50.00');
        cy.contains('Net Amount').parent().contains('$950.00');
    });
});
