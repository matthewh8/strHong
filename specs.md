# Project: StrHong
# Role: Lead Frontend Engineer / UI Architect
# Scope: High-fidelity, persistent hydration module with Runna/Strava inspired UI.

## 1. System Architecture & Persistence
- **State Management:** React Context API or simple State hooks.
- **Persistence:** All user data (profile) and daily logs MUST persist via `localStorage`.
- **Sync Logic:** On app load, check for `hydro_user_profile`. If null, trigger Onboarding.
- **Undo/Redo Stack:** Maintain a `history_stack` for the current session to allow multi-step undo/redo for water increments.

## 2. Onboarding Flow (Two-Phase)
### Page 1: Physical Metrics
- **Inputs:** Age (Number), Height (Number), Weight (Number), Gender (Dropdown: Male, Female, Other).
- **Style:** Large, clean input fields with subtle borders. Primary "Next" button at bottom.
### Page 2: Vessel Configuration
- **Input:** "Standard Water Bottle Size" (Default: 24oz).
- **Unit Toggle:** Small toggle for Oz vs Ml (Default: Oz).
- **Logic:** Calculate `daily_goal` = (Weight * 0.5) for Oz. Store in `user_settings`.

---

## 3. Navigation (Strava-Style Shell)
- **Position:** Bottom Fixed, Blur background (Glassmorphism).
- **Tabs:** 5 slots total.
    - Tab 1 (Active): Water Drop Icon (Outline).
    - Tab 2-4: Placeholder Circle icons (Disabled/Greyed).
    - Tab 5 (Active): Person Icon (Outline).
- **Active State:** Selected icon changes color to **Vibrant Electric Blue (#3B82F6)** and stroke-width increases to `2.5px`.

---

## 4. Main Hydration Screen (Tab 1)

### A. Runna-Style Calendar (Header)
- **Component:** Horizontal scrollable date row.
- **Interaction:** Clicking a day centers it and highlights it with a **Solid White Circle** (text turns dark).
- **Indicators:** Days where `total >= goal` display a **Small Blue Dot** centered beneath the date.
- **Scrubbing Logic:** - Viewing "Today": All controls active.
    - Viewing "Past Days": Action circles are **70% transparent**. 
    - Tapping an inactive circle triggers a "Confirm Edit" modal: "You are editing a previous day. Continue?"

### B. The Display & History Control
- **Centerpiece:** Large `[Current Total] oz` text.
- **Undo/Redo:** Two small arrows (↺ / ↻) flanking the total. 
    - *Logic:* Clicking undo pops the last entry from the `consumption_log`.
- **Action Circles (The "Incrementers"):**
    1. Circle Left: "+1 oz"
    2. Circle Mid: "+[Bottle Size / 2] oz"
    3. Circle Right: "+[Bottle Size] oz"
    - *Visual:* Simple white outlines, tactile "pop" animation on click.

### C. Consumption Log (Scrollable History)
- **Position:** Below the Action Circles.
- **Content:** List of today's entries: `[Timestamp] - [Amount] oz`.
- **Interaction:** Swipe left on an entry to delete.

---

## 5. User Profile & Progress (Tab 5)

### A. User Stats Summary
- Display Age, Weight, Height, and Current Daily Goal.
- Edit button to update `user_settings`.

### B. The GitHub Grid (Hydration Heatmap)
- **Component:** 7-column grid representing the last 4-8 weeks.
- **Color Ramp (Blue Gradient):**
    - 0%: #1e293b (Dark Slate)
    - 1-25%: #dbeafe (Very Light Blue)
    - 26-50%: #93c5fd (Light Blue)
    - 51-75%: #3b82f6 (Vibrant Blue)
    - 76-100%+: #1e40af (Deep Navy Blue)
- **Behavior:** Purely visual summary. Hover/Tap shows `[Date]: [Amount] oz`.

---

## 6. Functional Specs for Claude Code
- **Icon Library:** Use `lucide-react`.
- **Animations:** Use `framer-motion` for the Runna calendar transitions and circle clicks.
- **Responsive:** Mobile-first. Max-width 480px for desktop preview.
- **Code Modularity:** Ensure the `GitHubGrid` and `RunnaCalendar` are separate components that accept a `data` prop for future "Workout" integration.

## 7. Logic Checklist
1. `handleIncrement(amount)`: Adds to `daily_totals`, pushes to `history_stack`, saves to `localStorage`.
2. `handleUndo()`: Reverses last `handleIncrement`.
3. `dateChange(newDate)`: Updates the UI state to show logs for that specific date.
4. `onboardingComplete()`: Sets `isFirstTimeUser` to false in `localStorage`.

## 8. Technical Stack Implementation
- **Frontend:** Next.js 15+ (App Router), TypeScript, Tailwind CSS.
- **Icons:** `lucide-react` (Stroke width: 1.5px - 2px).
- **Animations:** `framer-motion` (Spring physics for layout shifts).
- **Database:** `dexie` (IndexedDB) for robust local-first persistence.
- **PWA:** `next-pwa` for "Add to Home Screen" functionality.
- **Styling Note:** Use `svh` (Small Viewport Height) units for the main container to ensure the bottom nav stays pinned perfectly on mobile browsers.