// Import commands.js using ES2015 syntax:
import './commands';

// Prevent uncaught exception from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from failing the test
    return false;
});

// Preserve localStorage between tests
beforeEach(() => {
    cy.restoreLocalStorage();
});

afterEach(() => {
    cy.saveLocalStorage();
});

// Add custom assertion for checking theme
chai.Assertion.addMethod('hasThemeClass', function (className) {
    const obj = this._obj;
    const hasClass = obj.hasClass(className);
    this.assert(
        hasClass,
        `expected #{this} to have theme class '${className}'`,
        `expected #{this} not to have theme class '${className}'`,
        className
    );
});

// Add localStorage helpers to Cypress
const LOCAL_STORAGE_MEMORY = {};

Cypress.Commands.add('saveLocalStorage', () => {
    Object.keys(localStorage).forEach(key => {
        LOCAL_STORAGE_MEMORY[key] = localStorage[key];
    });
});

Cypress.Commands.add('restoreLocalStorage', () => {
    Object.keys(LOCAL_STORAGE_MEMORY).forEach(key => {
        localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
    });
});
