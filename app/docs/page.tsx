import type { Metadata } from "next";
import Link from "next/link";
import {
  getIncomePerDay,
  getPackageBaseIncomePerMinute,
  tempoPackages,
} from "../lib/tempo-game-data";
import styles from "./wiki.module.css";

export const metadata: Metadata = {
  title: "TempoTopia Docs",
  description: "TempoTopia wiki, onboarding guide, economy reference, roadmap and gameplay manual.",
};

const sectionLinks = [
  { id: "welcome", label: "Welcome" },
  { id: "links", label: "Official Links" },
  { id: "overview", label: "Game Overview" },
  { id: "onboarding", label: "Getting Started" },
  { id: "wallet", label: "Wallet & Session" },
  { id: "packs", label: "Pack Tiers" },
  { id: "payments", label: "Payment Flow" },
  { id: "gameplay", label: "How To Play" },
  { id: "hud", label: "HUD Reference" },
  { id: "shop", label: "Shop & Expansion" },
  { id: "economy", label: "Economy" },
  { id: "seasons", label: "Seasons" },
  { id: "token", label: "Token & CA" },
  { id: "roadmap", label: "Roadmap" },
  { id: "goals", label: "Goals" },
  { id: "faq", label: "FAQ" },
  { id: "pending", label: "Pending Copy" },
];

const overviewBullets = [
  "TempoTopia is a wallet-based passive strategy game built around pack ownership, office progression and agent output.",
  "Players enter by buying a pack on Tempo Mainnet with PathUSD or USDC.e.",
  "Every pack unlocks a starter agent, a visual office tier and a minute-based $TOPIA income profile.",
  "From there, the main loop is simple: collect, expand, optimize and climb minute and daily output.",
];

const quickStartSteps = [
  {
    title: "Connect your wallet",
    body: "Use the wallet connect entry point and make sure you are on Tempo Mainnet before trying to buy anything.",
  },
  {
    title: "Sign the login message",
    body: "TempoTopia uses a wallet signature for session auth. This is not a payment and it does not move funds.",
  },
  {
    title: "Choose a pack",
    body: "Pick Starter, Special or Legendary based on your preferred access tier, slot count and earning profile.",
  },
  {
    title: "Pay with PathUSD or USDC.e",
    body: "Payments are ERC-20 transfers. The price is fixed in USD terms and gas is paid separately.",
  },
  {
    title: "Wait for finalize",
    body: "Once the transfer confirms on-chain, TempoTopia finalizes the purchase and unlocks the game state for your wallet.",
  },
  {
    title: "Start compounding",
    body: "Open the office, let agents work on a minute schedule, collect $TOPIA and use the shop to scale output.",
  },
];

const walletNotes = [
  "Authentication is wallet-based. There is no username-password account system.",
  "A signature is required to start a secure session and tie game state to the connected wallet.",
  "If the connected wallet changes, the session must be re-signed.",
  "If a payment confirms but finalize lags, the app keeps retrying and pending state can still be recovered from the same wallet.",
];

const paymentFlow = [
  "Connect wallet and sign the TempoTopia session message.",
  "Select a pack and choose PathUSD or USDC.e as the payment token.",
  "Approve the transfer in your wallet on Tempo Mainnet.",
  "Wait for the transfer receipt to confirm on-chain.",
  "TempoTopia verifies the transfer, matches token, sender, receiver and amount, then unlocks the pack.",
  "If the UI briefly shows pending finalize, do not repay. The app retries finalize automatically.",
];

const paymentTroubleshooting = [
  {
    title: "Insufficient token balance",
    body: "If the wallet cannot cover the selected pack price in PathUSD or USDC.e, the app surfaces a direct insufficient balance warning.",
  },
  {
    title: "Insufficient gas",
    body: "Token balance and gas balance are separate. Even with enough PathUSD or USDC.e, the wallet still needs Tempo gas for the transfer transaction.",
  },
  {
    title: "Transaction confirmed but still pending",
    body: "This usually means receipt indexing and purchase finalization are slightly out of sync. TempoTopia retries finalize and can resume the purchase state.",
  },
  {
    title: "Wrong network",
    body: "Pack and shop purchases only work on Tempo Mainnet. The client attempts to switch automatically, but the wallet must accept the network change.",
  },
];

