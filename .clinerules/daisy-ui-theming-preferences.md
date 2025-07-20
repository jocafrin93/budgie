## Brief overview
Project-specific guidelines for implementing DaisyUI theme integration in React applications, focusing on semantic color usage, CSS Variable Bridge patterns, and code quality standards.

## DaisyUI Integration Approach
- Always prefer CSS Variable Bridge over component-by-component conversion for scalability
- Use DaisyUI semantic classes (`bg-base-100`, `text-base-content`, `text-primary`) over specific color values
- Map DaisyUI theme variables to existing CSS custom properties for backward compatibility
- Implement theme switching through context providers with localStorage persistence

## CSS and Styling Conventions
- Use semantic color classes with opacity modifiers (e.g., `text-base-content/70`, `text-base-content/60`)
- Replace hardcoded light/dark mode classes with DaisyUI semantic equivalents
- Maintain consistent border and background theming using `border-base-300`, `bg-base-200`
- Add `backdrop-blur-sm` for navigation components that need visual separation

## Code Quality Standards
- Remove unused imports and variables before task completion
- Clean up commented code and temporary debugging statements
- Ensure all components use consistent DaisyUI class naming patterns
- Verify theme switching works across all implemented components

## Component Update Patterns
- Navigation components should use `bg-base-100` or `bg-base-200` for backgrounds
- Active states should use `text-primary` for consistency
- Inactive states should use `text-base-content/60` with hover states at `/80`
- Progress bars and dividers should use `bg-base-300` for neutral backgrounds

## Testing and Validation
- Request manual testing rather than automated browser testing when possible
- Focus on theme switching validation across multiple DaisyUI themes
- Verify both mobile and desktop responsive behavior
- Ensure proper contrast and readability in all theme variants
