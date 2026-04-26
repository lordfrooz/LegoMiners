import assert from "node:assert/strict";
import test from "node:test";

const {
  countSubmittedWhitelistTasks,
  deriveWhitelistViewStep,
  hasPersistableWhitelistHandle,
  isSubmittedWhitelistStatsRecord,
  normalizeTwitterHandle,
  normalizeWalletAddress,
} = await import(new URL("./whitelist.ts", import.meta.url).href);

test("normalizeWalletAddress lowercases checksum wallets for stable Mongo lookups", () => {
  assert.equal(
    normalizeWalletAddress("0xAbCdEf1234567890aBCDef1234567890ABCdEf12"),
    "0xabcdef1234567890abcdef1234567890abcdef12",
  );
});

test("normalizeTwitterHandle trims leading at signs", () => {
  assert.equal(normalizeTwitterHandle("  @@MinerFan "), "MinerFan");
  assert.equal(normalizeTwitterHandle(""), "");
});

test("hasPersistableWhitelistHandle only allows non-empty handles", () => {
  assert.equal(hasPersistableWhitelistHandle(""), false);
  assert.equal(hasPersistableWhitelistHandle(" @mm "), true);
});

test("deriveWhitelistViewStep restores saved task progress and submission state", () => {
  assert.equal(
    deriveWhitelistViewStep({
      whitelistStep: "tasks",
      completedTasks: ["share", "retweet"],
      isWhitelistSubmitted: false,
    }, 5),
    3,
  );

  assert.equal(
    deriveWhitelistViewStep({
      whitelistStep: "tasks",
      completedTasks: ["share", "retweet", "like", "comment", "notifications"],
      isWhitelistSubmitted: false,
    }, 5),
    4,
  );

  assert.equal(
    deriveWhitelistViewStep({
      whitelistStep: "tasks",
      completedTasks: ["share", "retweet", "like", "comment", "notifications"],
      isWhitelistSubmitted: true,
    }, 5),
    "success",
  );
});

test("submitted stats ignore malformed or incomplete whitelist records", () => {
  const records = [
    {
      isWhitelistSubmitted: true,
      twitterHandle: "minerfan",
      walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
      completedTasks: ["share", "retweet"],
    },
    {
      isWhitelistSubmitted: true,
      twitterHandle: "",
      walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
      completedTasks: ["share", "retweet", "like"],
    },
    {
      isWhitelistSubmitted: true,
      twitterHandle: "walletless",
      walletAddress: "",
      completedTasks: ["share"],
    },
    {
      isWhitelistSubmitted: false,
      twitterHandle: "draft",
      walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
      completedTasks: ["share", "retweet", "like", "comment"],
    },
  ];

  assert.equal(isSubmittedWhitelistStatsRecord(records[0]), true);
  assert.equal(isSubmittedWhitelistStatsRecord(records[1]), false);
  assert.equal(isSubmittedWhitelistStatsRecord(records[2]), false);
  assert.equal(isSubmittedWhitelistStatsRecord(records[3]), false);
  assert.equal(countSubmittedWhitelistTasks(records), 2);
});
