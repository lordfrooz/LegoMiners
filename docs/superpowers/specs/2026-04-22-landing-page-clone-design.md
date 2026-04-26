# BaseClaw Landing Page Clone Design

Date: 2026-04-22
Status: Approved for planning
Scope: Landing page only. No gameplay, API, or application-logic changes are part of this spec.

## Goal

Recreate the provided reference landing page as closely as possible for BaseClaw.

Non-negotiable rule:
- The page should be a near 1:1 clone of the reference composition, hierarchy, spacing, panel structure, CTA layout, stats bar, feature cards, footer strip, glow language, and overall visual density.
- The background image is the only planned visual substitution. Use `public/landing.png` as the background/reference asset supplied by the user.

## Constraints

- Do not redesign or modernize the layout.
- Do not simplify the visual density.
- Do not reinterpret the style into a cleaner SaaS page.
- Do not change the number of major hero actions or supporting blocks.
- Do not include gameplay/state/API work in this task.
- The work is limited to the landing page presentation layer.

## Visual Thesis

A cinematic, high-contrast, game-first Web3 landing page with a dark mining-cave atmosphere, neon violet-blue-cyan highlights, glossy glass-like panels, and a poster-style first viewport.

## Content Plan

1. Hero
2. Stats strip
3. Four feature cards
4. Bottom trust/community strip

## Interaction Thesis

- Hero content should feel staged and premium rather than app-like.
- Subtle glow, blur, and hover emphasis should support the visual drama.
- Responsive behavior should preserve the same hierarchy and mood, only restacking where necessary.

## Page Structure

### 1. Outer Frame

The page should sit inside a large, dark, slightly rounded main frame similar to the reference. This frame should feel like a single composed scene rather than a stack of unrelated sections.

Expected qualities:
- Near-black or very dark navy base
- Soft rounded outer corners
- Interior padding that matches the reference breathing room
- Background image coverage across the main hero region

### 2. Header

The header should match the reference composition:

- Left: brand/logo area
- Center: horizontal navigation
- Right: "Built on Base" style pill, two circular social buttons, one gradient wallet button

Header rules:
- Do not collapse the header into a minimal nav
- Keep it lightweight but premium
- Maintain the same left-center-right balance as the reference
- Preserve the floating, inset feel instead of a hard top bar

### 3. Hero

The hero is the dominant visual event of the page and must remain visually close to the reference.

Left column:
- Large two-line headline
- First line in bright white
- Second line in vivid multi-color gradient
- One short descriptive paragraph beneath
- Two horizontally aligned CTA buttons beneath the paragraph

Right column:
- Large visual focal area for character/object imagery
- Background image should continue behind this region
- The right side must visually counterbalance the left text block the same way the reference does

Hero rules:
- The headline must be oversized and immediately dominant
- The text column must stay narrow enough to read quickly
- The primary CTA must be a filled gradient button
- The secondary CTA must be a dark outlined button
- Avoid adding extra labels, pills, badges, or card overlays not present in the reference

## Stats Strip

Directly below the hero content should be one horizontal stats panel.

Structure:
- Single wide translucent dark panel
- Four evenly distributed metrics
- Each metric contains:
  - small icon
  - large numeric value
  - short supporting label

Visual rules:
- Use low-opacity dark glass styling
- Add subtle border/glow presence
- Keep the panel wide and calm, not overly segmented
- Preserve the premium gaming/Web3 look from the reference

## Feature Cards

Below the stats strip should be four horizontally arranged feature cards.

Each card should include:
- Left-aligned illustrative image/icon
- Title
- Short descriptive text
- Circular arrow button near the lower-right area

Card rules:
- Cards should remain dark, slightly translucent, and softly bordered
- Spacing and card height should closely follow the reference
- The cards should read as one coordinated row, not as unrelated modules
- Do not replace the structure with generic SaaS cards

## Bottom Trust / Community Strip

