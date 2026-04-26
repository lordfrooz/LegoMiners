# Landing Page Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current root route with the approved reference-style landing page while preserving access to the existing game app at `/game`.

**Architecture:** Introduce a dedicated landing page component with isolated module styles and a thin root-page wrapper. Move the previous root page game entry into `app/game/page.tsx` so gameplay stays reachable without mixing game UI and marketing UI. Add a lightweight render test harness for the new landing surface.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, Node test runner with `tsx`, `react-dom/server`

---

### Task 1: Add test runner support for page-level render tests

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add a failing test command target**

Add a `test` script and `tsx` dev dependency so `.test.tsx` files can run through Node's built-in test runner.

- [ ] **Step 2: Run install/update so the dependency exists**

Run: `npm install`
Expected: `package-lock.json` updated with `tsx`

### Task 2: Lock the landing page contract with a failing render test

**Files:**
- Create: `app/components/tempo-landing-page.test.tsx`

- [ ] **Step 1: Write a failing test for root landing content**

Verify rendered markup includes:
- the headline `Mine. Earn. Build.`
- the gradient line text `On Base.`
- the primary CTA `CONNECT WALLET`
- four feature headings
- a `/game` primary entry point

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/components/tempo-landing-page.test.tsx`
Expected: FAIL because the component does not exist yet

### Task 3: Build the landing page surface and route split

**Files:**
- Create: `app/components/tempo-landing-page.tsx`
- Create: `app/components/tempo-landing-page.module.css`
- Create: `app/game/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the new landing page component**

Create a self-contained component that renders:
- top navigation
- hero section with `public/landing.png` background
- two CTA buttons
- one stats strip with four metrics
- one four-card features row
- one trust/community footer strip

- [ ] **Step 2: Point the root route at the landing page**

Replace the current root page game render with the new landing page component.

- [ ] **Step 3: Preserve game access at `/game`**

Create `app/game/page.tsx` that renders the previous root route composition using `TempoGameStateProvider` and `TempoGameApp`.

### Task 4: Verify, refine, and keep the design stable

**Files:**
- Modify: `app/components/tempo-landing-page.tsx`
- Modify: `app/components/tempo-landing-page.module.css`

- [ ] **Step 1: Run the landing page test and make it pass**

Run: `npm test -- app/components/tempo-landing-page.test.tsx`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS
