export type TempoLandingLink = {
  label: string;
  href: string;
};

export type TempoLandingStat = {
  icon: string;
  value: string;
  label: string;
};

export type TempoLandingFeature = {
  art: string;
  image: string;
  title: string;
  description: string;
  href: string;
};

export type TempoLandingPartner = {
  label: string;
  accent: string;
};

export type TempoLandingContent = {
  brand: {
    name: [string, string];
    networkBadge: string;
  };
  navigation: TempoLandingLink[];
  hero: {
    eyebrow: string;
    headline: [string, string];
    description: string;
    primaryCta: TempoLandingLink;
    secondaryCta: TempoLandingLink;
    backgroundImage: string;
  };
  stats: TempoLandingStat[];
  features: TempoLandingFeature[];
  footer: {
    networkLabel: string;
    networkDescription: string;
    communityLinks: string[];
    auditedBy: string;
    partners: TempoLandingPartner[];
  };
};

const landingContent: TempoLandingContent = {
  brand: {
    name: ["Lego", "Miners"],
    networkBadge: "Base Network",
  },
  navigation: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Tokenomics", href: "#tokenomics" },
    { label: "Roadmap", href: "#roadmap" },
    { label: "FAQ", href: "#faq" },
  ],
  hero: {
    eyebrow: "Lego Miners",
    headline: ["Mine. Earn. Build.", "On Base."],
    description:
      "Join the adventure, mine valuable resources, earn rewards, and build your legacy in the Lego Miners universe.",
    primaryCta: { label: "Go to Whitelist", href: "#whitelist" },
    backgroundImage: "/landing.png",
  },
  stats: [
    { icon: "miners", value: "1.2M+", label: "Miners Joined" },
    { icon: "crystal", value: "8.5M+", label: "Blocks Mined" },
    { icon: "token", value: "25M+", label: "Tokens Distributed" },
    { icon: "shield", value: "99.9%", label: "Network Uptime" },
  ],
  features: [
    {
      art: "pickaxe",
      image: "/mine.png",
      title: "Mine & Earn",
      description:
        "Mine resources in exciting locations and earn $MINERS tokens as rewards.",
      href: "#whitelist",
    },
    {
      art: "chest",
      image: "/collect.png",
      title: "Collect & Upgrade",
      description:
        "Collect rare NFTs, upgrade your gear, and increase your mining power.",
      href: "/docs",
    },
    {
      art: "trophy",
      image: "/complete.png",
      title: "Compete & Climb",
      description:
        "Compete on leaderboards, join tournaments, and become the ultimate miner.",
      href: "/docs",
    },
  ],
  footer: {
    networkLabel: "Base Network",
    networkDescription: "Fast. Secure. Decentralized.",
    communityLinks: ["Discord", "X", "Telegram", "Globe"],
    auditedBy: "SOLIDProof",
    partners: [
      { label: "Raydium", accent: "R" },
      { label: "Jupiter", accent: "J" },
      { label: "Magic Eden", accent: "M" },
    ],
  },
};

export function getTempoLandingContent(): TempoLandingContent {
  return landingContent;
}