The final visible strip in the reference should also be preserved.

This strip should contain three functional zones:
- Built on / platform trust area
- Community/social area
- Audit/partner logos area

Rules:
- Keep it as a single horizontal band
- Preserve the segmented-yet-unified look
- Avoid turning it into a traditional footer with many links

## Visual System

### Color

Primary base:
- black
- blue-black
- charcoal navy

Accent system:
- violet
- electric blue
- cyan
- slight emerald/cyan transition where the reference uses a rainbow-like gradient

Usage rules:
- Bright gradients should appear only on high-priority elements
- Most surfaces should stay dark and restrained
- White is reserved for the biggest text moments
- Body copy should be light gray, not pure white

### Surface Style

Use a dark-glass panel language:

- semi-transparent dark fills
- thin low-contrast borders
- soft bloom/glow around important elements
- restrained blur where needed

Panels should feel premium and slightly futuristic, not flat.

### Typography

Hierarchy should remain close to the reference:

- Hero headline: very large, heavy, immediate
- Nav and labels: medium weight, clean, unobtrusive
- Supporting copy: readable, muted, short
- Buttons: strong contrast, slightly bold

The second line of the hero headline should carry the signature gradient treatment.

### Icons and Controls

- Social icons should sit inside circular dark buttons
- Primary CTA should be a wide gradient pill/rounded rectangle
- Secondary CTA should be a dark outlined control
- Small icons in the stats strip should carry neon-like accent color
- Feature card arrows should sit in dark circular buttons

## Responsive Behavior

### Desktop

Desktop should remain the canonical target and should look as close to the reference as possible.

The initial experience should include:
- header
- hero
- stats strip
- feature cards
- bottom trust/community strip

This first impression should read like a composed promotional poster.

### Tablet and Mobile

The design may restack, but it must not change its visual identity.

Responsive expectations:
- Hero content stacks vertically
- CTA buttons remain prominent
- Main visual shifts below or around the text as needed
- Stats strip becomes stacked or wraps cleanly
- Feature cards can become 2x2 or single-column
- Bottom strip can stack into rows while preserving the same content zones

Mobile rules:
- Preserve the dark cinematic atmosphere
- Preserve the gradient headline treatment
- Preserve premium spacing and panel styling
- Do not simplify the page into a plain mobile marketing layout

## Fidelity Rules

Because the user explicitly requested a direct clone, implementation should follow these fidelity rules:

- Match the reference layout before attempting any originality
- Match the spacing rhythm before introducing optimization
- Match the balance of text vs imagery
- Match the number and order of blocks
- Match the shape language of buttons, pills, cards, and circular controls
- Match the glow intensity and visual richness closely

Allowed adaptation:
- BaseClaw branding/content can replace the reference text
- `public/landing.png` replaces the background photo
- Minor responsive adjustments are allowed where required by viewport size

Not allowed:
- removing sections
- merging sections
- introducing a different hero concept
- flattening the glow/glass aesthetic into a minimal style
- replacing the composition with a card-grid-first layout

## Integration Boundary

The current root page currently renders the game app entry. This spec treats the requested work as a landing page presentation change only.

In-scope:
- landing page layout
- visual styling
- responsive adaptation
- content/panel arrangement

Out-of-scope:
- gameplay systems
- auth logic
- wallet logic
- API behavior
- internal application state changes unrelated to the landing surface

## Asset Note

Use `public/landing.png` as the user-supplied hero/background visual source unless the user replaces it with a newer file before implementation begins.

## Acceptance Criteria

- The first viewport is immediately recognizable as a clone of the reference
- The header composition matches the reference pattern
- The hero headline, CTAs, and imagery balance mirror the reference closely
- A four-item stats strip appears directly under the hero
- A four-card feature row appears below the stats strip
- A bottom trust/community/partner strip appears below the cards
- The visual language preserves the dark neon cave aesthetic
- The page remains visually coherent on mobile without abandoning the reference style
