export type AgentType = "builder" | "trader" | "finance";
export type PackageTier = AgentType;
export type OfficeTier = "standard" | "luxury" | "ultra";

export type AgentRecord = {
  id: string;
  type: AgentType;
  incomePerMinute: number;
  createdAt: number;
  label: string;
};

export type PackageDefinition = {
  id: PackageTier;
  badge: string;
  rarityLabel: string;
  title: string;
  summary: string;
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
  detail: string;
  guaranteedItems: string[];
};

export type StoredPlayerState = {
  packageId: PackageTier;
  agents: AgentRecord[];
  acquiredAt: number;
  lastCollectedAt: number;
  lifetimeCollected: number;
};

export const tempoPackages: PackageDefinition[] = [
  {
    id: "builder",
    badge: "Tier 01",
    rarityLabel: "Common",
    title: "Starter Pack",
    summary: "Starter NFT access with a standard operations office.",
    starterAgentType: "builder",
    starterAgentLabel: "Starter NFT",
    officeTier: "standard",
    officeLabel: "Standard Office",
    agentLimit: 3,
    incomePerMinute: 12,
    priceBand: "Entry Access",
    landCards: 2,
    essenceCards: 5,
    ethPrice: "0.04 ETH",
    detail: "Stable minute-by-minute production from a compact office stack.",
    guaranteedItems: [
      "1 Starter NFT",
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
    starterAgentType: "trader",
    starterAgentLabel: "Trader Agent",
    officeTier: "luxury",
    officeLabel: "Luxury Office",
    agentLimit: 5,
    incomePerMinute: 20,
    priceBand: "Mid Access",
    landCards: 4,
    essenceCards: 9,
    ethPrice: "0.09 ETH",
    detail: "Sharper command surfaces and a higher base minute yield.",
    guaranteedItems: [
      "1 Special NFT",
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
    starterAgentType: "finance",
    starterAgentLabel: "Finance Agent",
    officeTier: "ultra",
    officeLabel: "Ultra Luxury Office",
    agentLimit: 8,
    incomePerMinute: 32,
    priceBand: "Prime Access",
    landCards: 6,
    essenceCards: 14,
    ethPrice: "0.16 ETH",
    detail: "Top-tier treasury posture and the highest passive production rate.",
    guaranteedItems: [
      "1 Legendary NFT",
      "Ultra office skin",
      "8 total active slots",
    ],
  },
];

export function getTempoPackage(packageId: PackageTier) {
  return tempoPackages.find((item) => item.id === packageId) ?? tempoPackages[0];
}

export function buildStarterAgent(packageId: PackageTier): AgentRecord {
  const packageDefinition = getTempoPackage(packageId);

  return {
    id: `agent-${packageId}-${Date.now()}`,
    type: packageDefinition.starterAgentType,
    incomePerMinute: packageDefinition.incomePerMinute,
    createdAt: Date.now(),
    label: packageDefinition.starterAgentLabel,
  };
}

export function formatPackageName(packageId: PackageTier) {
  return getTempoPackage(packageId).title;
}
