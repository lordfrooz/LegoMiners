# Miner Character Asset Design

**Date:** 2026-04-24
**Status:** Approved in chat

## Goal

Create a lightweight web-ready 3D miner character inspired by the provided LEGO-like reference image, delivered as a single `GLB` asset for use in the BaseClaw project.

## Deliverable

- One `GLB` file at `public/assets/models/tempo-miner.glb`
- Included animations:
  - `Idle`
  - `Walk`

## Visual Direction

- Stylized, toy-like proportions based on the reference
- Blocky/minifigure silhouette suitable for a web game
- Brown leather explorer outfit with backpack
- Left hand holds a torch with emissive flame
- Right hand holds a pickaxe

## Technical Direction

- Optimize for web delivery over realism
- Use procedural low-poly geometry instead of a heavy authored mesh
- Bake animation into node transforms for reliable playback in common web GLTF/GLB runtimes
- Keep the asset self-contained with no external textures

## Animation Scope

### Idle

- Subtle body bob
- Small arm sway
- Small torch flicker through flame scale/position movement

### Walk

- Alternating leg swing
- Counter-swinging arms while torch and pickaxe remain attached
- Gentle root bob to avoid a static feel

## Constraints

- Character keeps both torch and pickaxe equipped during all included animations
- Asset should remain lightweight enough for real-time web use
- Output should be deterministic and reproducible from source code
