# CampusConnect - GitHub Documentation

## Project Overview
**CampusConnect** is a cross-platform social ecosystem for university students. It uses a monorepo architecture for seamless sharing of types and configurations between the NestJS backend and React PWA frontend.

## Tech Stack
- **Monorepo:** [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/)
- **Backend:** [NestJS](https://nestjs.com/) (Node.js)
- **Database:** [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling:** Vanilla CSS (per `GEMINI.md` standards)
- **Technical Content:** LaTeX (via `rehype-katex`) and Markdown

## Repository Structure
```text
campus-connect/
├── apps/
│   ├── api/                 # NestJS Backend
│   └── web/                 # React + Vite PWA Frontend
├── packages/
│   ├── db/                  # Prisma schema and client
│   ├── types/               # Shared TypeScript interfaces
│   ├── ui/                  # Shared React components
│   ├── editor/              # Shared Markdown/LaTeX logic
│   └── config/              # Shared TS/Lint configs
├── package.json             # Root workspace
└── turbo.json               # Turbo configuration
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (v8+)
- PostgreSQL (Local or Docker)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/CampusConnect.git
   cd CampusConnect
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up the environment:
   - Create a `.env` file in `packages/db` with your `DATABASE_URL`.
   - Example: `DATABASE_URL="postgresql://user:pass@localhost:5432/CampusConnect?schema=public"`

4. Initialize the database:
   ```bash
   pnpm --filter @campus-connect/db generate
   pnpm --filter @campus-connect/db migrate dev
   ```

### Development
Run the development server for all apps:
```bash
pnpm dev
```

Run tests:
```bash
pnpm test
```

## Branching & PR Guidelines
- **Branches:** Use descriptive names like `feat/feature-name` or `fix/bug-name`.
- **PRs:** Ensure all tests pass (`pnpm test`) and linting is clean before submitting.
- **GEMINI.md:** Follow the project-specific coding standards (no `any`, no imperative loops).
