export type WhitelistViewStep = 1 | 2 | 3 | 4 | "success";

export type WhitelistProgressRecord = {
  completedTasks?: string[] | null;
  isWhitelistSubmitted?: boolean | null;
  referralCode?: string | null;
  twitterHandle?: string | null;
  walletAddress?: string | null;
  whitelistStep?: string | number | null;
};

const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function normalizeTwitterHandle(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/^@+/, "") : "";
}

export function normalizeWalletAddress(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function hasPersistableWhitelistHandle(value: unknown) {
  return normalizeTwitterHandle(value).length > 1;
}

export function deriveWhitelistViewStep(
  record: Pick<WhitelistProgressRecord, "completedTasks" | "isWhitelistSubmitted" | "whitelistStep">,
  totalTaskCount: number,
): WhitelistViewStep {
  if (record.isWhitelistSubmitted) {
    return "success";
  }

  if (record.whitelistStep === 2 || record.whitelistStep === 3 || record.whitelistStep === 4) {
    return record.whitelistStep;
  }

  if (record.whitelistStep === "tasks") {
    return Array.isArray(record.completedTasks) && record.completedTasks.length >= totalTaskCount ? 4 : 3;
  }

  if (record.whitelistStep === "wallet") {
    return 2;
  }

  return 1;
}

export function isSubmittedWhitelistStatsRecord(record: WhitelistProgressRecord) {
  return (
    record.isWhitelistSubmitted === true &&
    normalizeTwitterHandle(record.twitterHandle).length > 1 &&
    WALLET_ADDRESS_PATTERN.test(normalizeWalletAddress(record.walletAddress))
  );
}

export function countSubmittedWhitelistTasks(records: WhitelistProgressRecord[]) {
  return records.reduce((sum, record) => {
    if (!isSubmittedWhitelistStatsRecord(record)) {
      return sum;
    }

    return sum + (Array.isArray(record.completedTasks) ? record.completedTasks.length : 0);
  }, 0);
}

export function countAllWhitelistTasks(records: WhitelistProgressRecord[]) {
  return records.reduce((sum, record) => {
    return sum + (Array.isArray(record.completedTasks) ? record.completedTasks.length : 0);
  }, 0);
}
