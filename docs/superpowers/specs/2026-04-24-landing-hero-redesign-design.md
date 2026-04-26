# Landing Hero Redesign Design

**Date:** 2026-04-24
**Status:** Approved in chat

## Goal

Redesign only the landing page hero section so it closely matches the provided Lego Miners reference image while leaving the rest of the landing page structure intact.

## Scope

- Update only the `home` hero section in the landing page
- Keep the existing page route and component structure
- Preserve the rest of the landing page sections below the hero
- Keep the hero responsive for desktop and mobile

## Visual Direction

- Dark, high-contrast hero surface with a cinematic purple-blue glow
- Large stacked headline with a gradient-emphasized final phrase
- Small top-left ecosystem pill styled like `Built on Base`
- Two side-by-side CTA buttons:
  - primary gradient button for wallet connection
  - secondary dark glass button for gameplay/help
- Bottom trust strip with three compact reassurance items
- Right-side visual area that evokes a cave/crystal scene rather than a generic flat panel

## Layout

### Left column

- Ecosystem pill
- Three-line hero headline
- Supporting paragraph
- Primary and secondary CTA row
- Trust strip anchored below the CTAs

### Right column

- Decorative art area with layered gradients, shadows, and glowing crystal/cavern treatment
- No extra text or cards in the visual zone

## Content Behavior

- Existing hero CTAs can keep their current destinations
- Existing hero copy can be adapted to better fit the approved reference composition
- No changes to leaderboard mode behavior

## Technical Direction

- Rework `tempo-landing-page.tsx` hero markup only where needed
- Rebuild the hero styles in `tempo-landing-page.module.css`
- Prefer CSS gradients, overlays, and controlled decorative layers over image-heavy hero composition unless a local asset is already clearly appropriate
- Keep the existing component as the source of truth for the landing page

## Non-Goals

- No full landing page redesign
- No changes to downstream feature cards or footer styling
- No new route or separate hero-only page