const gameplayCards = [
  {
    title: "Core loop",
    body: "Buy a pack, unlock an office, receive a starter agent, generate minute-based $TOPIA, then expand using the in-game shop.",
  },
  {
    title: "Minute-based earnings",
    body: "TempoTopia deliberately uses full-minute accrual instead of fake second-level inflation. Rewards update on a cleaner, easier-to-explain cadence.",
  },
  {
    title: "Progression",
    body: "Progression comes from better packs, more slots, more agents and stronger total output across both minute and daily views.",
  },
  {
    title: "Identity",
    body: "Your connected wallet is your account. Pack ownership and unlocked progression live against that wallet state.",
  },
  {
    title: "Leaderboard",
    body: "Leaderboard ranking is currently based on output power. Higher minute income means a stronger position.",
  },
  {
    title: "Expansion",
    body: "After your pack unlocks, the shop becomes the compounding layer where extra agents and slots push income higher.",
  },
];

const hudCards = [
  {
    title: "pathUSD Balance",
    body: "Shows the wallet's current PathUSD balance as read from chain, useful for pack and shop readiness.",
  },
  {
    title: "$TOPIA Earned",
    body: "Displays lifetime collected plus currently unclaimed production for a quick treasury snapshot.",
  },
  {
    title: "$TOPIA / min",
    body: "The most important live rate in the game. This is the production speed the player is currently compounding.",
  },
  {
    title: "$TOPIA / day",
    body: "The same economy translated into a more legible 24-hour output view for planning and comparison.",
  },
  {
    title: "Unclaimed",
    body: "Income already accrued but not yet collected into the active balance view.",
  },
  {
    title: "Withdraw cadence",
    body: "Withdrawals are planned to be limited to one claim window per day, so the treasury flow stays paced instead of becoming constant spam.",
  },
  {
    title: "Available Slots",
    body: "How many more agents can be deployed before another slot purchase is required.",
  },
];

const shopCards = [
  {
    title: "Agent Collection",
    body: "The shop sells additional agents by tier. These increase total minute and daily output immediately after purchase finalization.",
  },
  {
    title: "Extra Slot",
    body: "Slots are capacity unlocks. Buying more agents without enough slot capacity creates bottlenecks, so slot expansion matters.",
  },
  {
    title: "Payment choice",
    body: "Shop purchases follow the same token flow as packs: select PathUSD or USDC.e, confirm on Tempo, then let the app finalize the result.",
  },
];

const economyRules = [
  "For current balancing, 1 $TOPIA is treated as 1 USD.",
  "Pack output is tuned around a 3-day recovery model before bonus adjustments.",
  "Special and Legendary packs visibly outperform their base yield using bonus-based income curves.",
  "Output is tracked in minute and daily terms to keep the economy readable for players.",
];

const seasonCards = [
  {
    title: "Season-based structure",
    body: "TempoTopia is planned to run in sequential seasons. The product does not treat every phase as permanently open at once.",
  },
  {
    title: "Season completion flow",
    body: "Each season has its own goals. When the active season's targets are completed, that season closes and the next season opens.",
  },
  {
    title: "Why this matters",
    body: "This lets the game pace content, progression and community attention around milestone-based releases instead of dumping every layer live from day one.",
  },
];

const tokenCards = [
  {
    title: "$TOPIA status",
    body: "$TOPIA is not live yet. The current game economy uses $TOPIA as an internal gameplay unit for balancing and UI communication.",
  },
  {
    title: "Launch reference price",
    body: "The current communication plan is that $TOPIA opens at 1 USD. After launch, market movement may push the price above that level.",
  },
  {
    title: "CA timing",
    body: "The contract address is not being treated as live right now. CA activation is expected after the game has been open for a period of time, not before launch day.",
  },
];

const roadmapItems = [
  {
    phase: "Season 1",
    title: "Launch season",
    body: "Wallet auth, pack purchase, office scenes, starter agents, minute-based production, shop utility and the first live progression loop. Season 1 closes once its targets are completed.",
  },
  {
    phase: "Season 2",
    title: "Expansion season",
    body: "Season 2 opens after Season 1 targets are completed. It is intended to expand the game loop with the next progression layer instead of overlapping both seasons at once.",
  },
  {
    phase: "Live ops",
    title: "Season cadence",
    body: "Future seasons follow the same model: goals are defined, the active season runs, milestones are completed, then the next season unlocks.",
  },
];

const goalItems = [
  "Make onboarding understandable for players who have never touched a wallet game before.",
  "Make the economy legible enough that players know exactly what they pay, earn per minute and earn per day.",
  "Treat the product as a game first, not just a token dashboard with a skin.",
  "Create enough structural clarity in docs that support requests are reduced before scale arrives.",
];

