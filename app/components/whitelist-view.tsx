"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClipboardCheck, Globe2, Star, Users } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAccount } from "wagmi";
import {
  deriveWhitelistViewStep,
  hasPersistableWhitelistHandle,
  normalizeTwitterHandle,
  type WhitelistProgressRecord,
  type WhitelistViewStep,
} from "../lib/whitelist";
import styles from "./whitelist-view.module.css";

function buildReferralCode(handle: string) {
  const clean = handle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${clean}${suffix}`;
}

const WHITELIST_X_ACCOUNT = process.env.NEXT_PUBLIC_WHITELIST_X_ACCOUNT as string;
const WHITELIST_TWEET_ID = process.env.NEXT_PUBLIC_WHITELIST_TWEET_ID as string;
const WHITELIST_SHARE_TEXT = `Joining Lego Miners Early Access on @${WHITELIST_X_ACCOUNT}. Built on Base for early supporters.`;
const WHITELIST_SHARE_URL = "https://legominers.xyz";

const whitelistTasks = [
  {
    id: "share",
    label: "Share",
    description: "Share on your profile",
    xp: 120,
  },
  {
    id: "retweet",
    label: "Retweet",
    description: "Retweet the announcement",
    xp: 90,
    href: `https://twitter.com/intent/retweet?tweet_id=${WHITELIST_TWEET_ID}`,
  },
  {
    id: "like",
    label: "Like",
    description: "Like the announcement",
    xp: 60,
    href: `https://twitter.com/intent/like?tweet_id=${WHITELIST_TWEET_ID}`,
  },
  {
    id: "comment",
    label: "Comment",
    description: "Leave a comment",
    xp: 100,
    href: `https://twitter.com/intent/tweet?in_reply_to=${WHITELIST_TWEET_ID}`,
  },
  {
    id: "notifications",
    label: "Follow",
    description: `Follow @${WHITELIST_X_ACCOUNT}`,
    xp: 150,
    href: `https://twitter.com/intent/follow?screen_name=${WHITELIST_X_ACCOUNT}`,
  },
];

const walletChoices = [
  { id: "metamask", label: "MetaMask" },
  { id: "rabby", label: "Rabby" },
  { id: "okx", label: "OKX" },
  { id: "bitget", label: "Bitget" },
  { id: "more", label: "More" },
];

type StatIconKind = "users" | "star" | "tasks" | "globe";

type WhitelistStats = {
  totalEntries: number;
  totalTasksCompleted: number;
};

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.checkIcon} aria-hidden="true">
      <path
        d="M4 12l5.3 5.3 11-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.noteIcon} aria-hidden="true">
      <path
        d="M7 10V7.5a5 5 0 0 1 10 0V10M6 10h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.bulletIcon} aria-hidden="true">
      <path
        d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.bulletIcon} aria-hidden="true">
      <path
        d="M4 9h16v11H4zM12 9v11M4 13h16M7.5 9a2.5 2.5 0 1 1 0-5c1.8 0 3.4 2 4.5 5-1.1 0-2.7 0-4.5 0ZM16.5 9a2.5 2.5 0 1 0 0-5c-1.8 0-3.4 2-4.5 5 1.1 0 2.7 0 4.5 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.arrowIcon} aria-hidden="true">
      <path
        d="M7 12h10M12 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.inlineIcon} aria-hidden="true">
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H2.695l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        fill="currentColor"
      />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.arrowIcon} aria-hidden="true">
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

function WalletLogo({ id }: { id: string }) {
  if (id === "metamask") {
    return (
      <img
        alt="MetaMask"
        className={styles.walletLogoImg}
        src="/wallet-metamask.svg"
      />
    );
  }

  if (id === "rabby") {
    return (
      <img
        alt="Rabby"
        className={styles.walletLogoImg}
        src="/wallet-rabby.svg"
      />
    );
  }

  if (id === "okx") {
    return (
      <img
        alt="OKX"
        className={styles.walletLogoImg}
        src="/wallet-okx.svg"
      />
    );
  }

  if (id === "bitget") {
    return (
      <img
        alt="Bitget"
        className={styles.walletLogoImg}
        src="/wallet-bitget.svg"
      />
    );
  }

  return (
    <img
      alt="Wallet"
      className={styles.walletLogoImg}
      src="/wallet-more.svg"
    />
  );
}

