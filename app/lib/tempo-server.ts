import { createPublicClient, decodeEventLog, getAddress, http, parseUnits } from "viem";
import {
  buildStarterAgent,
  getTempoPackage,
  isPaymentToken,
  type PackageDefinition,
  type PackageTier,
  type PaymentToken,
  type StoredPlayerState,
} from "./tempo-game-data";
import { tempoMainnet, tempoRpcHttpUrl } from "./tempo-network";

const DEFAULT_PAYMENT_RECEIVER = "0xF3496428451A874845f770d719cc1C609a5c661e";
const DEFAULT_PATHUSD_ADDRESS = "0x20c0000000000000000000000000000000000000";
const DEFAULT_USDC_ADDRESS = "0x20c000000000000000000000b9537d11c60e8b50";
const PATHUSD_DECIMALS = 6;

const erc20TransferEventAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;

export const tempoPublicClient = createPublicClient({
  chain: tempoMainnet,
  transport: http(tempoRpcHttpUrl),
});

export function getPathUsdAddress() {
  return getAddress(process.env.NEXT_PUBLIC_PATHUSD_ADDRESS ?? DEFAULT_PATHUSD_ADDRESS);
}

export function getUsdcAddress() {
  return getAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS ?? process.env.USDC_ADDRESS ?? DEFAULT_USDC_ADDRESS);
}

export function getPaymentTokenAddress(paymentToken: PaymentToken) {
  return paymentToken === "usdc" ? getUsdcAddress() : getPathUsdAddress();
}

export function getPaymentReceiverAddress() {
  return getAddress(process.env.NEXT_PUBLIC_PAYMENT_RECEIVER ?? DEFAULT_PAYMENT_RECEIVER);
}

export function getPackagePaymentAmount(packageId: PackageTier) {
  return parseUnits(getTempoPackage(packageId).pathUsdPrice, PATHUSD_DECIMALS);
}

export function getMarketAgentPaymentAmount(packageId: PackageTier) {
  return parseUnits((Number(getTempoPackage(packageId).pathUsdPrice) * 0.8).toFixed(2), PATHUSD_DECIMALS);
}

export function getExtraSlotPaymentAmount(pathUsdPrice: string) {
  return parseUnits((Number(pathUsdPrice) * 0.44).toFixed(2), PATHUSD_DECIMALS);
}

export function normalizePaymentToken(value: unknown): PaymentToken {
  return isPaymentToken(value) ? value : "pathusd";
}

function isPackageTier(value: unknown): value is PackageTier {
  return value === "builder" || value === "trader" || value === "finance";
}

function readPlainPackageSnapshot(snapshot: unknown): Partial<PackageDefinition> {
  if (!snapshot || typeof snapshot !== "object") {
    return {};
  }

  const maybeDocument = snapshot as { toObject?: () => unknown };
  const plainSnapshot =
    typeof maybeDocument.toObject === "function" ? maybeDocument.toObject() : snapshot;

  return plainSnapshot && typeof plainSnapshot === "object"
    ? (plainSnapshot as Partial<PackageDefinition>)
    : {};
}

function pickString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function pickNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function hydratePlayerPackageSnapshot(player: {
  packageId: unknown;
  packageSnapshot?: unknown;
  markModified?: (path: string) => void;
}) {
  const packageId = isPackageTier(player.packageId) ? player.packageId : "builder";
  const fallback = getTempoPackage(packageId);
  const existingSnapshot = readPlainPackageSnapshot(player.packageSnapshot);
  const nextSnapshot: PackageDefinition = {
    id: fallback.id,
    badge: pickString(existingSnapshot.badge, fallback.badge),
    rarityLabel: pickString(existingSnapshot.rarityLabel, fallback.rarityLabel),
    title: pickString(existingSnapshot.title, fallback.title),
    summary: pickString(existingSnapshot.summary, fallback.summary),
    bonusPercent: pickNumber(existingSnapshot.bonusPercent, fallback.bonusPercent),
    starterAgentType: isPackageTier(existingSnapshot.starterAgentType)
      ? existingSnapshot.starterAgentType
      : fallback.starterAgentType,
    starterAgentLabel: pickString(existingSnapshot.starterAgentLabel, fallback.starterAgentLabel),
    officeTier:
      existingSnapshot.officeTier === "standard" ||
      existingSnapshot.officeTier === "luxury" ||
      existingSnapshot.officeTier === "ultra"
        ? existingSnapshot.officeTier
        : fallback.officeTier,
    officeLabel: pickString(existingSnapshot.officeLabel, fallback.officeLabel),
    agentLimit: pickNumber(existingSnapshot.agentLimit, fallback.agentLimit),
    incomePerMinute: pickNumber(existingSnapshot.incomePerMinute, fallback.incomePerMinute),
    priceBand: pickString(existingSnapshot.priceBand, fallback.priceBand),
    landCards: pickNumber(existingSnapshot.landCards, fallback.landCards),
    essenceCards: pickNumber(existingSnapshot.essenceCards, fallback.essenceCards),
    ethPrice: pickString(existingSnapshot.ethPrice, fallback.ethPrice),
    pathUsdPrice: pickString(existingSnapshot.pathUsdPrice, fallback.pathUsdPrice),
    detail: pickString(existingSnapshot.detail, fallback.detail),
    guaranteedItems:
      Array.isArray(existingSnapshot.guaranteedItems) && existingSnapshot.guaranteedItems.length > 0
        ? existingSnapshot.guaranteedItems
        : fallback.guaranteedItems,
  };

  player.packageSnapshot = nextSnapshot;
  player.markModified?.("packageSnapshot");

  return nextSnapshot;
}

