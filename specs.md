# Project: StrHong — Hydration Tracker (Web)
# Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · Dexie (IndexedDB) · PWA

---

## 1. Architecture & Persistence

- **Persistence:** `localStorage` for user profile; `Dexie` (IndexedDB) via `HydroDb` for hydration logs
- **Profile key:** `hydro_user_profile` (JSON), `isFirstTimeUser` flag
- **Log schema:** `{ id, date: YYYY-MM-DD, amount: number (oz), timestamp: ms }`
- **Undo/Redo:** In-memory session stacks (`historyStack`, `redoStack`) in `useHydration` hook
- **SSR safety:** Profile loaded in `useEffect` only (never at render time) to avoid hydration mismatch
- **Reset:** `clearProfile()` wipes localStorage; `clearAllLogs()` wipes IndexedDB — both called from the reset button in the nav

---

## 2. Onboarding Flow (5 Steps)

### Step 0 — Gender
- Male / Female cards (no "Other")
- Selection sets default height/weight for Step 1: Male → 5'9" / 165 lbs, Female → 5'3" / 125 lbs

### Step 1 — Physical Stats
- **Age:** Collapsible drum-roller picker (range 13–100, default 21). Shows `Age: X yrs` when collapsed.
- **Height:** Collapsible dual drum-roller — feet (3–7) and inches (0–11). Shows `X ft Y in` when collapsed.
- **Weight:** Collapsible drum-roller (range 80–400 lbs). Shows `X lbs` when collapsed.
- Only one picker active at a time. "Done" button or tap-outside to collapse.

### Step 2 — Activity Level
- 6-level scale (Sedentary → Extra Active)
- Vertical pill thermometer: all 6 color bands always visible (green bottom → red top), arrow pointer slides to indicate level
- `?` icon opens bottom sheet with level descriptions
- Colors: `#22C55E → #84CC16 → #FBBF24 → #F97316 → #EF4444 → #DC2626`

### Step 3 — Supplements
- Checkboxes: Creatine (+16 oz to daily goal), Fish Oil, Multivitamin
- "Select All" toggle button

### Step 4 — Bottle
- Quick-select cards: 24 / 32 / 40 oz (default 32) with scaling cup SVG icons, blue glow when active
- Custom text input below (overrides quick-select)
- Unit toggle: oz / ml

---

## 3. Water Goal Formula

```
dailyGoal = round(weight × 0.5 × activityMultiplier × ageMultiplier + creatineBonus)
```

**Activity multipliers** (index = level - 1):
`[1.0, 1.2, 1.4, 1.55, 1.7, 1.85]`

**Age multipliers:**
- 13–17: ×0.9
- 18–54: ×1.0
- 55–69: ×1.1
- 70+: ×1.15

**Creatine bonus:** +16 oz flat

---

## 4. Navigation

- Fixed bottom bar, glassmorphism blur (`rgba(15,23,42,0.75)` + `backdrop-filter: blur(20px)`)
- 5 tabs:
  1. **Water** (`Droplets`) — active, routes to `/hydration`
  2. **Workout** (`Dumbbell`) — dimmed placeholder (25% opacity)
  3. **Reset** (`RotateCcw`) — opens confirm bottom sheet; clears all data → `/onboarding`
  4. **Stats** (`BarChart2`) — dimmed placeholder
  5. **Profile** (`User`) — active, routes to `/profile`
- Active color: `#0096FF`, stroke 2.5px. Inactive: `#94a3b8`, stroke 1.5px.

---

## 5. Hydration Screen (`/hydration`)

### Calendar
- `RunnaCalendar`: horizontal scroll, centered on today, tap to select date
- Selected day: white circle, dark text
- Goal-met days: small blue dot below date

### Total Display
- Large oz number with `framer-motion` AnimatePresence transition
- Thin progress bar below (`#0096FF`)
- `X% of Y oz goal` label
- Undo (↺) / Redo (↻) buttons flanking the number

### Action Circles
- 3 circle buttons: `+1`, `+½ bottle`, `+bottle`
- Past-day mode: 70% opacity, tap triggers "Confirm Edit" modal

### History
- Centered `— HISTORY —` divider (below action circles, initially off-screen)
- Log entries scroll into view; each row shows timestamp + amount
- Swipe left on entry to delete (framer-motion drag, red trash reveal)

---

## 6. Profile Screen (`/profile`)

- Stats grid: Age, Height (`5'9"` format), Weight, Daily Goal
- Inline weight edit field (tap Edit → save recalculates goal with full formula)
- 8-week GitHub-style hydration heatmap (`GitHubGrid`)
- Bottle size display

---

## 7. Home Screen Widget (`/widget`)

- Standalone page (no nav), accessible via "Add to Home Screen" in Safari
- 2×1 card layout:
  - **Left:** circular progress ring + current oz / goal oz
  - **Right:** two stacked buttons — `+{bottle} oz` (top), `+{halfBottle} oz` (bottom)
- Tapping logs water via `useHydration`, number animates
- "Open app →" link to `/hydration`
- PWA manifest `shortcuts` entry points to `/widget`

---

## 8. Key Files

| Path | Purpose |
|------|---------|
| `lib/storage.ts` | `UserProfile` interface, localStorage helpers, `clearProfile()` |
| `lib/db.ts` | Dexie schema, `clearAllLogs()` |
| `lib/calculations.ts` | `calcDailyGoal(weight, activityLevel, supplements, age)`, unit converters |
| `hooks/useHydration.ts` | Log CRUD, undo/redo, daily totals |
| `components/ui/DrumRoller.tsx` | CSS scroll-snap picker (no library) |
| `components/hydration/RunnaCalendar.tsx` | Horizontal date selector |
| `components/hydration/TotalDisplay.tsx` | Progress bar + undo/redo |
| `components/hydration/ActionCircles.tsx` | Log buttons |
| `components/hydration/ConsumptionLog.tsx` | Swipe-to-delete log list |
| `components/shell/BottomNav.tsx` | Nav + reset confirm modal |
| `app/onboarding/page.tsx` | 5-step onboarding |
| `app/(app)/hydration/page.tsx` | Main hydration screen |
| `app/(app)/profile/page.tsx` | Profile + heatmap |
| `app/widget/page.tsx` | Home screen widget |

---

## 9. Design Tokens

| Token | Value |
|-------|-------|
| Background | `#0f172a` |
| Surface | `#1e293b` |
| Surface 2 | `#263347` |
| Border | `#334155` |
| Text | `#f1f5f9` |
| Text muted | `#94a3b8` |
| Accent (water blue) | `#0096FF` |

---

## 10. PWA Config

- `@ducanh2912/next-pwa`, service worker auto-generated to `/public`
- `display: standalone`, portrait lock, dark theme
- Manifest shortcuts: `Log Water → /widget`
- Icons: `icon-192.png`, `icon-512.png` (maskable)
