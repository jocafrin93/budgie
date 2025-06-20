# Testing Strategy

This document outlines the testing strategy for the Budgie app, including different types of tests, how to run them, and best practices.

## Test Types

### 1. Unit Tests
Located in `src/__tests__/components`, `src/__tests__/hooks`, and `src/__tests__/utils`
- Test individual components, hooks, and utility functions
- Focus on isolated functionality
- Use Jest and React Testing Library
- Mock external dependencies

### 2. Integration Tests
Located in `src/__tests__/integration`
- Test interactions between components
- Focus on feature workflows
- Verify data flow and state management
- Use Jest and React Testing Library

### 3. End-to-End Tests
Located in `cypress/e2e`
- Test complete user workflows
- Simulate real user interactions
- Verify application behavior from user perspective
- Use Cypress

## Running Tests

### Unit and Integration Tests
```bash
# Run all Jest tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- TransactionsTab.test.js
```

### End-to-End Tests
```bash
# Open Cypress Test Runner
npm run test:e2e:open

# Run Cypress tests headlessly
npm run test:e2e

# Run all tests (Jest + Cypress)
npm run test:all
```

## Test Files Structure

```
src/
├── __tests__/
│   ├── components/      # Component tests
│   ├── hooks/          # Hook tests
│   ├── utils/          # Utility function tests
│   └── integration/    # Integration tests
├── __mocks__/          # Mock implementations
└── __fixtures__/       # Test data

cypress/
├── e2e/               # End-to-end tests
├── fixtures/          # Test data for E2E tests
└── support/           # Support files and commands
```

## Testing Utilities

### 1. Test Utils (`src/__tests__/test-utils.js`)
- Custom render function with common providers
- Mock data generators
- Common test assertions
- Helper functions

### 2. Cypress Commands (`cypress/support/commands.js`)
- Custom Cypress commands for common operations
- Test data setup helpers
- Verification utilities

## Best Practices

### Component Tests
1. Test component rendering
2. Test user interactions
3. Test prop variations
4. Test error states
5. Test loading states
6. Test edge cases

### Hook Tests
1. Test initial state
2. Test state updates
3. Test side effects
4. Test cleanup
5. Test error handling

### Integration Tests
1. Test feature workflows
2. Test component interactions
3. Test data flow
4. Test state management
5. Test error boundaries

### E2E Tests
1. Test critical user paths
2. Test form submissions
3. Test data persistence
4. Test error handling
5. Test responsive behavior

## Test Coverage

We aim for:
- 90%+ coverage for utility functions
- 80%+ coverage for hooks
- 70%+ coverage for components
- Key user workflows covered by E2E tests

## Mocking

### MSW (Mock Service Worker)
- Used for mocking API requests
- Configured in `src/__mocks__/handlers.js`
- Enables testing of API integration

### Jest Mocks
- Used for mocking modules and functions
- Located in `src/__mocks__/`
- Helps isolate components for testing

## Continuous Integration

Tests are run:
1. On every pull request
2. Before deployment
3. Nightly on main branch

## Adding New Tests

When adding new features:
1. Add unit tests for new components/functions
2. Add integration tests for feature workflows
3. Add E2E tests for critical user paths
4. Update existing tests as needed
5. Verify test coverage

## Debugging Tests

### Jest Tests
- Use `console.log` for basic debugging
- Use `debug()` from React Testing Library
- Use Jest snapshot testing for UI changes

### Cypress Tests
- Use `cy.pause()` to pause test execution
- Use `.debug()` to inspect elements
- Use Cypress Test Runner for visual debugging

## Common Testing Patterns

### Testing Async Operations
```javascript
test('async operation', async () => {
    await waitFor(() => {
        expect(element).toBeInTheDocument();
    });
});
```

### Testing User Events
```javascript
test('user interaction', async () => {
    await user.type(input, 'test');
    await user.click(button);
    expect(result).toBeInTheDocument();
});
```

### Testing Error States
```javascript
test('error handling', async () => {
    server.use(
        rest.get('/api/data', (req, res, ctx) => {
            return res(ctx.status(500));
        })
    );
    // Test error state
});
