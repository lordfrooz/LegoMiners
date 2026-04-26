# BaseClaw Whitelist View Design

Date: 2026-04-24
Status: Approved for planning
Scope: Whitelist section as a new nav view in the landing page.

## Goal

Add a "Whitelist" nav item to the landing page that opens a glassmorphism-dominant join flow. Users connect wallet → enter Twitter handle → complete X tasks → submit to join the whitelist and earn a Free Miner NFT.

## Visual Thesis

Glassmorphism dominant: heavy blur, glowing neon borders, layered frosted glass panels, floating cards with subtle pulse animations. Same dark theme (violet/blue/cyan) as existing landing page but with more depth, glow, and atmospheric richness.

## Page Structure

### 1. Whitelist View Container

Same layout shell as leaderboard view. Reuses `activeView === "whitelist"` conditional in `TempoLandingPage`.

### 2. Whitelist Hero Section

- Background: `whitelist_bg.png` full-bleed (no-repeat, cover, centered)
- Overlay gradient: radial purple vignette
- Headline: "Join the Whitelist" — large display type, gradient text
- Subline: short description about benefits
- Reward card: floating glass card showing:
  - `freeminer.png` image
  - Circular badge overlay: "1x" in purple/violet
  - "Free Miner NFT" label
  - "Worth $XX" or "Yours to keep" note
- Progress stepper: 4 steps (1 → 2 → 3 → 4), each with icon + label

### 3. Step Panels

Each step is a frosted glass panel with neon glow border on active state.

**Step 1 — Wallet**
- Rainbow/purple gradient connect button
- Uses RainbowKit ConnectButton style
- "Connect your EVM wallet" label

**Step 2 — Twitter**
- Input field with @ prefix
- "Enter your X/Twitter username" label
- Continue button

**Step 3 — Tasks**
- Task list from game: Share, Retweet, Like, Comment, Follow
- Each task: icon + label + status indicator
- Completed = checkmark + green glow
- Clicking opens Twitter intent in new tab
- Progress bar showing X/5 tasks done

**Step 4 — Submit**
- Summary card: shows Twitter handle, wallet address, tasks completed
- Turnstile CAPTCHA
- "Join Whitelist" submit button with gradient fill

### 4. Success State

After successful submit:
- Large checkmark with pulse animation
- "You're on the list!" headline
- Confirmation message
- Entry saved to localStorage

## Visual System

### Glassmorphism Base

```css
background: rgba(15, 16, 28, 0.55);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(181, 102, 255, 0.2);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.4),
  0 0 0 1px rgba(255, 255, 255, 0.05) inset,
  0 0 60px rgba(122, 68, 255, 0.15);
```

### Active Glow (Step Cards)

```css
border-color: rgba(153, 69, 255, 0.6);
box-shadow:
  0 0 30px rgba(153, 69, 255, 0.4),
  0 0 60px rgba(122, 68, 255, 0.2);
```

### Colors

- Primary accent: `#6F38FF` (violet)
- Secondary accent: `#14F195` (emerald/cyan)
- Glow purple: `rgba(153, 69, 255, 0.4)`
- Glass base: `rgba(15, 16, 28, 0.55)`
- Border subtle: `rgba(255, 255, 255, 0.08)`

### Typography

Same font stack as landing page (`--font-display`, `--font-body`).

## Component Inventory

### `WhitelistView`
Main wrapper. Renders hero + step panels based on `whitelistStep` state.

### `WhitelistHero`
- Background image with overlay
- Headline + description
- `RewardCard` component
- `StepProgress` component

### `RewardCard`
- Glass panel
- `freeminer.png` image
- Circular "1x" badge overlay
- "Free Miner NFT" text

### `StepProgress`
- 4 numbered circles connected by lines
- Active = filled + glow, Completed = checkmark, Pending = outline

### `StepPanel`
- Frosted glass card
- Step-specific content
- Transitions: fade in/out between steps

### `TaskItem`
- Icon (from Lucide or inline SVG)
- Label + description
- Status badge (pending/complete)
- Opens Twitter intent on click

## State Management

Local component state (no external store needed for this view):
- `whitelistStep`: 1 | 2 | 3 | 4 | "success"
- `walletAddress`: string
- `twitterHandle`: string
- `completedTasks`: string[]
- `turnstileToken`: string | null

Persist to `localStorage` for restoration on page reload.

## Responsive

- Mobile: steps stack vertically, full width panels
- Tablet: same as mobile with larger padding
- Desktop: centered content, max-width ~600px for form area

## Files

- `app/components/whitelist-view.tsx` — main component
- `app/components/whitelist-view.module.css` — styles
- `app/components/tempo-landing-page.tsx` — add nav item + view routing
- `app/components/tempo-landing-page.module.css` — whitelist-specific styles
- `public/whitelist_bg.png` — background asset (user-supplied)
- `public/freeminer.png` — reward asset

## Acceptance Criteria

- Whitelist nav item visible in header navigation
- Clicking it switches `activeView` to "whitelist"
- Background image renders with purple vignette overlay
- Reward card shows freeminer.png with 1x badge
- 4-step flow works: Wallet → Twitter → Tasks → Submit
- Tasks open Twitter intents in new tab
- Completed tasks show checkmark + glow
- Success state shown after submit
- localStorage persistence works on reload
- Mobile responsive without breaking glassmorphism effect
