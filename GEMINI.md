# CampusConnect Development Guidelines

## Coding Standards

### TypeScript & Type Safety
- **Strict Typing:** Always use the most specific types possible.
- **No `any`:** Avoid using the `any` type unless it is strictly necessary (e.g., when dealing with external libraries that lack proper type definitions). Prefer `unknown` if the type is truly dynamic.
- **Interfaces & Types:** Define clear interfaces for all DTOs, API responses, and shared data structures in `@campus-connect/types`.

### Functional Programming & Performance
- **Avoid Imperative Loops:** Do not use `for` or `while` loops unless there is a significant performance reason or no functional alternative. Use higher-order functions like `.map()`, `.filter()`, `.reduce()`, `.forEach()`, and `.some()`.
- **Efficient DSA:** Always select the most efficient Data Structures and Algorithms for the task. For example, use `Set` or `Map` for O(1) lookups instead of `.find()` on an array when dealing with large datasets.
- **Optimistic UI:** Implement optimistic updates on the frontend for social interactions (votes, likes) to enhance the perceived speed of the PWA.

### Backend (NestJS)
- **Dependency Injection:** Strictly follow NestJS DI patterns.
- **Validation:** Use `class-validator` and `class-transformer` for all incoming request payloads.
- **Error Handling:** Use custom `ExceptionFilters` or standard NestJS exceptions for consistent API error responses.

### Testing
- **Unit Tests:** Mandatory for all business logic.
- **Edge Cases:** Tests must explicitly cover boundary conditions, null/undefined inputs, and error states.
- **Integration Tests:** Required for API endpoints that interact with the database.

## Workflow
1. **Research:** Map requirements to the database schema.
2. **Implementation:** Code with strict adherence to the standards above.
3. **Verification:** Run tests and linting before completing a task.
