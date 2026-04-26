import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

test("top navigation sits above the hero so leaderboard stays clickable", async () => {
  const cssPath = path.join(currentDir, "tempo-landing-page.module.css");
  const css = await readFile(cssPath, "utf8");
  const topBarBlock = css.match(/\.topBar\s*\{([\s\S]*?)\n\}/);

  assert.ok(topBarBlock, "Expected to find the .topBar CSS block.");

  const zIndexMatch = topBarBlock[1].match(/z-index:\s*(\d+)/);

  assert.ok(zIndexMatch, "Expected .topBar to declare a z-index.");
  assert.ok(
    Number(zIndexMatch[1]) > 1,
    "Expected .topBar to sit above the main sections so navigation links remain clickable.",
  );
});

test("leaderboard view matches the approved cinematic layout content", async () => {
  const componentPath = path.join(currentDir, "tempo-landing-page.tsx");
  const cssPath = path.join(currentDir, "tempo-landing-page.module.css");
  const [componentSource, cssSource] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  const requiredCopy = [
    "Compete & Climb",
    "Climb the ranks, compete with miners,",
    "and earn epic rewards across Base.",
    "Blocks Mined",
    "BaseDragon",
    "BlockHunt3r",
    "38,521",
  ];

  for (const snippet of requiredCopy) {
    assert.match(
      componentSource,
      new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Expected leaderboard view to include "${snippet}".`,
    );
  }

  assert.match(
    componentSource,
    /backgroundImage:\s*activeView === "leaderboard"\s*\?\s*"none"/,
    "Expected leaderboard view to disable the landing background image.",
  );

  assert.doesNotMatch(
    componentSource,
    /Total Miners|10,248|124\.5M BASE/,
    "Expected leaderboard stat cards to be removed.",
  );

  const requiredClasses = [
    ".leaderboardHero",
    ".leaderboardIntro",
    ".leaderboardStage",
    ".leaderboardStageBackdrop",
    ".leaderboardStageImage",
    ".leaderboardBoard",
    ".leaderboardBoardHeader",
  ];

  for (const className of requiredClasses) {
    assert.match(
      cssSource,
      new RegExp(className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Expected leaderboard stylesheet to include ${className}.`,
    );
  }

  assert.match(
    cssSource,
    /mask-image:\s*linear-gradient/,
    "Expected leaderboard art to fade out with a vertical mask.",
  );
});

test("leaderboard hero stays restrained while allowing the oversized board gap", async () => {
  const cssPath = path.join(currentDir, "tempo-landing-page.module.css");
  const cssSource = await readFile(cssPath, "utf8");

  const readBlock = (selector: string) => {
    const block = cssSource.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
    assert.ok(block, `Expected to find the ${selector} CSS block.`);
    return block[1];
  };

  const readPixelValue = (block: string, property: string) => {
    const match = block.match(new RegExp(`${property}:\\s*(\\d+)px`));
    assert.ok(match, `Expected ${property} to be defined in pixels.`);
    return Number(match[1]);
  };

  const leaderboardView = readBlock("\\.leaderboardView");
  const leaderboardHero = readBlock("\\.leaderboardHero");
  const leaderboardStage = readBlock("\\.leaderboardStage");
  const tableEntry = readBlock("\\.tableEntry");

  assert.ok(
    readPixelValue(leaderboardView, "padding") <= 45,
    "Expected leaderboard top padding to remain restrained.",
  );
  assert.ok(
    readPixelValue(leaderboardHero, "min-height") <= 190,
    "Expected leaderboard hero height to stay restrained even with the larger gap.",
  );
  assert.ok(
    readPixelValue(leaderboardStage, "min-height") <= 210,
    "Expected leaderboard artwork stage to avoid ballooning vertically.",
  );
  assert.ok(
    readPixelValue(tableEntry, "min-height") <= 50,
    "Expected table rows to stay short enough for the top 10 to fit.",
  );
});

test("leaderboard artwork stretches horizontally across the full stage", async () => {
  const cssPath = path.join(currentDir, "tempo-landing-page.module.css");
  const cssSource = await readFile(cssPath, "utf8");

  assert.match(
    cssSource,
    /\.leaderboardStageBackdrop\s*\{[\s\S]*?inset:\s*0;/,
    "Expected leaderboard backdrop to span the entire artwork stage.",
  );

  assert.match(
    cssSource,
    /\.leaderboardStageImage\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?object-fit:\s*cover;/,
    "Expected leaderboard artwork to fill the stage horizontally with cover sizing.",
  );
});

test("leaderboard art blends into the background and leaves a dramatic gap above the board", async () => {
  const cssPath = path.join(currentDir, "tempo-landing-page.module.css");
  const cssSource = await readFile(cssPath, "utf8");

  assert.match(
    cssSource,
    /\.leaderboardStage::after\s*\{[\s\S]*?linear-gradient\(90deg,/,
    "Expected leaderboard stage to add left-right fade blending.",
  );

  assert.match(
    cssSource,
    /\.leaderboardStageImage\s*\{[\s\S]*?object-position:\s*center\s+[6-9]\d%;/,
    "Expected leaderboard artwork to be shifted lower through object positioning.",
  );

  assert.match(
    cssSource,
    /\.leaderboardBoard\s*\{[\s\S]*?margin-top:\s*(?:[2-9]\d{2}|\d{4,})px;/,
    "Expected leaderboard board to leave a dramatic gap below the artwork.",
  );

  assert.match(
    cssSource,
    /\.leaderboardIntro\s*\{[\s\S]*?align-self:\s*end;/,
    "Expected leaderboard intro copy to sit lower and align with the artwork composition.",
  );
});

test("navbar centers the labels and highlights the active section with deep purple neon", async () => {
  const componentPath = path.join(currentDir, "tempo-landing-page.tsx");
  const cssPath = path.join(currentDir, "tempo-landing-page.module.css");
  const [componentSource, cssSource] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(
    componentSource,
    /const\s+\[activeNavItem,\s*setActiveNavItem\]\s*=\s*useState/,
    "Expected navbar to track the active navigation item.",
  );

  assert.match(
    componentSource,
    /styles\.topNavLinkActive/,
    "Expected component to apply an active navbar class.",
  );

  const requiredClasses = [
    ".topNavRail",
    ".topNavLink",
    ".topNavLinkActive",
  ];

  for (const className of requiredClasses) {
    assert.match(
      cssSource,
      new RegExp(className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Expected navbar stylesheet to include ${className}.`,
    );
  }

  assert.match(
    cssSource,
    /animation:\s*baseBluePulse/,
    "Expected active navbar indicator to use a pulse animation.",
  );

  assert.match(
    cssSource,
    /box-shadow:[\s\S]*rgba\(111,\s*56,\s*255/i,
    "Expected active navbar state to use a deep purple neon glow.",
  );
});
