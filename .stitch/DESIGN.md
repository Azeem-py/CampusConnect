# Design System: CampusConnect
**Project ID:** 2788113975905652454

## 1. Visual Theme & Atmosphere
CampusConnect uses a **"Journalistic Modernism"** aesthetic—a high-integrity social ecosystem for scholars. The design balances the structured authority of an academic journal with the fluid intensity of a campus network. The atmosphere is **Airy, Professional, and Achievement-Oriented**, prioritizing mathematical clarity and PWA ergonomics.

## 2. Color Palette & Roles
*   **Academic Indigo (#1E3A8A):** Primary brand color used for headings, primary brand elements, and authoritative UI surfaces.
*   **Vibrant Gold (#F59E0B):** Secondary accent used for "Social Heat" (Upvotes), reputation badges, student achievement milestones, and Business Profile highlights.
*   **Scholarly Slate (#475569):** Tertiary color for metadata, secondary text, and technical borders.
*   **Parchment White (#FDFDFB):** Primary background color for Light Mode, mimicking high-quality research paper.
*   **Slate Deep (#111827):** Primary background for Dark Mode (OLED-optimized).

## 3. Typography Rules
*   **Headings:** **Newsreader** (Serif). Evokes the feeling of a prestigious academic journal.
*   **Body & Interface:** **Inter** (Sans-Serif). Optimized for long-form technical reading and high legibility across mobile displays.
*   **Technical Rendering:** **JetBrains Mono** for code and **KaTeX** for mathematical formulas (LaTeX).

## 4. Component Stylings
* **Buttons:** Lower elevation, slightly rounded corners (8px). Primary buttons use the Academic Indigo gradient.
* **Cards/Containers:** Pill-shaped or subtly rounded (12px). Uses tonal separation (surface-container-low) instead of 1px borders.
* **Reputation Badges:** High-contrast Gold-tinted chips identifying verified students and business owners.

## 5. Layout Principles
* **PWA Native UX:** Bottom Navigation Bar for mobile-first indexing and high-contrast touch targets.
* **Mobile-First Scaling:** All designs are optimized for 390px width first, scaling up to 680px centered feed for desktop.
* **Optimistic Performance:** Immediate visual feedback (Gold transition) for all social interactions.
