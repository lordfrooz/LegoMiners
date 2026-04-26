import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

test("game leaderboard always reserves ten ranks and anchors the kelahmad art in the header", async () => {
  const componentPath = path.join(currentDir, "tempo-game-app.tsx");
  const cssPath = path.join(currentDir, "../globals.css");
  const [componentSource, cssSource] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(
    componentSource,
    /const\s+LEADERBOARD_SLOT_COUNT\s*=\s*10/,
    "Expected the game leaderboard to define a ten-slot layout.",
  );

  assert.match(
    componentSource,
    /Array\.from\(\{\s*length:\s*LEADERBOARD_SLOT_COUNT\s*\}/,
    "Expected the game leaderboard to pad missing ranks up to ten slots.",
  );

  assert.match(
    componentSource,
    /label:\s*"Awaiting miner"/,
    "Expected empty leaderboard slots to render a clear placeholder label.",
  );

  assert.match(
    componentSource,
    /leaderboardDisplayEntries\.map\(/,
    "Expected the rendered leaderboard rows to use the padded leaderboard slots.",
  );

  assert.match(
    componentSource,
    /src="\/kelahmad\.png"/,
    "Expected the leaderboard title row to render the kelahmad art asset.",
  );

  assert.match(
    componentSource,
    /game-hud-panel-head-title-row/,
    "Expected the leaderboard header to use a dedicated title row for the art alignment.",
  );

  assert.match(
    cssSource,
    /\.game-hud-panel-head-title-row\s*\{[\s\S]*?justify-content:\s*space-between;/,
    "Expected the leaderboard title row to push the art to the far right.",
  );

  assert.match(
    cssSource,
    /\.game-hud-leaderboard-badge\s*\{[\s\S]*?align-self:\s*end;/,
    "Expected the kelahmad art to sit on the lower edge of the title row.",
  );
});
