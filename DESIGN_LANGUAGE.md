# CampusConnect: Design Language & UI/UX Guidelines

## 1. Core Design Philosophy
CampusConnect bridges the gap between a rigorous academic tool and a fast-paced social network. The UI must balance **high information density** (for reading complex posts) with **cognitive ease** (so it doesn't feel like homework).

* **Mobile-First (PWA Standard):** Design everything for a 390px width screen first. Scale up to desktop, never down to mobile.
* **Content is King:** The interface should recede into the background. Let the Markdown, LaTeX, and images take center stage.
* **Frictionless Engagement:** Upvoting, commenting, and bookmarking should require minimal thumb travel on mobile devices.

---

## 2. Adaptive Theming (Triple-Mode System)
To ensure the best reading experience for students during 24-hour study cycles, CampusConnect implements a sophisticated three-state theming system.

### 2.1. The Three Modes
1. **Light Mode:** High contrast, crisp backgrounds for daytime use and bright environments.
2. **Dark Mode:** Low-glare, OLED-optimized surfaces for late-night research and battery preservation.
3. **Auto Mode (Context Aware):** 
   - **System Sync:** Defaults to the OS-level `prefers-color-scheme`.
   - **Time-Based Override:** If no system preference is set, the app automatically transitions:
     - **06:00 - 18:00:** Light Mode
     - **18:00 - 06:00:** Dark Mode (Evening Shift)

### 2.2. Color Palettes

| Semantic Token | Light Mode (Day) | Dark Mode (Night) |
| :--- | :--- | :--- |
| **Primary Brand** | `#4F46E5` (Indigo) | `#6366F1` (Indigo 400) |
| **Background (Base)** | `#FAFAFA` (Off-white) | `#121212` (OLED Black) |
| **Surface (Card)** | `#FFFFFF` | `#1E1E1E` (Elevated) |
| **Text (Primary)** | `#111827` (Gray 900) | `#F9FAFB` (Gray 50) |
| **Text (Secondary)** | `#4B5563` (Gray 600) | `#9CA3AF` (Gray 400) |
| **Border** | `#E5E7EB` (Gray 200) | `#374151` (Gray 700) |
| **Upvote** | `#FF4500` (Red-Orange) | `#FF5722` (Vibrant) |
| **Downvote** | `#7193FF` (Sky Blue) | `#82B1FF` (Soft Blue) |

---

## 3. Typography & Technical Rendering
Legibility is critical for an app handling academic discourse and LaTeX equations.

* **UI & Headings:** `Inter` or `Geist`. These render sharply on all high-DPI screens.
* **Body Text (User Posts):** 16px base size with a 1.6 line height. Optimized for long-form explanations.
* **Math (LaTeX):** Rendered via `KaTeX`.
  - In **Dark Mode**, LaTeX equations must use `filter: invert(1) hue-rotate(180) brightness(1.1)` or be rendered with white SVGs to ensure visibility against dark surfaces.
* **Code Blocks:** `JetBrains Mono` or `Fira Code` with syntax highlighting adjusted per theme.

---

## 4. Layout Architecture (Responsive)

Because this is a PWA, it must feel native on a phone and expansive on a 4K monitor.

### Mobile (Screens < 768px)
* **Navigation:** Bottom Navigation Bar (Home, Search, Create Post [FAB], Notifications, Profile).
* **Header:** Collapses on scroll down to maximize screen real estate for technical diagrams.

### Desktop (Screens > 1024px)
* **Navigation:** Fixed Left Sidebar (Full text navigation).
* **Feed:** Centered column (max-width: 680px) to maintain optimal line length for reading.
* **Contextual Right Sidebar:** Used for "Trending Topics," "Popular Courses," or "Campus News."

---

## 5. Component Logic

### The "Post" Card
The most repeated UI element. Needs strict visual hierarchy.
1. **Header:** Author Avatar, Name, Credibility Badge (Student/Business), and Timestamp.
2. **Body:** Truncated at 6 lines in the feed. LaTeX and images render inline.
3. **Action Bar:** Persistent at the bottom of the card with large touch targets (min 44x44px).

### The Composer
* **Floating Toolbar:** On mobile, the formatting toolbar (B, I, LaTeX, Code) floats directly above the system keyboard.
* **Live Preview:** A side-by-side or "Toggle Preview" mode is required to verify LaTeX syntax before posting.

---

## 6. Micro-interactions & Motion
* **Theme Transition:** When switching modes (especially Auto-mode shifts), use a 300ms ease-in-out transition on background-color and text-color to avoid "flashing" the user.
* **Optimistic Voting:** The vote count and icon color change instantly upon clicking, with a subtle scale spring animation (`stiffness: 400`, `damping: 10`).
* **Haptic Feedback:** On mobile PWAs, trigger a "light" haptic vibration for successful upvotes and post submissions.