export function calculateUnclaimedIncome(player: StoredPlayerState | null, now: number) {
  if (!player) {
    return 0;
  }

  const elapsedMs = Math.max(0, now - player.lastCollectedAt);
  const elapsedWholeMinutes = Math.floor(elapsedMs / 60000);
  const totalIncomePerMinute = player.agents.reduce((sum, agent) => {
    return sum + agent.incomePerMinute;
  }, 0);

  return elapsedWholeMinutes * totalIncomePerMinute;
}

export function roundIncome(value: number) {
  return Math.floor(value * 1_000_000) / 1_000_000;
}

export function createStarterPlayer(
  packageId: PackageTier,
  purchaseTxHash: string,
  purchasePaymentToken: PaymentToken = "pathusd",
): StoredPlayerState & { purchaseTxHash: string } {
  const packageSnapshot = getTempoPackage(packageId);
  const starterAgent = buildStarterAgent(packageId);
  const now = Date.now();

  return {
    packageId,
    packageSnapshot,
    agents: [starterAgent],
    acquiredAt: now,
    lastCollectedAt: now,
    lifetimeCollected: 0,
    purchaseTxHash,
    purchasePaymentToken,
  };
}

export async function verifyPurchaseTransaction(
  txHash: `0x${string}`,
  walletAddress: string,
  packageId: PackageTier,
  paymentToken: PaymentToken = "pathusd",
) {
  return verifyPaymentTransfer(txHash, walletAddress, getPackagePaymentAmount(packageId), paymentToken);
}

export async function verifyPaymentTransfer(
  txHash: `0x${string}`,
  walletAddress: string,
  expectedAmount: bigint,
  paymentToken: PaymentToken = "pathusd",
) {
  const normalizedWallet = getAddress(walletAddress);
  const tokenAddress = getPaymentTokenAddress(paymentToken);
  const paymentReceiver = getPaymentReceiverAddress();

  const [transaction, receipt] = await Promise.all([
    tempoPublicClient.getTransaction({ hash: txHash }),
    tempoPublicClient.getTransactionReceipt({ hash: txHash }),
  ]);

  if (receipt.status !== "success") {
    throw new Error("Payment transaction failed on-chain.");
  }

  if (!transaction.to || getAddress(transaction.to) !== tokenAddress) {
    throw new Error("Transaction target does not match the selected payment token contract.");
  }

  if (getAddress(transaction.from) !== normalizedWallet) {
    throw new Error("Transaction sender does not match the authenticated wallet.");
  }

  const hasValidTransfer = receipt.logs.some((log) => {
    if (getAddress(log.address) !== tokenAddress) {
      return false;
    }

    try {
      const decoded = decodeEventLog({
        abi: erc20TransferEventAbi,
        data: log.data,
        topics: log.topics,
      });

      return (
        decoded.eventName === "Transfer" &&
        getAddress(decoded.args.from) === normalizedWallet &&
        getAddress(decoded.args.to) === paymentReceiver &&
        decoded.args.value === expectedAmount
      );
    } catch {
      return false;
    }
  });

  if (!hasValidTransfer) {
    throw new Error("No matching payment token transfer was found in the transaction logs.");
  }

  return {
    txHash,
    expectedAmount,
  };
}

export async function verifyPathUsdTransfer(
  txHash: `0x${string}`,
  walletAddress: string,
  expectedAmount: bigint,
) {
  return verifyPaymentTransfer(txHash, walletAddress, expectedAmount, "pathusd");
}