function StatIcon({ kind }: { kind: StatIconKind }) {
  if (kind === "users") return <Users size={18} strokeWidth={2} />;
  if (kind === "star") return <Star size={18} strokeWidth={2} />;
  if (kind === "tasks") return <ClipboardCheck size={18} strokeWidth={2} />;
  return <Globe2 size={18} strokeWidth={2} />;
}

function TaskIcon({ id }: { id: string }) {
  if (id === "share") {
    return (
      <svg viewBox="0 0 24 24" className={styles.taskIcon} aria-hidden="true">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "retweet") {
    return (
      <svg viewBox="0 0 24 24" className={styles.taskIcon} aria-hidden="true">
        <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "like") {
    return (
      <svg viewBox="0 0 24 24" className={styles.taskIcon} aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "comment") {
    return (
      <svg viewBox="0 0 24 24" className={styles.taskIcon} aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={styles.taskIcon} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhitelistFooter() {
  return (
    <footer className={styles.footerBand}>
      <div className={styles.footerColumn}>
        <div>
          <p className={styles.footerHeading}>BUILT FOR</p>
          <strong>Degens</strong>
        </div>
      </div>

      <div className={styles.footerColumn}>
        <div className={styles.footerSocials}>
          <a className={styles.footerSocialButton} href="https://x.com/legominersxyz" target="_blank" rel="noopener noreferrer" aria-label="X">
            <XIcon />
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
  );
}

function SuccessPanel({ referralCode }: { referralCode: string }) {
  return (
    <section className={styles.whitelistView}>
      <div className={styles.backgroundLayer} aria-hidden="true">
        <img alt="" className={styles.backgroundImage} src="/whitelist_bg.png" />
        <div className={styles.backgroundOverlay} />
      </div>

      <div className={styles.successPanel}>
        <div className={styles.successIcon}>
          <CheckIcon />
        </div>
        <span className={styles.eyebrow}>EARLY ACCESS</span>
        <h2 className={styles.successTitle}>You&apos;re on the whitelist.</h2>
        <p className={styles.successMessage}>
          Your entry is locked in. Keep an eye on X for reveal dates, launch updates, and the Free Miner & Airdrop claim flow.
        </p>
        {referralCode ? (
          <div className={styles.referralCodeCard}>
            <span>Your invite code</span>
            <strong>{referralCode}</strong>
            <p>Friends can enter this code after finishing their tasks. You earn XP when they submit.</p>
          </div>
        ) : null}
      </div>

      <WhitelistFooter />
    </section>
  );
}

export function WhitelistView() {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<WhitelistViewStep>(1);
  const [walletAddress, setWalletAddress] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [ownReferralCode, setOwnReferralCode] = useState("");
  const [stats, setStats] = useState<WhitelistStats>({ totalEntries: 0, totalTasksCompleted: 0 });
  const turnstileRef = useRef<any>(null);

  const normalizedTwitter = normalizeTwitterHandle(twitterHandle);
  const hasValidWallet = /^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim());
  const allTasksDone = completedTasks.length === whitelistTasks.length;
  const canContinueProfile = normalizedTwitter.length > 1 && hasValidWallet;
  const canGoSubmit = normalizedTwitter.length > 1 && hasValidWallet && allTasksDone && !!turnstileToken;

  useEffect(() => {
    try {
      const cached = localStorage.getItem("tempo_whitelist_state");
      if (!cached) return;

      const parsed = JSON.parse(cached) as {
        twitterHandle?: string;
        walletAddress?: string;
        completedTasks?: string[];
        whitelistStep?: number | string;
        isWhitelistSubmitted?: boolean;
        referralCode?: string;
        referralCodeInput?: string;
      };

      if (parsed.twitterHandle) setTwitterHandle(parsed.twitterHandle);
      if (parsed.walletAddress && !address) setWalletAddress(parsed.walletAddress);
      if (parsed.completedTasks) setCompletedTasks(parsed.completedTasks);
      if (parsed.referralCode) setOwnReferralCode(parsed.referralCode);
      if (parsed.referralCodeInput) setReferralCodeInput(parsed.referralCodeInput);

      setStep(deriveWhitelistViewStep(parsed, whitelistTasks.length));
    } catch {}
  }, [address]);

  useEffect(() => {
    setWalletAddress(address ?? "");
  }, [address]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/whitelist");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      // Stats fetch failed silently
    }
  }

  useEffect(() => {
    void fetchStats();
  }, [step, address]);

  useEffect(() => {
    if (isConnected && address && step === 1) {
      // Check MongoDB for existing record by wallet
      void fetch("/api/whitelist?walletAddress=" + encodeURIComponent(address))
        .then(res => res.ok ? res.json() : null)
        .then(payload => {
          if (payload?.found && payload.data) {
            // Restore existing progress
            const saved = payload.data;
            if (saved.twitterHandle) setTwitterHandle(saved.twitterHandle);
            if (saved.completedTasks) setCompletedTasks(saved.completedTasks || []);
            if (saved.referralCode) setOwnReferralCode(saved.referralCode);
            const restoredStep = deriveWhitelistViewStep(saved, whitelistTasks.length);
            setStep(restoredStep === 1 ? 2 : restoredStep);
          } else {
            // New user, go to step 2
            setStep(2);
            void saveProgress({ whitelistStep: "wallet", walletAddress: address });
          }
        })
        .catch(() => {
          setStep(2);
          void saveProgress({ whitelistStep: "wallet", walletAddress: address });
        });
    }
  }, [address, isConnected, step]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "tempo_whitelist_state",
        JSON.stringify({
          twitterHandle: normalizedTwitter,
          walletAddress,
          completedTasks,
          whitelistStep: step,
          isWhitelistSubmitted: step === "success",
          referralCode: ownReferralCode,
          referralCodeInput,
        }),
      );
    } catch {}
  }, [completedTasks, normalizedTwitter, ownReferralCode, referralCodeInput, step, walletAddress]);

  function handleTaskClick(taskId: string, href: string) {
    const nextTasks = completedTasks.includes(taskId) ? completedTasks : [...completedTasks, taskId];
    setCompletedTasks(nextTasks);
    void saveProgress({
      completedTasks: nextTasks,
      whitelistStep: "tasks",
    });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function saveProgress(overrides: Partial<{
    twitterHandle: string;
    walletAddress: string;
    completedTasks: string[];
    whitelistStep: string;
    isWhitelistSubmitted: boolean;
    turnstileToken: string | null;
    referralCode?: string;
  }> = {}) {
    const nextTwitterHandle = normalizeTwitterHandle(overrides.twitterHandle ?? normalizedTwitter);
    const whitelistStep = overrides.whitelistStep ?? (step === 3 || step === 4 ? "tasks" : "wallet");

    // Allow saving even without twitter handle (for tasks before twitter is entered)
    try {
      await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitterHandle: nextTwitterHandle || undefined,
          walletAddress: overrides.walletAddress ?? walletAddress,
          completedTasks: overrides.completedTasks ?? completedTasks,
          whitelistStep: whitelistStep,
          isWhitelistSubmitted: overrides.isWhitelistSubmitted ?? false,
          turnstileToken: overrides.turnstileToken,
          referralCode: overrides.referralCode,
        }),
      });
    } catch {
      // Local state still preserves progress; final submit reports errors.
    }
  }

  async function handleProfileContinue() {
    console.log("[handleProfileContinue] canContinueProfile:", canContinueProfile, "normalizedTwitter:", normalizedTwitter, "hasValidWallet:", hasValidWallet, "walletAddress:", walletAddress);
    if (!canContinueProfile) return;

    const nextTwitterHandle = normalizeTwitterHandle(twitterHandle);

    try {
      const response = await fetch(`/api/whitelist?twitterHandle=${encodeURIComponent(nextTwitterHandle)}`);

      if (response.ok) {
        const payload = await response.json();

        if (payload.found && payload.data) {
          const savedProgress = payload.data as WhitelistProgressRecord;
          const nextTasks = Array.isArray(savedProgress.completedTasks) ? savedProgress.completedTasks : [];
          const nextWalletAddress =
            typeof savedProgress.walletAddress === "string" && savedProgress.walletAddress
              ? savedProgress.walletAddress
              : walletAddress;
          const nextStep = deriveWhitelistViewStep(savedProgress, whitelistTasks.length);

          setTwitterHandle(nextTwitterHandle);
          setWalletAddress(nextWalletAddress);
          setCompletedTasks(nextTasks);
          setOwnReferralCode(typeof savedProgress.referralCode === "string" ? savedProgress.referralCode : "");
          setStep(nextStep === 1 ? 2 : nextStep);
          return;
        }
      }
    } catch {
      // If restore fails, continue with the local flow below.
    }

    // Generate referral code client-side now that we have a real twitter handle
    const newCode = buildReferralCode(nextTwitterHandle);
    setOwnReferralCode(newCode);

    setStep(3);
    void saveProgress({ twitterHandle: nextTwitterHandle, whitelistStep: "tasks", referralCode: newCode });
  }

  async function handleSubmit() {
    if (!canGoSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitterHandle: normalizedTwitter,
          walletAddress,
          completedTasks,
          whitelistStep: "tasks",
          isWhitelistSubmitted: true,
          turnstileToken,
          referralCodeInput,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error || "Submission failed");
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      const payload = await res.json();
      const nextReferralCode = payload?.data?.referralCode;

      if (typeof nextReferralCode === "string") {
        setOwnReferralCode(nextReferralCode);
      }

      setStep("success");
    } catch {
      setSubmitError("Network error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderPanelBody() {
    if (step === 1) {
      return (
        <div className={styles.walletStepBody}>
          <ConnectButton.Custom>
            {({ account, chain, mounted, openConnectModal, openChainModal }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              if (!connected) {
                return (
                  <button className={styles.primaryButton} onClick={openConnectModal} type="button">
                    <WalletIcon />
                    <span>Connect Wallet</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button className={styles.primaryButton} onClick={openChainModal} type="button">
                    <WalletIcon />
                    <span>Switch Network</span>
                  </button>
                );
              }

              return (
                <button className={styles.primaryButton} onClick={() => { setStep(2); void saveProgress({ whitelistStep: "wallet", walletAddress: account.address }); }} type="button">
                  <WalletIcon />
                  <span>Continue with {account.displayName}</span>
                </button>
              );
            }}
          </ConnectButton.Custom>
          <p className={styles.walletNote}>Supports EVM-compatible wallets</p>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className={styles.formStack}>
          <label className={styles.field}>
            <span>X handle</span>
            <div className={styles.handleInputWrap}>
              <span className={styles.handlePrefix}>@</span>
              <input
                className={styles.handleInput}
                onChange={(event) => setTwitterHandle(event.target.value)}
                placeholder="yourhandle"
                type="text"
                value={twitterHandle.replace(/^@/, "")}
              />
            </div>
          </label>

          <div className={styles.buttonRow}>
            <button className={styles.secondaryButton} onClick={() => setStep(1)} type="button">
              Back
            </button>
            <button
              className={styles.primaryButton}
              disabled={!canContinueProfile}
              onClick={handleProfileContinue}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className={styles.formStack}>
          <div className={styles.taskList}>
            {whitelistTasks.map((task) => {
              const completed = completedTasks.includes(task.id);
              const shareText = ownReferralCode
                ? `Joining Lego Miners Early Access on @${WHITELIST_X_ACCOUNT}. Built on Base for early supporters.\n\nUse my code: ${ownReferralCode}`
                : WHITELIST_SHARE_TEXT;
              const taskHref = task.id === "share"
                ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(WHITELIST_SHARE_URL)}`
                : task.href;
              return (
                <button
                  key={task.id}
                  className={`${styles.taskItem} ${completed ? styles.taskItemDone : ""}`.trim()}
                  onClick={() => handleTaskClick(task.id, taskHref!)}
                  type="button"
                >
                  <span className={styles.taskItemIcon}>
                    {completed ? <CheckIcon /> : <TaskIcon id={task.id} />}
                  </span>
                  <span className={styles.taskItemCopy}>
                    <strong>{task.label}</strong>
                    <small>+{task.xp} XP</small>
                  </span>
                  <span className={styles.taskItemBadge}>{completed ? "Done" : "Open"}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.progressBlock}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(completedTasks.length / whitelistTasks.length) * 100}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {completedTasks.length} / {whitelistTasks.length} completed
            </span>
          </div>

          <div className={styles.buttonRow}>
            <button className={styles.secondaryButton} onClick={() => setStep(2)} type="button">
              Back
            </button>
            <button
              className={styles.primaryButton}
              disabled={!allTasksDone}
              onClick={() => setStep(4)}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`${styles.formStack} ${styles.submitStack}`.trim()}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span>Wallet</span>
            <strong>{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "-"}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>X</span>
            <strong>@{normalizedTwitter || "-"}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Tasks</span>
            <strong>{completedTasks.length} / {whitelistTasks.length}</strong>
          </div>
        </div>

        <label className={`${styles.field} ${styles.referralInputField}`.trim()}>
          <span>Invite code</span>
          <input
            className={styles.input}
            onChange={(event) => setReferralCodeInput(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
            placeholder="Optional code"
            type="text"
            value={referralCodeInput}
          />
        </label>

        <div className={styles.turnstileWrap}>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ theme: "dark", size: "normal" }}
          />
        </div>

        {submitError ? <p className={styles.submitError}>{submitError}</p> : null}

        <div className={styles.buttonRow}>
          <button className={styles.secondaryButton} onClick={() => setStep(3)} type="button">
            Back
          </button>
          <button
            className={styles.primaryButton}
            disabled={!canGoSubmit || isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? "Submitting..." : "Join Whitelist"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return <SuccessPanel referralCode={ownReferralCode} />;
  }

  const panelHeading =
    step === 1
      ? "Connect your wallet"
    : step === 2
        ? "Drop your X handle"
        : step === 3
          ? "Complete the tasks"
          : "Submit your entry";

  const panelDescription =
    step === 1
      ? "Link an EVM wallet on Base Mainnet to get started."
      : step === 2
        ? `Wallet connected${isConnected && walletAddress ? `: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""}. Add your X handle to continue.`
        : step === 3
          ? "Finish every X task below to qualify for the launch reward."
          : "Verify your session and lock in your Free Miner & Airdrop chance.";

  return (
    <section className={styles.whitelistView} id="whitelist">
      <div className={styles.backgroundLayer} aria-hidden="true">
        <img alt="" className={styles.backgroundImage} src="/whitelist_bg.png" />
        <div className={styles.backgroundOverlay} />
      </div>

      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>EARLY ACCESS</span>
          <h1 className={styles.title}>
            <span>Join the</span>
            <span className={styles.titleAccent}>Whitelist</span>
          </h1>
          <p className={styles.description}>
            Connect your wallet, drop your X handle, complete the tasks and earn a chance to receive a{" "}
            <span className={styles.descriptionAccent}>Free Miner & Airdrop</span> at launch.
          </p>
        </div>

        <div className={styles.walletPanel}>
          <div className={`${styles.walletPanelFrame} ${step === 3 ? styles.walletPanelFrameTasks : ""} ${step === 4 ? styles.walletPanelFrameSubmit : ""}`.trim()}>
            <div className={styles.walletPanelHead}>
              <div className={styles.walletPanelCopy}>
                <h2 className={styles.walletPanelTitle}>
                  {step === 1 ? (
                    <>
                      <span className={styles.connectAccent}>Connect</span> your wallet
                    </>
                  ) : (
                    panelHeading
                  )}
                </h2>
                <p className={styles.walletPanelDescription}>{panelDescription}</p>
              </div>

              {step === 1 ? (
                <div className={styles.walletArtWrap}>
                  <img alt="Connect wallet artwork" className={styles.walletArt} src="/wallet.png" />
                </div>
              ) : (
                <div className={styles.stepIndicator}>
                  <span>{step}</span>
                  <small>STEP</small>
                </div>
              )}
            </div>

            <div className={styles.walletPanelBody}>{renderPanelBody()}</div>

            <div className={styles.securityNote}>
              <LockIcon />
              <span>We never store your private keys.</span>
            </div>
          </div>
        </div>

        <div className={styles.rewardShowcase}>
          <div className={styles.rewardVisual}>
            <img alt="Free Miner and airdrop reward" className={styles.rewardImage} src="/freeminer.png" />
          </div>

          <div className={styles.rewardContent}>
            <span className={styles.rewardKicker}>LAUNCH REWARD</span>
            <h2 className={styles.rewardTitle}>Free Miner & Airdrop</h2>
            <ul className={styles.rewardList}>
              <li>
                <SparkIcon />
                <span>Early mining boost</span>
              </li>
              <li>
                <LockIcon />
                <span>Exclusive access</span>
              </li>
              <li>
                <GiftIcon />
                <span>Tradable on launch</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <div className={`${styles.statOrb} ${styles.statOrbTask}`.trim()}>
            <StatIcon kind="tasks" />
          </div>
          <span className={styles.statTitle}>TASKS COMPLETED</span>
          <strong className={`${styles.statValue} ${styles.statValueGreen}`.trim()}>
            {stats.totalTasksCompleted.toLocaleString()}
          </strong>
          <p className={styles.statMeta}>Completed by entrants</p>
        </article>

        <article className={`${styles.statCard} ${styles.spotlightCard}`.trim()}>
          <div className={styles.spotlightCopy}>
            <strong>Higher XP.</strong>
            <p>Stay active. Stay early.</p>
          </div>
          <div className={styles.spotlightVisual}>
            <div className={styles.spotlightCrystal} />
            <span className={styles.spotlightArrow}>
              <ArrowIcon />
            </span>
          </div>
        </article>
      </div>

      <WhitelistFooter />
    </section>
  );
}