const faqItems = [
  {
    q: "What is TempoTopia?",
    a: "TempoTopia is a passive strategy game where pack ownership unlocks agents and offices that produce $TOPIA on a minute-based cadence.",
  },
  {
    q: "How do I enter the game?",
    a: "Connect a wallet, sign the session message, buy a pack and wait for finalization. Once the purchase is verified, the game unlocks for that wallet.",
  },
  {
    q: "How is payment made?",
    a: "Payments are ERC-20 transfers on Tempo Mainnet using PathUSD or USDC.e. Gas is separate from the pack price.",
  },
  {
    q: "How often can I withdraw?",
    a: "The current plan is to allow one withdrawal opportunity per day.",
  },
  {
    q: "Is $TOPIA live already?",
    a: "$TOPIA is not live yet. It is currently used as the internal gameplay unit for economy balancing and UI communication inside TempoTopia.",
  },
  {
    q: "What price is $TOPIA expected to launch at?",
    a: "The current docs position is that $TOPIA is expected to open at 1 USD, after which the price may move depending on market conditions.",
  },
  {
    q: "When will the CA be shared?",
    a: "The CA is planned to become active after the game has been live for some time. It is not being treated as active before the game rollout itself.",
  },
  {
    q: "Why does the game not use per-second income?",
    a: "Per-second output looks flashy but often bloats the UI and creates fake precision. TempoTopia uses full-minute accrual to keep the system cleaner.",
  },
  {
    q: "How is $TOPIA balanced right now?",
    a: "Current docs and game calculations treat $TOPIA as a 1:1 gameplay unit with USD for economy modeling.",
  },
  {
    q: "What happens if my transaction confirms but the app looks stuck?",
    a: "Do not send a second payment. The app retries finalize and can recover pending purchase state from the same wallet session.",
  },
];

const pendingCopyBlocks = [
  {
    title: "Team / studio paragraph",
    body: "",
    note: "Pending: founder story, studio name, public positioning.",
  },
  {
    title: "Roadmap dates",
    body: "",
    note: "Pending: quarter or month targets for each roadmap phase.",
  },
  {
    title: "Security / disclaimer copy",
    body: "",
    note: "Pending: smart contract risk, wallet safety notes, asset disclaimer language.",
  },
];

function formatRate(value: number) {
  return value.toFixed(6);
}

function formatTopia(value: number) {
  if (value >= 100) {
    return value.toFixed(2);
  }

  if (value >= 1) {
    return value.toFixed(3);
  }

  return value.toFixed(6);
}

