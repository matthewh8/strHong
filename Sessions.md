# strHONG — Build Sessions

## How to Start a Session
Tell Claude: "Run Session [N]" and it will read this file, 
claude.md, and PROGRESS.md, then execute the session plan.

## End-of-Session Protocol (runs automatically after every session)
1. Write a summary of what was built and key decisions made
2. Update PROGRESS.md (mark completed, note any stubs/TODOs)
3. Append to TESTING.md with exact manual test steps for this session
4. List any blockers or things the next session needs to know

---

## Session 1 — Project Scaffold + Database
**Scope:** Infrastructure only. No React Native or Next.js code.

**Tasks:**
- Set up monorepo structure from claude.md section 3
- Create all Supabase migrations from claude.md section 4
- Add RLS policies for all user-owned tables
- Create seed.sql with exercise library (~200 exercises with muscle groups)
- Stub Matthew's Split seed data with TODO comment (data pending)
22
**Out of scope:** Any app code, components, or screens.

---

## Session 2 — Auth + Onboarding
**Scope:** Mobile app auth flow and all 7 onboarding steps.
**Depends on:** Session 1 complete

**Tasks:**
- Supabase client setup with ExpoSecureStore adapter
- Google OAuth, Apple Sign In, magic link auth
- All 7 onboarding screens (profile, goal, experience, bottle, 
  supplements, split, complete)
- Profile created in DB on first login via Supabase trigger
- onboarding_complete flag logic (resume if interrupted)
- Redirect logic: first login → onboarding, returning → home

**Out of scope:** Bottom tab navigation, home screen content.

---

## Session 3 — Routine & Split Editor
**Scope:** Full routine editing UI backed by Supabase.
**Depends on:** Session 2 complete

**Tasks:**
- Split editor screen (create, name, add/remove/reorder days)
- Routine editor screen per day (add/remove/reorder exercises)
- Exercise search from exercises table
- Per-exercise config: sets, rep range, rest time, weight, 
  progression increment, is_compound toggle
- Progressive overload rules (claude.md section 10)
- Workout length estimator
- Matthew's split loads as default from seed data

**Out of scope:** Active workout mode, any analytics.

---

## Session 4 — Active Workout Mode
**Scope:** End-to-end workout logging flow.
**Depends on:** Session 3 complete

**Tasks:**
- Zustand activeWorkout store (claude.md section 11)
- Warmup set generation for compound lifts
- Active workout screen layout (claude.md section 11)
- Set logging with weight + reps input
- Rest timer with reanimated countdown circle
- RIR selector (2 / 1 / 0.5) required before advancing
- Skip rest + Add 30s buttons
- Background timer persistence
- Post-workout summary screen
- Save to WatermelonDB + trigger sync

**Out of scope:** Check-in fuel level integration, notifications.

---

## Session 5 — Daily Check-In Module
**Scope:** Full check-in flow and home screen card.
**Depends on:** Session 4 complete

**Tasks:**
- Check-in screen: sleep, water tracker, fuel level, supplements
- Water goal calculation (claude.md section 9)
- Water tracker UI: +1oz, +½ bottle, +full bottle buttons
- Progress ring component
- Daily achievement logic (all 3 items complete = badge)
- Home screen check-in card (Start Check-In / Later)
- Health sync pre-fill for sleep (HealthKit + Health Connect)
- Save to WatermelonDB + trigger sync

**Out of scope:** Notification scheduling, calendar display.

---

## Session 6 — Calendar + Progress Charts
**Scope:** Calendar heatmap, body map, and progress analytics.
**Depends on:** Session 5 complete

**Tasks:**
- Calendar heatmap (month grid, day colors by activity)
- Day detail bottom sheet (tap any day)
- Body map SVG (front + back, weekly muscle frequency)
- Lift progression chart per exercise (Victory Native)
- 1RM estimate line (Epley formula)
- Volume chart (weekly, per muscle group, 8-week rolling)
- Population comparison component (Coming Soon state)
- Data export button (triggers Supabase edge function)

**Out of scope:** AI coach, notifications.

---

## Session 7 — Notifications + Health Sync Polish
**Scope:** Push notifications and health data integration.
**Depends on:** Session 5 complete (can run parallel to Session 6)

**Tasks:**
- Expo push notification setup + OneSignal
- Morning supplement reminder (8am daily)
- Evening workout nudge (5pm if no workout logged)
- Progressive overload notification (post-workout)
- Cancel evening nudge if workout already logged
- WatermelonDB sync on app foreground (AppState listener)
- Background sync setup

**Out of scope:** AI coach.

---

## Session 8 — Supabase Sync + Edge Functions
**Scope:** Full offline sync and data export.
**Depends on:** Sessions 4 + 5 complete

**Tasks:**
- pull_changes and push_changes RPC functions
- Conflict resolution rules (local wins for sets/checkins, 
  server wins for routines/splits)
- export-data edge function (workouts.csv + checkins.csv)
- Web companion auth callback route
- End-to-end sync test

**Out of scope:** AI coach edge function.