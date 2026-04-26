# Miner Character Asset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reproducible script that generates a web-ready `GLB` miner character with `Idle` and `Walk` animations, then write the generated asset into the project.

**Architecture:** Implement a small procedural GLB generator in Node.js that assembles reusable primitive meshes, a rigid node hierarchy, materials, and animation channels into one binary `GLB`. Verify the output with node-based tests that parse the generated file and assert structure, animation names, and file budget.

**Tech Stack:** Node.js, `node:test`, procedural glTF/GLB generation, project `public/` assets

---

### Task 1: Create and verify the generator

**Files:**
- Create: `scripts/miner-character/miner-glb.mjs`
- Create: `scripts/miner-character/miner-glb.test.mjs`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the test to verify the expected failure**
- [ ] **Step 3: Implement the GLB generator with reusable geometry, materials, hierarchy, and animations**
- [ ] **Step 4: Run the test again and confirm it passes**

### Task 2: Emit the asset file

**Files:**
- Create: `scripts/miner-character/build-miner-glb.mjs`
- Create: `public/assets/models/tempo-miner.glb`

- [ ] **Step 1: Add a CLI writer script that saves the generated asset**
- [ ] **Step 2: Run the writer to generate the final `GLB`**
- [ ] **Step 3: Re-parse the emitted `GLB` and confirm the expected names and animations remain intact**
