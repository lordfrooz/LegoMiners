import assert from "node:assert/strict";
import test from "node:test";

import { getTempoLandingContent } from "./tempo-landing-content.ts";

test("landing content matches the approved clone structure", () => {
  const content = getTempoLandingContent();

  assert.equal(content.hero.headline[0], "Mine. Earn. Build.");
  assert.equal(content.hero.headline[1], "On Base.");
  assert.equal(content.hero.primaryCta.label, "Go to Whitelist");
  assert.equal(content.hero.primaryCta.href, "#whitelist");
  assert.equal(content.hero.secondaryCta.label, "WATCH TRAILER");
  assert.equal(content.hero.backgroundImage, "/landing.png");

  assert.equal(content.navigation.length, 6);
  assert.deepEqual(
    content.navigation.map((item) => item.label),
    ["Home", "About", "How It Works", "Tokenomics", "Roadmap", "FAQ"],
  );

  assert.equal(content.stats.length, 4);
  assert.deepEqual(
    content.stats.map((item) => item.value),
    ["1.2M+", "8.5M+", "25M+", "99.9%"],
  );

  assert.equal(content.features.length, 4);
  assert.deepEqual(
    content.features.map((item) => item.title),
    [
      "Mine & Earn",
      "Collect & Upgrade",
      "Explore & Adventure",
      "Compete & Climb",
    ],
  );

  assert.equal(content.footer.partners.length, 3);
  assert.equal(content.footer.communityLinks.length, 4);
});