export default function DocsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>TempoTopia Docs</span>
            <h1>A full wiki for players, buyers and future holders.</h1>
            <p>
              This page is the single source of truth for how TempoTopia works today:
              onboarding, wallet flow, payments, pack economics, earning logic, roadmap and
              open items that still need project-specific copy.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryLink} href="/">
                Open Game
              </Link>
              <a className={styles.secondaryLink} href="#onboarding">
                Start Reading
              </a>
            </div>
          </div>
          <div className={styles.heroPanel}>
            <span className={styles.panelLabel}>Snapshot</span>
            <div className={styles.heroStats}>
              <article>
                <strong>3</strong>
                <span>Pack tiers live</span>
              </article>
              <article>
                <strong>2</strong>
                <span>Payment tokens</span>
              </article>
              <article>
                <strong>1 min</strong>
                <span>Income cadence</span>
              </article>
              <article>
                <strong>$TOPIA</strong>
                <span>Primary output</span>
              </article>
            </div>
            <div className={styles.heroNote}>
              <strong>Reference style</strong>
              <p>
                This docs structure is intentionally more wiki-like and closer to game docs
                products than to a short landing page FAQ.
              </p>
            </div>
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <span className={styles.panelLabel}>Contents</span>
              <nav className={styles.sideNav} aria-label="Docs sections">
                {sectionLinks.map((link) => (
                  <a key={link.id} href={`#${link.id}`}>
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className={styles.article}>
            <section className={styles.section} id="welcome">
              <div className={styles.sectionHead}>
                <span>00</span>
                <h2>Welcome</h2>
              </div>
              <p className={styles.lead}>
                TempoTopia is a passive strategy game on Tempo Mainnet. You buy a pack,
                unlock an office, receive a starter agent and grow a minute-based production
                engine around <strong>$TOPIA</strong>.
              </p>
              <div className={styles.quickPanel}>
                <article className={styles.inlineCard}>
                  <strong>Who this is for</strong>
                  <p>New players, paying users, support teams and anyone trying to understand the economy before entering.</p>
                </article>
                <article className={styles.inlineCard}>
                  <strong>What this docs page covers</strong>
                  <p>How to log in, how payment works, what each pack gives, how earnings accrue and what the current product direction is.</p>
                </article>
              </div>
            </section>

            <section className={styles.section} id="links">
              <div className={styles.sectionHead}>
                <span>00A</span>
                <h2>Official Links</h2>
              </div>
              <div className={styles.cardGrid}>
                <article className={styles.infoCard}>
                  <strong>Website</strong>
                  <p>Main site and game entry.</p>
                  <div className={styles.heroLinks}>
                    <a href="https://tempotopia.xyz" rel="noreferrer" target="_blank">
                      tempotopia.xyz
                    </a>
                  </div>
                </article>
                <article className={styles.infoCard}>
                  <strong>X</strong>
                  <p>Primary public social channel for updates and announcements.</p>
                  <div className={styles.heroLinks}>
                    <a href="https://x.com/TempoTopia" rel="noreferrer" target="_blank">
                      x.com/TempoTopia
                    </a>
                  </div>
                </article>
              </div>
            </section>

            <section className={styles.section} id="overview">
              <div className={styles.sectionHead}>
                <span>01</span>
                <h2>Game Overview</h2>
              </div>
              <ul className={styles.flatList}>
                {overviewBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.callout}>
                <strong>Core balancing rule</strong>
                <p>
                  Current game calculations assume <strong>1 $TOPIA = 1 USD</strong>. Pack
                  output is tuned around a 3-day recovery window, then boosted upward by pack bonuses.
                </p>
              </div>
            </section>

            <section className={styles.section} id="onboarding">
              <div className={styles.sectionHead}>
                <span>02</span>
                <h2>Getting Started</h2>
              </div>
              <div className={styles.stepGrid}>
                {quickStartSteps.map((step, index) => (
                  <article className={styles.stepCard} key={step.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{step.title}</strong>
                    <p>{step.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="wallet">
              <div className={styles.sectionHead}>
                <span>03</span>
                <h2>Wallet & Session</h2>
              </div>
              <div className={styles.dualGrid}>
                <article className={styles.infoCard}>
                  <strong>How login works</strong>
                  <p>
                    TempoTopia uses a signed wallet message to create a secure session. This signature
                    authenticates the wallet but does not move funds.
                  </p>
                </article>
                <article className={styles.infoCard}>
                  <strong>Why this matters</strong>
                  <p>
                    Pack ownership, game progression and purchase finalization all rely on the same
                    authenticated wallet session being active.
                  </p>
                </article>
              </div>
              <ul className={styles.flatList}>
                {walletNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.callout}>
                <strong>Withdrawal rule</strong>
                <p>
                  The current product direction is to allow <strong>one withdrawal opportunity per day</strong>.
                  This keeps treasury flow paced and prevents the withdraw loop from becoming constant spam.
                </p>
              </div>
            </section>

            <section className={styles.section} id="packs">
              <div className={styles.sectionHead}>
                <span>04</span>
                <h2>Pack Tiers</h2>
              </div>
              <p className={styles.lead}>
                Packs are the entry layer into TempoTopia. Each pack unlocks your office tier,
                starter agent and the baseline output curve that defines early progression.
              </p>
              <div className={styles.packGrid}>
                {tempoPackages.map((pack) => {
                  const baseIncomePerMinute = getPackageBaseIncomePerMinute(pack);
                  const incomePerDay = getIncomePerDay(pack.incomePerMinute);
                  const baseIncomePerDay = getIncomePerDay(baseIncomePerMinute);

                  return (
                    <article className={styles.packCard} key={pack.id}>
                      <div className={styles.packHead}>
                        <span>{pack.rarityLabel}</span>
                        <h3>{pack.title}</h3>
                        <p>{pack.detail}</p>
                      </div>
                      <div className={styles.metricList}>
                        <div>
                          <span>Price</span>
                          <strong>{pack.pathUsdPrice} USD</strong>
                        </div>
                        <div>
                          <span>Slots</span>
                          <strong>{pack.agentLimit}</strong>
                        </div>
                        <div>
                          <span>Bonus</span>
                          <strong>{pack.bonusPercent > 0 ? `+${pack.bonusPercent}%` : "Base yield"}</strong>
                        </div>
                        <div>
                          <span>Starter agent</span>
                          <strong>{pack.starterAgentLabel}</strong>
                        </div>
                        <div>
                          <span>$TOPIA / min</span>
                          <strong className={styles.rateBlock}>
                            {pack.bonusPercent > 0 ? <em>{formatRate(baseIncomePerMinute)}</em> : null}
                            <b>{formatRate(pack.incomePerMinute)}</b>
                          </strong>
                        </div>
                        <div>
                          <span>$TOPIA / day</span>
                          <strong className={styles.rateBlock}>
                            {pack.bonusPercent > 0 ? <em>{formatTopia(baseIncomePerDay)}</em> : null}
                            <b>{formatTopia(incomePerDay)}</b>
                          </strong>
                        </div>
                      </div>
                      <div className={styles.inlineCard}>
                        <strong>What is included</strong>
                        <p>{pack.guaranteedItems.join(" • ")}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className={styles.section} id="payments">
              <div className={styles.sectionHead}>
                <span>05</span>
                <h2>Payment Flow</h2>
              </div>
              <div className={styles.dualGrid}>
                <article className={styles.infoCard}>
                  <strong>How payment works</strong>
                  <ol className={styles.numberList}>
                    {paymentFlow.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </article>
                <article className={styles.infoCard}>
                  <strong>Supported assets</strong>
                  <ul className={styles.flatList}>
                    <li>PathUSD</li>
                    <li>USDC.e</li>
                    <li>Tempo Mainnet only</li>
                    <li>Gas paid separately from purchase amount</li>
                  </ul>
                </article>
              </div>
              <div className={styles.cardGrid}>
                {paymentTroubleshooting.map((item) => (
                  <article className={styles.infoCard} key={item.title}>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="gameplay">
              <div className={styles.sectionHead}>
                <span>06</span>
                <h2>How To Play</h2>
              </div>
              <div className={styles.cardGrid}>
                {gameplayCards.map((card) => (
                  <article className={styles.infoCard} key={card.title}>
                    <strong>{card.title}</strong>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="hud">
              <div className={styles.sectionHead}>
                <span>07</span>
                <h2>HUD Reference</h2>
              </div>
              <div className={styles.cardGrid}>
                {hudCards.map((card) => (
                  <article className={styles.infoCard} key={card.title}>
                    <strong>{card.title}</strong>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="shop">
              <div className={styles.sectionHead}>
                <span>08</span>
                <h2>Shop & Expansion</h2>
              </div>
              <div className={styles.cardGrid}>
                {shopCards.map((card) => (
                  <article className={styles.infoCard} key={card.title}>
                    <strong>{card.title}</strong>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="economy">
              <div className={styles.sectionHead}>
                <span>09</span>
                <h2>Economy</h2>
              </div>
              <div className={styles.callout}>
                <strong>Current design stance</strong>
                <p>
                  TempoTopia exposes economy numbers in minute and daily views because that is the
                  clearest way to explain progression without stuffing the interface with noisy fake precision.
                </p>
              </div>
              <ul className={styles.flatList}>
                {economyRules.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className={styles.section} id="seasons">
              <div className={styles.sectionHead}>
                <span>10</span>
                <h2>Seasons</h2>
              </div>
              <div className={styles.cardGrid}>
                {seasonCards.map((card) => (
                  <article className={styles.infoCard} key={card.title}>
                    <strong>{card.title}</strong>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="token">
              <div className={styles.sectionHead}>
                <span>11</span>
                <h2>Token & CA</h2>
              </div>
              <div className={styles.callout}>
                <strong>Current status</strong>
                <p>
                  <strong>$TOPIA is not launched yet.</strong> The current game uses $TOPIA as a
                  balancing and communication layer inside the live product experience.
                </p>
              </div>
              <div className={styles.cardGrid}>
                {tokenCards.map((card) => (
                  <article className={styles.infoCard} key={card.title}>
                    <strong>{card.title}</strong>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="roadmap">
              <div className={styles.sectionHead}>
                <span>12</span>
                <h2>Roadmap</h2>
              </div>
              <div className={styles.timeline}>
                {roadmapItems.map((item) => (
                  <article className={styles.timelineItem} key={item.title}>
                    <span className={styles.phaseTag}>{item.phase}</span>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="goals">
              <div className={styles.sectionHead}>
                <span>13</span>
                <h2>Goals</h2>
              </div>
              <ul className={styles.flatList}>
                {goalItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className={styles.section} id="faq">
              <div className={styles.sectionHead}>
                <span>14</span>
                <h2>FAQ</h2>
              </div>
              <div className={styles.cardGrid}>
                {faqItems.map((item) => (
                  <article className={styles.infoCard} key={item.q}>
                    <strong>{item.q}</strong>
                    <p>{item.a}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="pending">
              <div className={styles.sectionHead}>
                <span>15</span>
                <h2>Pending Copy</h2>
              </div>
              <p className={styles.lead}>
                The blocks below are intentionally left without full project-specific prose where
                the repository does not provide enough verified context yet.
              </p>
              <div className={styles.cardGrid}>
                {pendingCopyBlocks.map((item) => (
                  <article className={`${styles.infoCard} ${styles.pendingCard}`} key={item.title}>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
