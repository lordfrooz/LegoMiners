"use client";

import { useState } from "react";
import {
  Info,
  MapPinned,
  Package,
  Pickaxe,
  Trophy,
} from "lucide-react";
import styles from "./tempo-landing-page.module.css";
import { getTempoLandingContent } from "./tempo-landing-content";
import { WhitelistView } from "./whitelist-view";

type ArtVariant = "pickaxe" | "chest" | "map" | "trophy";

type View = "home" | "leaderboard" | "whitelist";
type NavItemId = "mine" | "leaderboard" | "whitelist";

type LeaderboardEntry = {
  rank: number;
  name: string;
  title: string;
  totalMined: string;
  blocksMined: string;
  avatarTone: "gold" | "stone" | "bronze" | "blue" | "amber";
};

const LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "BaseDragon",
    title: "Legend",
    totalMined: "12.4M BASE",
    blocksMined: "38,521",
    avatarTone: "gold",
  },
  {
    rank: 2,
    name: "BlockHunt3r",
    title: "Master",
    totalMined: "9.8M BASE",
    blocksMined: "29,083",
    avatarTone: "stone",
  },
  {
    rank: 3,
    name: "CryptoMiner",
    title: "Master",
    totalMined: "8.1M BASE",
    blocksMined: "24,991",
    avatarTone: "bronze",
  },
  {
    rank: 4,
    name: "MetaMiner",
    title: "Expert",
    totalMined: "7.2M BASE",
    blocksMined: "21,488",
    avatarTone: "blue",
  },
  {
    rank: 5,
    name: "ChainRanger",
    title: "Expert",
    totalMined: "6.4M BASE",
    blocksMined: "18,732",
    avatarTone: "amber",
  },
  {
    rank: 6,
    name: "AbyssDigger",
    title: "Expert",
    totalMined: "5.6M BASE",
    blocksMined: "16,221",
    avatarTone: "stone",
  },
  {
    rank: 7,
    name: "NeonPickaxe",
    title: "Pro",
    totalMined: "4.9M BASE",
    blocksMined: "14,082",
    avatarTone: "gold",
  },
  {
    rank: 8,
    name: "SolVault",
    title: "Pro",
    totalMined: "4.1M BASE",
    blocksMined: "11,287",
    avatarTone: "amber",
  },
  {
    rank: 9,
    name: "IronMiner",
    title: "Pro",
    totalMined: "3.6M BASE",
    blocksMined: "9,842",
    avatarTone: "stone",
  },
  {
    rank: 10,
    name: "CrystalCrafter",
    title: "Rookie",
    totalMined: "3.2M BASE",
    blocksMined: "8,113",
    avatarTone: "gold",
  },
];

const NAV_ITEMS: Array<{
  id: NavItemId;
  label: string;
  href: string;
  view: View;
}> = [
  { id: "mine", label: "Mine & Earn", href: "#tokenomics", view: "home" },
  { id: "leaderboard", label: "Leaderboard", href: "#leaderboard", view: "leaderboard" },
  { id: "whitelist", label: "Whitelist", href: "#whitelist", view: "whitelist" },
];

