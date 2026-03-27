# Contributing to CampusConnect

Thank you for your interest in contributing to CampusConnect! To maintain a high-quality, type-safe, and performant social ecosystem, we follow a strict set of engineering standards.

## 🛠 Development Workflow

This project is a monorepo managed by **Turborepo** and **pnpm**.

### Prerequisites
- **Node.js**: v18 or higher
- **pnpm**: v10 or higher
- **PostgreSQL**: Local instance for database development

### Setup
1. Clone the repo and install dependencies:
   ```bash
   pnpm install
   ```
2. Set up your local database environment in `packages/db/.env`.
3. Generate the Prisma client:
   ```bash
   pnpm --filter @campus-connect/db generate
   ```

### Running the Project
- **Development Mode**: `pnpm dev` (Runs all apps and packages in watch mode)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Test**: `pnpm test`

---

## 📜 Coding Standards (Strict)

All contributors **must** adhere to the rules defined in `GEMINI.md`. Key highlights include:

### 1. Type Safety
- **No `any`**: Use of the `any` type is strictly prohibited. Use `unknown` or define a specific interface.
- **Shared Types**: DTOs and API response interfaces must be defined in `packages/types` to ensure synchronization between the backend and frontend.

### 2. Functional Programming
- **No Imperative Loops**: Avoid `for` and `while` loops. Use functional alternatives like `.map()`, `.filter()`, `.reduce()`, and `.forEach()`.
- **Efficient DSA**: Use `Map` or `Set` for O(1) lookups instead of nested array operations.

### 3. Backend (NestJS)
- Use Dependency Injection strictly.
- All request payloads must be validated using DTOs and `class-validator`.

### 4. Frontend (React)
- **Styling**: Prefer Vanilla CSS. Avoid TailwindCSS unless explicitly approved for a specific sub-module.
- **PWA**: Ensure offline strategies are considered for new features.

---

## 🧪 Testing Requirements
- **Unit Tests**: Mandatory for all business logic (Services, Helpers).
- **Edge Cases**: Tests must cover null/undefined inputs, empty strings, and boundary conditions.
- **Verification**: Run `pnpm test` before opening a Pull Request.

---

## 🚀 Pull Request Process

1. **Branching**: Create a branch from `main` using the format `feat/your-feature` or `fix/your-fix`.
2. **Commit Messages**: Use conventional commits (e.g., `feat: add upvoting logic`, `fix: resolve prisma connection leak`).
3. **Draft PRs**: Feel free to open a Draft PR early for architectural feedback.
4. **Review**: All PRs require at least one approval and a passing CI build (Linting + Tests).

---

## ⚖️ Code of Conduct
Please be respectful and professional in all interactions. Our goal is to build a helpful academic community for students.
