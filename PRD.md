

## Product Requirements Document: "CampusConnect"

### 1. Product Overview
**1.1. Purpose:** To provide a dedicated, cross-platform social ecosystem for university students that supports rigorous academic discourse alongside fast-paced social networking and campus business promotion.

**1.2. Target Audience:**
* **Students:** Individuals who need a platform capable of handling complex academic formatting while offering standard social engagement.
* **Student Entrepreneurs:** Campus-based businesses needing a targeted avenue to advertise services (e.g., tutoring, textbooks) directly to their peers.

**1.3. Problem Statement:**
Standard social media platforms fail at handling technical academic text, while traditional academic forums lack the modern social loops (reposts, upvotes, dynamic feeds) and PWA accessibility that students expect.

---

### 2. Core Features (MVP Scope)

#### 2.1. User & Business Profiles
* **Student Accounts:** Standard profiles displaying major, graduation year, bio, and a chronological feed of user activity.
* **Business Profiles:** Upgraded accounts featuring a business name, description, external links, and a pinned "Services/Products" section.
* **Authentication:** Email/password and university verification (e.g., .edu domain for badges) to maintain a trusted network, though any email domain is permitted for initial registration.

#### 2.2. Advanced Content Creation
* **Rich Text Composer:** A specialized editor supporting:
    * Standard rich text (Bold, Italic, Strikethrough).
    * Markdown for code snippets and structured lists.
    * LaTeX rendering natively in the browser for statistical models, multivariate analysis equations, and physics formulas.
* **Media Uploads:** High-resolution image attachments optimized for legibility, allowing students to easily upload photos of handwritten notes or whiteboard diagrams.

#### 2.3. Social Engagement & Feeds
* **Core Interactions:** Like, Comment, Share (internal DMs or external links), and Repost (with or without a quote).
* **Dynamic Feeds:** Algorithmic and chronological sorting options (e.g., "Top this week" vs. "Latest").

#### 2.4. Reputation & Voting System
* **Upvoting/Downvoting:** A Reddit-style voting mechanism applied to posts and comments to surface high-quality academic answers and filter out noise.
* **Score Tracking:** User profiles display a cumulative reputation score based on the helpfulness of their contributions.

---

### 3. PWA & Cross-Platform Capabilities

#### 3.1. Progressive Web App (PWA) Standards
* **Universal Installation:** Fully installable directly from the browser to the home screen or desktop across iOS, Android, Windows, and Linux.
* **Service Workers:** Configured for offline functionality, allowing users to view cached feeds and notes without an active internet connection. Offline actions (like upvoting or drafting a post) are queued and synced upon reconnection.
* **Native App UX:** Configured with a `manifest.json` for standalone display mode (hiding the browser UI), custom splash screens, and native-feeling navigation.

#### 3.2. Push Notification System
* **Triggers:** Push alerts for direct engagements (replies, mentions), milestone achievements (e.g., "Your post reached 100 upvotes"), and updates from subscribed business profiles.
* **Cross-Platform Delivery:** Routing through native OS notification centers (macOS/iOS Notification Center, Windows Action Center, Android System UI).

---

### 4. Technical Architecture Recommendations

* **Infrastructure:** A monorepo architecture managed with Turborepo and `pnpm` to seamlessly share types, configurations, and schemas between the client and server.
* **Frontend:** React + Vite. Provides the rapid build times, fast Hot Module Replacement (HMR), and lightweight client-side rendering essential for a high-performance PWA. Includes `vite-plugin-pwa` for manifest generation and Workbox integration.
* **Backend:** NestJS. Offers a strongly typed, modular architecture perfect for building scalable REST APIs, handling JWT authentication, and managing notification queues.
* **Database:** PostgreSQL. A robust relational database required to efficiently query complex social graphs (users, nested comments, votes, and posts).
* **Push Services:** Firebase Cloud Messaging (FCM) to handle the complex delivery routing required across different operating systems, particularly iOS Web Push.

---

### 5. Core User Flows

**Flow 1: Posting Technical Content**
1. User clicks "Create Post".
2. User types an explanation of an ARIMA forecasting model, wrapping the mathematical equations in LaTeX delimiters.
3. User attaches a picture of their plotted data.
4. User submits. The React frontend parses the LaTeX using a library like `rehype-katex` and renders the formatted post in the feed.

**Flow 2: Offline Voting**
1. User is on a train with no connection and reads a cached post.
2. User clicks "Upvote". The UI updates immediately (optimistic UI).
3. The PWA service worker queues the `POST` request.
4. Once the connection is restored, the service worker flushes the queue, syncing the vote with the NestJS backend.

---

### 6. Future Phases (Post-MVP)
* **Direct Messaging:** Real-time chat using WebSockets.
* **Group Study Rooms:** Dedicated sub-forums for specific classes or majors.
* **Monetization:** Promoted posts for business profiles or integrated payment links for tutoring services.

---
