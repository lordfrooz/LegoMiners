export type AgentType = "builder" | "trader" | "finance";
export type PackageTier = AgentType;
export type OfficeTier = "standard" | "luxury" | "ultra";
export type PaymentToken = "pathusd" | "usdc";

export type PaymentTokenDefinition = {
  id: PaymentToken;
  label: string;
  symbol: string;
};

export type AgentRecord = {
  id: string;
  type: AgentType;
  incomePerMinute: number;
  createdAt: number;
  label: string;
  rarity: string;
  description: string;
};

export type AgentPositionRecord = {
  agentId: string;
  x: number;
  y: number;
};

export type MarketPurchaseRecord = {
  itemType: "agent" | "slot";
  itemId: string;
  pathUsdPrice: string;
  paymentToken?: PaymentToken;
  txHash: string;
  purchasedAt: number;
};

export type PackageDefinition = {
  id: PackageTier;
  badge: string;
  rarityLabel: string;
  title: string;
  summary: string;
  bonusPercent: number;
  starterAgentType: AgentType;
  starterAgentLabel: string;
  officeTier: OfficeTier;
  officeLabel: string;
  agentLimit: number;
  incomePerMinute: number;
  priceBand: string;
  landCards: number;
  essenceCards: number;
  ethPrice: string;
  pathUsdPrice: string;
  detail: string;
  guaranteedItems: string[];
};

export type StoredPlayerState = {
  packageId: PackageTier;
  agents: AgentRecord[];
  agentPositions?: AgentPositionRecord[];
  acquiredAt: number;
  lastCollectedAt: number;
  lifetimeCollected: number;
  packageSnapshot?: PackageDefinition;
  purchasePaymentToken?: PaymentToken;
  marketPurchases?: MarketPurchaseRecord[];
};

const PACK_RECOVERY_MINUTES = 60 * 24 * 3;

function calculatePackIncomePerMinute(pathUsdPrice: string, bonusPercent = 0) {
  const grossReturn = Number(pathUsdPrice) * (1 + bonusPercent / 100);
  return Math.floor((grossReturn / PACK_RECOVERY_MINUTES) * 1_000_000) / 1_000_000;
}

export const tempoPackages: PackageDefinition[] = [
  {
    id: "builder",
    badge: "Tier 01",
    rarityLabel: "Common",
    title: "Starter Pack",
    summary: "Starter Agent access with a standard operations office.",
    bonusPercent: 0,
    starterAgentType: "builder",
    starterAgentLabel: "Starter Agent",
    officeTier: "standard",
    officeLabel: "Standard Office",
    agentLimit: 3,
    incomePerMinute: calculatePackIncomePerMinute("1.79"),
    priceBand: "Entry Access",
    landCards: 2,
    essenceCards: 5,
    ethPrice: "0.04 ETH",
    pathUsdPrice: "1.79",
    detail: "Built for a 3-day payback window with clean baseline $TOPIA output.",
    guaranteedItems: [
      "1 Starter Agent",
      "Base $TOPIA yield",
      "Standard office skin",
      "3 total active slots",
    ],
  },
  {
    id: "trader",
    badge: "Tier 02",
    rarityLabel: "Special",
    title: "Special Pack",
    summary: "Special-tier access with a luxury execution office.",
    bonusPercent: 5,
    starterAgentType: "trader",
    starterAgentLabel: "Trader Agent",
    officeTier: "luxury",
    officeLabel: "Luxury Office",
    agentLimit: 5,
    incomePerMinute: calculatePackIncomePerMinute("12.79", 5),
    priceBand: "Mid Access",
    landCards: 4,
    essenceCards: 9,
    ethPrice: "0.09 ETH",
    pathUsdPrice: "12.79",
    detail: "Luxury office access with a 5% extra $TOPIA bonus on the 3-day recovery curve.",
    guaranteedItems: [
      "1 Special NFT",
      "+5% $TOPIA yield bonus",
      "Luxury office skin",
      "5 total active slots",
    ],
  },
  {
    id: "finance",
    badge: "Tier 03",
    rarityLabel: "Legendary",
    title: "Legendary Pack",
    summary: "Legendary-tier access with an ultra luxury treasury office.",
    bonusPercent: 35,
    starterAgentType: "finance",
    starterAgentLabel: "Finance Agent",
    officeTier: "ultra",
    officeLabel: "Ultra Luxury Office",
    agentLimit: 8,
    incomePerMinute: calculatePackIncomePerMinute("63.79", 35),
    priceBand: "Prime Access",
    landCards: 6,
    essenceCards: 14,
    ethPrice: "0.16 ETH",
    pathUsdPrice: "63.79",
    detail: "Ultra treasury tier with a 35% extra $TOPIA bonus and the fastest payback profile.",
    guaranteedItems: [
      "1 Legendary NFT",
      "+35% $TOPIA yield bonus",
      "Ultra office skin",
      "8 total active slots",
    ],
  },
];

export const paymentTokens: PaymentTokenDefinition[] = [
  { id: "pathusd", label: "PathUSD", symbol: "pathUSD" },
  { id: "usdc", label: "USDC", symbol: "USDC.e" },
];

export function isPaymentToken(value: unknown): value is PaymentToken {
  return value === "pathusd" || value === "usdc";
}

export function getPaymentToken(value: PaymentToken) {
  return paymentTokens.find((item) => item.id === value) ?? paymentTokens[0];
}

export function getTempoPackage(packageId: PackageTier) {
  return tempoPackages.find((item) => item.id === packageId) ?? tempoPackages[0];
}

export function getPackageBaseIncomePerMinute(packageDefinition: PackageDefinition) {
  return packageDefinition.bonusPercent > 0
    ? packageDefinition.incomePerMinute / (1 + packageDefinition.bonusPercent / 100)
    : packageDefinition.incomePerMinute;
}

export function getIncomePerDay(incomePerMinute: number) {
  return incomePerMinute * 1440;
}

export function buildStarterAgent(packageId: PackageTier): AgentRecord {
  const packageDefinition = getTempoPackage(packageId);

  return {
    id: `agent-${packageId}-${Date.now()}`,
    type: packageDefinition.starterAgentType,
    incomePerMinute: packageDefinition.incomePerMinute,
    createdAt: Date.now(),
    label: packageDefinition.starterAgentLabel,
    rarity: packageDefinition.rarityLabel,
    description: packageDefinition.summary,
  };
}

export function buildMarketAgent(packageId: PackageTier): AgentRecord {
  const packageDefinition = getTempoPackage(packageId);

  return {
    id: `market-agent-${packageId}-${Date.now()}`,
    type: packageDefinition.starterAgentType,
    incomePerMinute: packageDefinition.incomePerMinute,
    createdAt: Date.now(),
    label: packageDefinition.id === "builder" ? "Starter Agent" : packageDefinition.starterAgentLabel,
    rarity: packageDefinition.rarityLabel,
    description: packageDefinition.summary,
  };
}

export function formatPackageName(packageId: PackageTier) {
  return getTempoPackage(packageId).title;
}
