A monorepo approach ensures strict type safety across the network boundary and DRY (Don't Repeat Yourself) code sharing. 

### Directory Structure
```text
campus-connect/
├── apps/
│   ├── api/                 # NestJS Backend (Standard Server)
│   └── web/                 # React + Vite PWA Frontend
├── packages/
│   ├── db/                  # Prisma schema, migrations, and generated client
│   ├── types/               # Shared TypeScript interfaces (e.g., DTOs, API responses)
│   ├── ui/                  # Shared React components (optional)
│   ├── editor/              # Shared Markdown/LaTeX parsing logic
│   └── config/              # Shared ESLint, Prettier, and TypeScript configs
├── package.json             # Root workspace definitions
└── turbo.json               # Turborepo task pipeline configuration
```

---

## 3. Backend Architecture (NestJS)

Running NestJS as a traditional, long-running server provides significant advantages for a social platform, particularly the ability to maintain persistent connections and background loops without execution time limits.

### Architectural Patterns
* **Persistent Connections:** Unlike serverless, this architecture natively supports WebSockets. You can implement real-time features like Direct Messaging or live notification counts using `@nestjs/websockets` and `socket.io`.
* **Process Management:** The application should be containerized using Docker and managed by an orchestrator (like Kubernetes, ECS, or Docker Compose) or run via a process manager like PM2 to ensure high availability and auto-restarts on failure.
* **Security & Documentation:** Implement standard global guards for JWT authentication across all protected endpoints. Maintain up-to-date Swagger documentation, auto-generated and exposed from the NestJS controllers.

### Do's and Don'ts (Backend)
* **DO** utilize NestJS's native Cron jobs (`@nestjs/schedule`) for periodic tasks like cleaning up expired sessions or calculating daily trending posts.
* **DO** implement rate limiting to protect the API from brute force attacks or spam posting.
* **DON'T** block the event loop with heavy synchronous tasks (like complex image processing). Offload these to worker threads or a dedicated background queue (like BullMQ backed by Redis).

---

## 4. Database Integration (Prisma & PostgreSQL)

With a standard backend, database connection management is much more straightforward. The NestJS server maintains a pool of persistent connections to the PostgreSQL database.

### Architectural Patterns
* **Prisma Service Integration:** Instantiate the Prisma Client inside a dedicated `PrismaService` in NestJS. Hook into the `OnModuleInit` and `OnModuleDestroy` lifecycle events to manage the connection cleanly.
* **Database Package Isolation:** The Prisma schema (`schema.prisma`) and migrations live entirely inside `packages/db`. The `apps/api` imports the instantiated Prisma Client from this package.
* **Connection Pooling:** Prisma handles basic connection pooling out of the box. For heavy production traffic, utilizing PgBouncer at the database level is still highly recommended to manage connection overhead efficiently.

### Do's and Don'ts (Database)
* **DO** use Prisma's `select` and `include` carefully to avoid over-fetching data, especially for complex relations like nested comments and voting graphs.
* **DO** run database migrations (`prisma migrate deploy`) as part of your CI/CD pipeline or Docker entrypoint script before the application starts accepting traffic.
* **DON'T** expose the raw database URL to the frontend or any client-facing code.

---

## 5. Frontend Architecture (React + Vite PWA)

The frontend is a strictly client-side rendered application, leveraging Vite's incredibly fast build times and PWA capabilities.

### Architectural Patterns
* **PWA Setup:** Utilize `vite-plugin-pwa` to auto-generate the `manifest.json` and configure Workbox.
* **Service Worker Strategy:** * *Static Assets:* `CacheFirst` strategy.
    * *API Requests (Feeds/Notes):* `NetworkFirst` or `StaleWhileRevalidate` strategy.
    * *Mutations (Posts/Votes):* Implement background sync queues. If a student attempts to upvote a post while offline, the service worker intercepts the request, stores it in IndexedDB, and replays it once connectivity is restored.
* **Rich Text Rendering:** Isolate the Markdown and LaTeX parsing (`react-markdown`, `rehype-katex`) into highly optimized, memoized components to prevent layout thrashing and slow render cycles on lower-end devices.

### Do's and Don'ts (Frontend)
* **DO** request Push Notification permissions contextually. Never prompt the user immediately upon opening the app. Wait until they perform a relevant action.
* **DO** test the PWA installation flow and standalone display modes rigorously across iOS WebKit, Android Chrome, and Desktop Edge/Chrome.
* **DON'T** bloat the initial JavaScript bundle. Dynamically import heavy libraries (like the LaTeX parsers) only on the routes that require them.