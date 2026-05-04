# Design System Strategy: Kinetic Precision

## 1. Overview & Creative North Star
**The Creative North Star: "Velocity in the Void"**

This design system is built to capture the high-stakes, hyper-focused energy of competitive typing. We are moving away from the static, "dashboard-style" interface and toward a high-fidelity, immersive terminal experience. The aesthetic breaks the "template" look by utilizing **intentional asymmetry**—offsetting stats against the main typing lane—and **tonal depth** to create a focused "flow state" for the user. 

By utilizing deep charcoal layers and neon "light-leaks," the UI feels like a high-end racing HUD rather than a standard web app. We prioritize the "breathing room" of wide margins paired with the density of "Bento Grid" statistics to create a professional, yet "Gamer-centric" rhythm.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a "Dark Mode First" architecture, using high-contrast neon accents to draw the eye to critical interaction points.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined through **Background Shift** or **Tonal Transitions**. 
*   *Implementation:* Use `surface-container-low` for the main page body and `surface-container-high` for nested modules. Let the color shift do the work, not a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of tinted glass.
*   **Base:** `background` (#0b0e14)
*   **Sectioning:** `surface-container` (#161a21)
*   **Interactive Cards:** `surface-container-highest` (#22262f)
*   **Active Focus (The Typing Lane):** Use `surface-bright` (#282c36) to subtly "lift" the active area toward the user.

### The "Glass & Gradient" Rule
To achieve a premium, custom feel:
*   **Glassmorphism:** Use `surface-variant` with a `backdrop-filter: blur(12px)` and 60% opacity for floating modals.
*   **Signature Textures:** Use a subtle linear gradient from `primary` (#de8eff) to `primary-container` (#d779ff) on the main "Start Race" CTA to provide a "pulsing" energy.

---

## 3. Typography: Editorial Utility
The type system balances the technical precision of monospaced fonts with the aggressive, bold nature of gaming headlines.

*   **Display & Headlines (Space Grotesk):** Use `display-lg` and `headline-md` for high-impact moments like "WINNER" or "GAME OVER." The wide tracking and bold weight convey authority.
*   **The Typing Core (JetBrains Mono / Monospace):** All active typing areas must use a monospaced font. This ensures character-width consistency, which is vital for peripheral vision during a 150 WPM sprint.
*   **UI & Meta-data (Inter):** Use `body-sm` and `label-md` for stats and secondary navigation. Inter’s neutrality allows the neon accents and monospaced typing areas to take center stage.

---

## 4. Elevation & Depth
We eschew traditional drop shadows for **Ambient Glows** and **Tonal Stacking**.

*   **The Layering Principle:** Place `surface-container-lowest` elements inside `surface-container-high` sections to create "wells" of content. This inverted depth guides the eye without clutter.
*   **The "Ghost Border" Fallback:** If a container requires definition against a similar background, use `outline-variant` (#45484f) at **15% opacity**. It should be felt, not seen.
*   **Hover State Glows:** Instead of a shadow, use a 12px blur "outer glow" using the `secondary` (#00eefc) color at 20% opacity when a user hovers over a primary action.

---

## 5. Components

### The "Shiny" Button (Primary)
*   **Base:** Gradient of `primary` to `primary-dim`.
*   **Effect:** A subtle, moving "shine" (mask-shimmer) using `on-primary` at 10% opacity. 
*   **Radius:** `md` (0.375rem) for a modern, sharp look.
*   **Hover:** Increase `surface_tint` and apply a `secondary` glow.

### The Bento Stat Grid
*   **Structure:** Asymmetrical grid tiles. Use `surface-container-highest` for the background.
*   **Styling:** No borders. Use `title-lg` for the numeric value (e.g., "142 WPM") in `secondary` (#00eefc) and `label-sm` for the description in `on-surface-variant`.

### The Player Track (Progress Bar)
*   **Track:** `surface-container-lowest`.
*   **Fill:** A gradient from `secondary` (#00eefc) to `tertiary` (#c4ffcd).
*   **Animation:** Use a "spring" transition for progress updates to make the movement feel kinetic and responsive.

### Inputs & Typing Field
*   **State:** The active word should be highlighted with `secondary-container` and a `secondary` "Ghost Border."
*   **Error State:** Use `error` (#ff6e84) for the character color, with a subtle `error-container` background flicker on the initial mistype.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use `tertiary` (#c4ffcd) exclusively for "Success" states (e.g., 100% accuracy).
*   **Do** use aggressive horizontal white space to separate the "Global Chat" from the "Typing Lane." 
*   **Do** utilize `backdrop-blur` on all sticky navigation bars to maintain the "Glassmorphism" theme.

### Don't
*   **Don't** use 100% white for text. Always use `on-surface` (#ecedf6) to reduce eye strain during long gaming sessions.
*   **Don't** use standard "box-shadows." If an element needs to pop, use a colored ambient glow or a tonal lift.
*   **Don't** use dividers or lines to separate list items (e.g., in a leaderboard). Use alternating `surface-container-low` and `surface-container-lowest` backgrounds.

---

## 7. Interaction & Motion
*   **Micro-interactions:** Every keypress in the typing area should trigger a subtle, 2px vertical "pop" of the character or a tiny particle fade using the `secondary` color.
*   **Transitions:** All state changes (loading to race start) should use a `cubic-bezier(0.22, 1, 0.36, 1)` timing function for a "snappy" yet smooth feel.