export function TempoLandingPage() {
  const content = getTempoLandingContent();
  const [activeView, setActiveView] = useState<View>("home");
  const [activeNavItem, setActiveNavItem] = useState<NavItemId>("mine");

  return (
    <main className={styles.page}>
      <div
        className={styles.shell}
        style={{
          backgroundImage:
            activeView === "leaderboard" || activeView === "whitelist"
              ? "none"
              : `url(${content.hero.backgroundImage})`,
        }}
      >
        <div className={styles.topStack}>
          <div className={styles.topBar}>
            <a className={styles.brandLockup} href="#home" aria-label="Lego Miners home">
              <img
                alt="Lego Miners logo"
                className={styles.brandLogo}
                src="/legominers.jpeg"
              />
              <span>Lego Miners</span>
            </a>

            <div className={styles.topNavRail}>
              <nav className={styles.topNav} aria-label="Primary">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`${styles.topNavLink} ${activeNavItem === item.id ? styles.topNavLinkActive : ""}`.trim()}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveNavItem(item.id);
                      setActiveView(item.view);
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <a
            className={styles.announcementBar}
            href="https://x.com/legominersxyz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit the new Lego Miners X account"
          >
            <span className={styles.announcementBadge}>Announcement</span>
            <span className={styles.announcementText}>
              Our old X account got suspended. Follow our new account
              <strong>@legominersxyz</strong>
            </span>
            <span className={styles.announcementCta}>
              Click to follow
              <ArrowIcon />
            </span>
          </a>
        </div>

        {activeView === "leaderboard" ? (
          <section className={styles.leaderboardView}>
            <div className={styles.leaderboardHero}>
              <div className={styles.leaderboardIntro}>
                <div className={styles.leaderboardIntroContent}>
                  <span className={styles.leaderboardEyebrow}>
                    <Trophy size={14} strokeWidth={1.8} />
                    <span>{"Compete & Climb"}</span>
                  </span>
                  <h1 className={styles.leaderboardTitle}>Leaderboard</h1>
                  <p className={styles.leaderboardDescription}>
                    <span>Climb the ranks, compete with miners,</span>
                    <span>and earn epic rewards across Base.</span>
                  </p>
                </div>
              </div>
              <div className={styles.leaderboardStage}>
                <div className={styles.leaderboardStageBackdrop} aria-hidden="true">
                  <img
                    src="/kelahmad.png"
                    alt=""
                    className={styles.leaderboardStageImage}
                  />
                </div>
              </div>
            </div>

            <div className={`${styles.leaderboardBoard} ${styles.leaderboardBoardBlurred}`}>
              <div className={styles.leaderboardBoardHeader}>
                <span className={styles.colRank}>#</span>
                <span className={styles.colMiner}>Miner</span>
                <span className={styles.colTotal}>
                  <span>Total Mined</span>
                  <Info size={14} strokeWidth={1.8} />
                </span>
                <span className={styles.colBlocks}>Blocks Mined</span>
              </div>

              <div className={styles.tableEntries}>
                {LEADERBOARD_ENTRIES.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`${styles.tableEntry} ${entry.rank === 1 ? styles.tableEntryFeatured : ""}`.trim()}
                  >
                    <span
                      className={`${styles.entryRank} ${getRankClass(entry.rank)}`}
                    >
                      {entry.rank}
                    </span>

                    <div className={styles.entryMiner}>
                      <span className={`${styles.entryAvatar} ${getAvatarToneClass(entry.avatarTone)}`} aria-hidden="true">
                        ?
                      </span>
                      <div className={styles.entryIdentity}>
                        <div className={styles.entryNameLine}>
                          <strong>Unknown</strong>
                        </div>
                      </div>
                    </div>

                    <span className={styles.entryTotal}>{entry.totalMined}</span>
                    <span className={styles.entryBlocks}>{entry.blocksMined}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : activeView === "whitelist" ? (
          <WhitelistView />
        ) : (
          <section className={styles.hero} id="about">
            <div className={styles.heroCopy}>
              <h1 className={styles.headline}>
                <span>{content.hero.headline[0]}</span>
                <span className={styles.headlineAccent}>{content.hero.headline[1]}</span>
              </h1>
              <p className={styles.description}>{content.hero.description}</p>

              <div className={styles.ctaRow}>
                <a
                  className={styles.primaryCta}
                  href={content.hero.primaryCta.href}
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveNavItem("whitelist");
                    setActiveView("whitelist");
                  }}
                >
                  <WalletIcon />
                  <span>{content.hero.primaryCta.label}</span>
                </a>
              </div>

              <div className={styles.walletNote}>
                <span className={styles.walletNoteIcon}>
                  <ShieldCheckIcon />
                </span>
                <span>We never store your private keys.</span>
              </div>
            </div>

            <div className={styles.heroVisual} aria-hidden="true" />
          </section>
        )}

        {activeView === "home" && (
          <section className={styles.featureGrid} id="tokenomics">
            {content.features.map((feature) => (
              <article key={feature.title} className={styles.featureCard}>
                <div className={styles.featureLeft}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureArt}>{renderFeatureIcon(feature.art as ArtVariant)}</div>
                    <h2 className={styles.featureTitle}>{feature.title}</h2>
                  </div>
                  <p className={styles.featureDescription}>{feature.description}</p>
                  <a
                    aria-label={`${feature.title} link`}
                    className={styles.featureArrow}
                    href={feature.href}
                    onClick={(event) => {
                      if (feature.href === "#whitelist") {
                        event.preventDefault();
                        setActiveNavItem("whitelist");
                        setActiveView("whitelist");
                      }
                    }}
                  >
                    <ArrowIcon />
                  </a>
                </div>
                <div className={styles.featureImageWrap}>
                  <img src={feature.image} alt={feature.title} className={styles.featureImage} />
                </div>
              </article>
            ))}
          </section>
        )}

        {activeView === "home" && (
          <footer className={styles.footerBand} id="community">
            <div className={styles.footerColumn}>
              <div>
                <p className={styles.footerHeading}>BUILT FOR</p>
                <strong>Degens</strong>
              </div>
            </div>

            <div className={styles.footerColumn}>
              <div className={styles.footerSocials}>
                <a className={styles.footerSocialButton} href="https://x.com/legominersxyz" target="_blank" rel="noopener noreferrer" aria-label="X">
                  X
                </a>
                <a className={styles.footerSocialButton} href="https://legominers.xyz" target="_blank" rel="noopener noreferrer" aria-label="Website">
                  <WebsiteIcon />
                </a>
              </div>
            </div>

            <div className={styles.footerColumn}>
              <div className={styles.networkLockup}>
                <img
                  alt="Base logo"
                  className={styles.networkLogo}
                  src="/base-logo.svg"
                />
                <strong>BASE</strong>
              </div>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

function getAvatarToneClass(tone: LeaderboardEntry["avatarTone"]) {
  switch (tone) {
    case "gold":
      return styles.avatarGold;
    case "stone":
      return styles.avatarStone;
    case "bronze":
      return styles.avatarBronze;
    case "blue":
      return styles.avatarBlue;
    case "amber":
      return styles.avatarAmber;
  }
}

function getRankClass(rank: number) {
  switch (rank) {
    case 1:
      return styles.rankGold;
    case 2:
      return styles.rankSilver;
    case 3:
      return styles.rankBronze;
    default:
      return styles.rankPlain;
  }
}

function renderFeatureIcon(variant: ArtVariant) {
  switch (variant) {
    case "pickaxe":
      return <Pickaxe className={styles.featureIconStroke} strokeWidth={1.8} />;
    case "chest":
      return <Package className={styles.featureIconStroke} strokeWidth={1.8} />;
    case "map":
      return <MapPinned className={styles.featureIconStroke} strokeWidth={1.8} />;
    case "trophy":
      return <Trophy className={styles.featureIconStroke} strokeWidth={1.8} />;
  }
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.inlineIcon} aria-hidden="true">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v1.5H6.5a1.5 1.5 0 0 0 0 3H20V17a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="16.5" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.noteIconSvg} aria-hidden="true">
      <path
        d="M12 3.5c2.8 1.8 5.3 2.7 7.5 2.9v5.2c0 4.6-2.5 7.9-7.5 10-5-2.1-7.5-5.4-7.5-10V6.4c2.2-.2 4.7-1.1 7.5-2.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m8.8 12.3 2.2 2.2 4.5-4.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.inlineIcon} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 8.8 15.8 12 10 15.2V8.8Z" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.arrowSvg} aria-hidden="true">
      <path d="M8 12h8M13 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.arrowSvg} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.8 12h16.4M12 3.8a13.8 13.8 0 0 1 0 16.4M12 3.8a13.8 13.8 0 0 0 0 16.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.arrowSvg} aria-hidden="true">
      <path
        d="M12 3.5v3.2M12 17.3v3.2M20.5 12h-3.2M6.7 12H3.5M17.9 6.1l-2.3 2.3M8.4 15.6l-2.3 2.3M17.9 17.9l-2.3-2.3M8.4 8.4 6.1 6.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

