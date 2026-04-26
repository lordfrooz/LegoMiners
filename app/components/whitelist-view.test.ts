import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

test("whitelist view matches the approved early access poster layout", async () => {
  const componentPath = path.join(currentDir, "whitelist-view.tsx");
  const cssPath = path.join(currentDir, "whitelist-view.module.css");
  const [componentSource, cssSource] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  const requiredCopy = [
    "EARLY ACCESS",
    "Join the",
    "Whitelist",
    "Connect your wallet",
    "Connect Wallet",
    "POPULAR WALLETS",
    "LAUNCH REWARD",
    "Free Miner & Airdrop",
    "TOTAL ENTRIES",
    "TASKS COMPLETED",
    "Higher XP.",
  ];

  for (const snippet of requiredCopy) {
    assert.match(
      componentSource,
      new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Expected whitelist view to include "${snippet}".`,
    );
  }

  const requiredClasses = [
    ".heroGrid",
    ".heroCopy",
    ".walletPanel",
    ".rewardShowcase",
    ".statsGrid",
    ".statCard",
    ".spotlightCard",
    ".walletOptions",
  ];

  for (const className of requiredClasses) {
    assert.match(
      cssSource,
      new RegExp(className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Expected whitelist stylesheet to include ${className}.`,
    );
  }

  assert.match(
    componentSource,
    /src="\/whitelist_bg\.png"/,
    "Expected whitelist background art to use whitelist_bg.png.",
  );

  assert.match(
    componentSource,
    /src="\/wallet\.png"/,
    "Expected wallet panel art to use wallet.png.",
  );

  assert.match(
    componentSource,
    /src="\/freeminer\.png"/,
    "Expected reward art to use freeminer.png.",
  );

  assert.match(
    cssSource,
    /grid-template-columns:\s*minmax\(0,\s*1\.04fr\)\s*minmax\(380px,\s*0\.9fr\)/,
    "Expected the hero to use the approved left-copy/right-panel split.",
  );
});

test("whitelist view keeps the home footer, lighter typography, and highlighted connect copy", async () => {
  const componentPath = path.join(currentDir, "whitelist-view.tsx");
  const cssPath = path.join(currentDir, "whitelist-view.module.css");
  const [componentSource, cssSource] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  const requiredCopy = [
    "BUILT FOR",
    "Degens",
    "BASE",
    "Connect",
    "Wallet",
  ];

  for (const snippet of requiredCopy) {
    assert.match(
      componentSource,
      new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Expected whitelist view to include "${snippet}".`,
    );
  }

  const requiredClasses = [
    ".footerBand",
    ".footerColumn",
    ".footerSocialButton",
    ".networkLockup",
  ];

  for (const className of requiredClasses) {
    assert.match(
      cssSource,
      new RegExp(className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Expected whitelist stylesheet to include ${className}.`,
    );
  }

  assert.match(
    componentSource,
    /<span className=\{styles\.connectAccent\}>Connect<\/span>/,
    "Expected the Connect word to receive its own accent styling.",
  );

  assert.match(
    cssSource,
    /\.title\s*\{[\s\S]*?font-size:\s*clamp\(3\.05rem,\s*5\.15vw,\s*4\.4rem\)/,
    "Expected whitelist title typography to be reduced and more minimal.",
  );

});

test("whitelist view stays inside the desktop viewport without triggering page scroll", async () => {
  const cssPath = path.join(currentDir, "whitelist-view.module.css");
  const cssSource = await readFile(cssPath, "utf8");

  assert.match(
    cssSource,
    /\.whitelistView\s*\{[\s\S]*?height:\s*calc\(100svh\s*-\s*96px\);[\s\S]*?overflow:\s*hidden;/,
    "Expected desktop whitelist layout to lock itself to the available viewport height.",
  );

  assert.match(
    cssSource,
    /\.statCard\s*\{[\s\S]*?min-height:\s*126px;/,
    "Expected desktop stat cards to be compact enough to keep the footer on screen.",
  );

  assert.match(
    cssSource,
    /\.footerBand\s*\{[\s\S]*?margin:\s*0;/,
    "Expected desktop footer to sit inside the fixed whitelist viewport without extra offset.",
  );

  assert.match(
    cssSource,
    /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.whitelistView\s*\{[\s\S]*?height:\s*auto;[\s\S]*?overflow:\s*visible;/,
    "Expected mobile layout to release the fixed desktop height.",
  );
});

test("whitelist view uses home-style glass cards, no heading boxes, and compact reward/wallet layout", async () => {
  const componentPath = path.join(currentDir, "whitelist-view.tsx");
  const cssPath = path.join(currentDir, "whitelist-view.module.css");
  const [componentSource, cssSource] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.doesNotMatch(
    componentSource,
    /styles\.copyGlass|styles\.walletCopyGlass/,
    "Expected heading box wrappers to be removed from the whitelist copy blocks.",
  );

  assert.match(
    componentSource,
    /renderWalletLogo|walletLogoSvg|walletLogoMark/,
    "Expected popular wallets to render with logo marks instead of letter badges.",
  );

  assert.match(
    cssSource,
    /\.rewardShowcase\s*\{[\s\S]*?grid-template-columns:\s*132px minmax\(0,\s*1fr\);[\s\S]*?min-height:\s*126px;/,
    "Expected the Free Miner card to be compact and minimal.",
  );

  assert.match(
    cssSource,
    /\.walletPanel\s*\{[\s\S]*?width:\s*90%;[\s\S]*?justify-self:\s*end;/,
    "Expected the connect wallet panel to be about ten percent narrower on desktop.",
  );

  assert.match(
    cssSource,
    /\.rewardShowcase,\s*\.walletPanelFrame,\s*\.statCard,\s*\.footerBand,\s*\.successPanel\s*\{[\s\S]*?background:\s*linear-gradient\(180deg,\s*rgba\(11,\s*13,\s*23,\s*0\.72\)\s*0%,\s*rgba\(8,\s*9,\s*16,\s*0\.66\)\s*100%\);[\s\S]*?backdrop-filter:\s*blur\(10px\);/,
    "Expected whitelist cards to use the same glass treatment as home cards.",
  );
});
