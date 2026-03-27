# CampusConnect: Design Language & UI/UX Guidelines

## 1. Core Design Philosophy
CampusConnect bridges the gap between a rigorous academic tool and a fast-paced social network. The UI must balance **high information density** (for reading complex posts) with **cognitive ease** (so it doesn't feel like homework).

* **Mobile-First (PWA Standard):** Design everything for a 390px width screen first. Scale up to desktop, never down to mobile.
* **Content is King:** The interface should recede into the background. Let the Markdown, LaTeX, and images take center stage.
* **Frictionless Engagement:** Upvoting, commenting, and bookmarking should require minimal thumb travel on mobile devices.

---

## 2. Color System & Theming
To support late-night studying and battery saving, **Dark Mode is a first-class citizen**, not an afterthought. 

### Palette Definition
* **Primary Brand:** `Indigo` or `Electric Blue` (e.g., `#4F46E5`). Convey trust, academia, and modern tech. Used for primary actions (Post button, active tab).
* **Background (Light):** `#FAFAFA` (Off-white) to reduce eye strain compared to pure white.
* **Background (Dark):** `#121212` (OLED-friendly dark gray) with `#1E1E1E` for elevated surface cards.
* **Semantic Colors:**
    * *Upvote:* `#FF4500` (Standard mental model for upvotes).
    * *Downvote:* `#7193FF` (Cool tone to contrast the upvote).
    * *Success/Verified (Business):* `#10B981` (Emerald green).

---

## 3. Typography
Legibility is critical for an app handling academic discourse and LaTeX equations.

* **UI & Headings:** `Inter`, `Geist`, or system fonts (`San Francisco` on Apple, `Roboto` on Android). These render sharply on all screens.
* **Body Text (User Posts):** 16px base size with a 1.5 line height. High readability for long-form explanations.
* **Code Blocks (Markdown):** `JetBrains Mono` or `Fira Code`. Must include horizontal scrolling for overflow.
* **Math (LaTeX):** Handled via `KaTeX`. Ensure the font size scales proportionally with the surrounding body text so equations don't look awkwardly large or small.

---

## 4. Layout Architecture (Responsive)

Because this is a PWA, it must feel native on a phone and expansive on a 4K monitor.

### Mobile (Screens < 768px)
* **Navigation:** Bottom Navigation Bar (Home, Search, Create Post [FAB], Notifications, Profile).
* **Feed:** Single column. Full width or slight padding (16px).
* **Header:** Collapses or hides on scroll down, reappears on scroll up to maximize screen real estate.

### Tablet / Small Desktop (768px - 1024px)
* **Navigation:** Left-hand Rail (Icon only or Icon + Text).
* **Feed:** Centered single column (max-width: 650px).

### Desktop (Screens > 1024px)
* **Navigation:** Fixed Left Sidebar (Full text navigation).
* **Feed:** Centered column (max-width: 650px).
* **Contextual Right Sidebar:** Used for "Trending Topics," "Suggested Business Profiles," or "Popular Courses."

---

## 5. Core Components

### The "Post" Card
The most repeated UI element. Needs strict visual hierarchy.
1.  **Header:** Author Avatar, Name, Time ago (e.g., "2h"), and an "Options" ellipsis.
2.  **Body:** Truncated at 5 lines for the main feed (with a "Read More" button). LaTeX and images render inline. Images should have a consistent aspect ratio (e.g., 4:3 or 1:1) in the feed, expanding to full size on click.
3.  **Footer (Action Bar):** * Left-aligned: Upvote/Downvote group (with current score).
    * Center-aligned: Comment icon (with count).
    * Right-aligned: Share/Repost icon.

### Forms & Inputs
* **The Composer:** Must feel like a premium text editor. Include a formatting toolbar (B, I, Link, Code, Math) directly above the keyboard on mobile, and at the bottom of the input box on desktop.
* **Touch Targets:** ALL clickable elements (buttons, links, voting arrows) must have a minimum interactive area of `44x44 pixels` to comply with mobile accessibility standards.

---

## 6. Micro-interactions & Polish
* **Voting:** When a user upvotes, use a slight scale spring animation (e.g., using `framer-motion`) and change the color to provide immediate tactile feedback.
* **Image Loading:** Use skeleton loaders or blurred placeholders (like Next/Vite image optimization strategies) to prevent layout shifts when heavy lecture notes load.
* **Pull-to-Refresh:** Implement native-feeling pull-to-refresh on mobile feeds.
* **Route Transitions:** Smooth fade-ins when moving between the Feed and a specific Post detail view.

---

## 7. Implementation Recommendation
To build this rapidly while maintaining high quality, consider using a headless component library like **Radix UI** or **Headless UI** combined with **Tailwind CSS**. This gives you full control over the exact design language without wrestling with default component styles.