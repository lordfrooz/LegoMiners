"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import connectPhoto from "../../connect_photo.png";
import mobilePhoto from "../../mobile_photo.jpeg";
import backgroundPhoto from "../../background.png";
import {
  getPaymentToken,
  getIncomePerDay,
  getPackageBaseIncomePerMinute,
  getTempoPackage,
  paymentTokens,
  tempoPackages,
  type AgentType,
  type OfficeTier,
  type PaymentToken,
} from "../lib/tempo-game-data";
import { buildTempoAgentSpriteAssets } from "../lib/tempo-agent-sprite";
import { useTempoGameState } from "../lib/tempo-game-state";
import { TempoStageWorker } from "./tempo-stage-worker";

const EARLY_ACCESS_IS_OPEN = process.env.NEXT_PUBLIC_EARLY_ACCESS_OPEN !== "false";
const LIVE_ACCESS_LOCK = process.env.NEXT_PUBLIC_APP_ENV === "live" && !EARLY_ACCESS_IS_OPEN;
const WHITELIST_X_ACCOUNT = process.env.NEXT_PUBLIC_WHITELIST_X_ACCOUNT as string;
const WHITELIST_TWEET_ID = process.env.NEXT_PUBLIC_WHITELIST_TWEET_ID as string;
const WHITELIST_SHARE_TEXT = `Joining Lego Miners Early Access on @${WHITELIST_X_ACCOUNT}. Built on Base for early supporters.`;
const WHITELIST_SHARE_URL = "https://legominers.xyz";

const whitelistTasks = [
  {
    id: "share",
    label: "Share",
    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      WHITELIST_SHARE_TEXT,
    )}&url=${encodeURIComponent(WHITELIST_SHARE_URL)}`,
  },
  {
    id: "retweet",
    label: "Retweet",
    href: `https://twitter.com/intent/retweet?tweet_id=${WHITELIST_TWEET_ID}`,
  },
  {
    id: "like",
    label: "Like",
    href: `https://twitter.com/intent/like?tweet_id=${WHITELIST_TWEET_ID}`,
  },
  {
    id: "comment",
    label: "Comment",
    href: `https://twitter.com/intent/tweet?in_reply_to=${WHITELIST_TWEET_ID}`,
  },
  {
    id: "notifications",
    label: "Follow",
    href: `https://twitter.com/intent/follow?screen_name=${WHITELIST_X_ACCOUNT}`,
  },
];

type ConnectWalletStyle = CSSProperties & {
  "--browser-zoom-scale": number;
};

type ConnectWalletStageStyle = CSSProperties & {
  "--connect-wallet-mobile-bg": string;
};

const packImageById = {
  builder: "/dassak.png",
  trader: "/special.png",
  finance: "/legendary.png",
} as const;

const PATHUSD_ICON_URL =
  "https://esm.sh/gh/tempoxyz/tempo-apps/apps/tokenlist/data/4217/icons/0x20c0000000000000000000000000000000000000.svg";
const GAME_PRESENCE_STORAGE_PREFIX = "tempo_game_presence:";
const WITHDRAWALS_ENABLED = false;

const gameNavItems = [
  { id: "shop", symbol: "S", label: "Shop" },
  { id: "leaderboard", symbol: "#", label: "Leaderboard" },
  { id: "withdraw", symbol: "$", label: "Withdraw" },
] as const;

type GameNavTab = (typeof gameNavItems)[number]["id"] | null;

type StagePoint = {
  x: number;
  y: number;
  scale: number;
};

type MoveBounds = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

type GameTableStyle = CSSProperties & {
  "--home-image": string;
  "--table-image": string;
  "--table-left": string;
  "--table-top": string;
  "--table-width": string;
};

type AwaySummary = {
  agentCount: number;
  durationLabel: string;
  minutes: number;
  topia: string;
  lastCollectedAt: number;
};

type GamePresenceState = {
  awayStartedAt: number | null;
  lastSeenAt: number;
};

type LiveAccessResult = {
  message: string;
  title: string;
  tone: "closed" | "error" | "secured";
};

type LeaderboardEntry = {
  rank: number;
  walletAddress: string;
  label: string;
  incomePerMinute: number;
  isPlaceholder?: boolean;
};

const LEADERBOARD_SLOT_COUNT = 10;

function formatTopiaAmount(value: number) {
  const absValue = Math.abs(value);

  if (absValue >= 100) {
    return value.toFixed(2);
  }

  if (absValue >= 1) {
    return value.toFixed(3);
  }

  if (absValue >= 0.01) {
    return value.toFixed(4);
  }

  return value.toFixed(6);
}

function formatIncomePerMinute(value: number) {
  return value.toFixed(6);
}

function buildLeaderboardDisplayEntries(entries: LeaderboardEntry[]) {
  return Array.from({ length: LEADERBOARD_SLOT_COUNT }, (_, index) => {
    const entry = entries[index];

    if (entry) {
      return entry;
    }

    const rank = index + 1;

    return {
      rank,
      walletAddress: `placeholder-${rank}`,
      label: "Awaiting miner",
      incomePerMinute: 0,
      isPlaceholder: true,
    };
  });
}

const officeStageByTier: Record<
  OfficeTier,
  {
    spawn: StagePoint;
    homeImage: string;
    moveBounds: MoveBounds;
    tableImage: string;
    table: { left: number; top: number; width: number };
    workPoints: StagePoint[];
  }
> = {
  standard: {
    spawn: { x: 12, y: 78, scale: 0.9 },
    homeImage: 'url("/shome.png")',
    moveBounds: { minX: 38, maxX: 72, minY: 61, maxY: 87 },
    tableImage: 'url("/game/houses/standard/table.png"), url("/game/table.png")',
    table: { left: 57, top: 61, width: 42 },
    workPoints: [
      { x: 45, y: 68, scale: 0.82 },
      { x: 54, y: 66, scale: 0.86 },
      { x: 63, y: 68, scale: 0.82 },
      { x: 49, y: 76, scale: 0.9 },
      { x: 58, y: 76, scale: 0.92 },
      { x: 67, y: 76, scale: 0.9 },
      { x: 43, y: 84, scale: 0.96 },
      { x: 56, y: 85, scale: 1 },
      { x: 69, y: 84, scale: 0.96 },
    ],
  },
  luxury: {
    spawn: { x: 10, y: 78, scale: 0.9 },
    homeImage: 'url("/special_house.png")',
    moveBounds: { minX: 35, maxX: 79, minY: 60, maxY: 87 },
    tableImage: 'url("/game/houses/luxury/table.png"), url("/game/table.png")',
    table: { left: 58, top: 60, width: 46 },
    workPoints: [
      { x: 40, y: 67, scale: 0.8 },
      { x: 49, y: 65, scale: 0.84 },
      { x: 58, y: 65, scale: 0.86 },
      { x: 67, y: 67, scale: 0.84 },
      { x: 44, y: 75, scale: 0.9 },
      { x: 54, y: 75, scale: 0.94 },
      { x: 64, y: 75, scale: 0.94 },
      { x: 74, y: 75, scale: 0.9 },
      { x: 48, y: 84, scale: 1 },
      { x: 61, y: 85, scale: 1.02 },
      { x: 74, y: 84, scale: 1 },
    ],
  },
  ultra: {
    spawn: { x: 9, y: 78, scale: 0.9 },
    homeImage: 'url("/legendary_house.png")',
    moveBounds: { minX: 31, maxX: 86, minY: 59, maxY: 87 },
    tableImage: 'url("/game/houses/ultra/table.png"), url("/game/table.png")',
    table: { left: 58, top: 60, width: 50 },
    workPoints: [
      { x: 35, y: 67, scale: 0.78 },
      { x: 44, y: 64, scale: 0.82 },
      { x: 53, y: 63, scale: 0.84 },
      { x: 62, y: 64, scale: 0.84 },
      { x: 71, y: 67, scale: 0.82 },
      { x: 39, y: 75, scale: 0.9 },
      { x: 49, y: 74, scale: 0.94 },
      { x: 59, y: 74, scale: 0.96 },
      { x: 69, y: 74, scale: 0.94 },
      { x: 79, y: 75, scale: 0.9 },
      { x: 43, y: 84, scale: 1 },
      { x: 56, y: 85, scale: 1.04 },
      { x: 69, y: 85, scale: 1.04 },
      { x: 82, y: 84, scale: 1 },
    ],
  },
};

const clampToRange = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getScaleForPosition = (workPoints: StagePoint[], y: number) => {
  if (workPoints.length === 0) {
    return 1;
  }

  const minY = Math.min(...workPoints.map((point) => point.y));
  const maxY = Math.max(...workPoints.map((point) => point.y));
  const minScale = Math.min(...workPoints.map((point) => point.scale));
  const maxScale = Math.max(...workPoints.map((point) => point.scale));
  if (maxY <= minY) {
    return maxScale;
  }

  const progress = clampToRange((y - minY) / (maxY - minY), 0, 1);
  return Number((minScale + (maxScale - minScale) * progress).toFixed(2));
};

const agentWorkMessagesByType: Record<AgentType, string[]> = {
  builder: [
    "Completed a build task and added $TOPIA to the vault.",
    "Gathered Topia resources and generated $TOPIA.",
    "Cleared an operations queue and lifted passive income.",
    "Maintained a Topia station and earned $TOPIA.",
    "Opened a new route and improved production base.",
    "Closed a field report and added $TOPIA to the balance.",
    "Optimized equipment and produced extra $TOPIA.",
    "Stabilized the energy line and protected the income flow.",
    "Finished a mini contract and earned $TOPIA.",
    "Prepared a new resource batch at the work table.",
    "Found an efficiency bonus in the Topia depot.",
    "Solved a support ticket and claimed a $TOPIA reward.",
    "Strengthened the Base chain from the work desk.",
    "Prepared the operations floor for new agents.",
    "Turned a maintenance run into $TOPIA.",
    "Kept contributing to the Topia ecosystem.",
    "Closed the table plan and grew passive flow.",
  ],
  trader: [
    "Traded on X signals and earned $TOPIA.",
    "Caught a market signal and produced $TOPIA income.",
    "Closed a short-term opportunity and credited the vault.",
    "Captured spread on the Topia market and earned $TOPIA.",
    "Read a fresh price move and claimed a trade bonus.",
    "Tracked liquidity flow and kept income moving.",
    "Closed a clean buy-sell cycle and earned $TOPIA.",
    "Watched social signals and opened a sharp trade.",
    "Balanced the position at the risk desk.",
    "Caught market news early and collected $TOPIA.",
    "Found a new opportunity in the chart scan.",
    "Used a volume spike to support passive income.",
    "Watched X trends and closed a trade report.",
    "Queued orders on the Base market.",
    "Caught an arbitrage window and earned $TOPIA.",
    "Followed the market rhythm and brought income back.",
    "Closed a clean session at the trade desk.",
  ],
  finance: [
    "Updated the treasury plan and grew the $TOPIA flow.",
    "Optimized the yield route and earned $TOPIA.",
    "Balanced the portfolio and produced passive income.",
    "Adjusted risk limits and secured the vault.",
    "Collected $TOPIA from a high-efficiency strategy.",
    "Managed the Topia fund flow and booked income.",
    "Used a new treasury model to earn extra $TOPIA.",
    "Rebalanced income distribution and brought a bonus.",
    "Closed an efficiency report at the finance desk.",
    "Pulled new $TOPIA from the liquidity plan.",
    "Balanced production against yield.",
    "Tracked incoming flow and caught a bonus.",
    "Completed a move that grew the Topia reserve.",
    "Opened a new income line in the strategy sheet.",
    "Cleaned up the treasury route with an optimization.",
    "Completed the plan feeding the passive income engine.",
  ],
};

const agentWorkMessages = Object.values(agentWorkMessagesByType).flat();

export function TempoGameApp() {
  const {
    address,
    authenticateWallet,
    authError,
    collectIncome,
    isConnected,
    isAuthenticated,
    isAuthenticating,
    isPurchasing,
    lastMarketPurchase,
    lastPurchaseTxHash,
    logout,
    marketPurchaseSuccessNonce,
    pendingPurchaseTxHash,
    purchaseSuccessNonce,
    purchaseError,
    isReady,
    nextAgentSlots,
    player,
    purchasePackage,
    purchaseMarketItem,
    resetProgress,
    retryFinalizePurchase,
    selectedPackage,
    totalIncomePerMinute,
    getTrustedNow,
    unclaimedIncome,
    pathUsdBalance,
    usdcBalance,
    moveAgentPosition,
  } = useTempoGameState();
  const [twitterHandle, setTwitterHandle] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isWhitelistSubmitted, setIsWhitelistSubmitted] = useState(false);
  const [whitelistStep, setWhitelistStep] = useState<"twitter" | "wallet" | "tasks">("twitter");
  const [isRestoring, setIsRestoring] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [liveAccessResult, setLiveAccessResult] = useState<LiveAccessResult | null>(null);
  const [isCheckingLiveAccess, setIsCheckingLiveAccess] = useState(false);
  const [browserZoomScale, setBrowserZoomScale] = useState(1);
  const [activePackId, setActivePackId] = useState<"builder" | "trader" | "finance">("finance");
  const [packPaymentToken, setPackPaymentToken] = useState<PaymentToken>("pathusd");
  const [marketPaymentToken, setMarketPaymentToken] = useState<PaymentToken>("pathusd");
  const [hasPackInteracted, setHasPackInteracted] = useState(false);
  const [toastState, setToastState] = useState<{ title: string; message: string; tone: "error" | "success" } | null>(
    null,
  );
  const [showPurchaseConfirmedModal, setShowPurchaseConfirmedModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeGameTab, setActiveGameTab] = useState<GameNavTab>(null);
  const [movingAgentId, setMovingAgentId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [tempoSpriteSheetUrl, setTempoSpriteSheetUrl] = useState<string | null>(null);
  const [agentNotifications, setAgentNotifications] = useState<
    Record<string, { message: string; nonce: number }>
  >({});
  const [awaySummary, setAwaySummary] = useState<AwaySummary | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const turnstileRef = useRef<any>(null);
  const lastAwaySummaryRef = useRef<string | null>(null);
  const lastAgentMessageRef = useRef<Record<string, string>>({});
  const awaySummaryTimerRef = useRef<number | null>(null);
  const leaderboardDisplayEntries = buildLeaderboardDisplayEntries(leaderboardEntries);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const nextAssets = buildTempoAgentSpriteAssets();
    if (!nextAssets) {
      return;
    }

    setTempoSpriteSheetUrl(nextAssets.spriteSheetUrl);
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("tempo_whitelist_state");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.twitterHandle) setTwitterHandle(parsed.twitterHandle);
        if (parsed.walletAddress) setWalletInput(parsed.walletAddress);
        if (parsed.completedTasks) setCompletedTasks(parsed.completedTasks);
        if (parsed.whitelistStep) setWhitelistStep(parsed.whitelistStep);
        if (parsed.isWhitelistSubmitted) setIsWhitelistSubmitted(parsed.isWhitelistSubmitted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    const message = purchaseError ?? authError;

    if (!message) {
      return;
    }

    setToastState({
      title: "Action Failed",
      message,
      tone: "error",
    });
    const timeoutId = window.setTimeout(() => {
      setToastState((current) => (current?.tone === "error" && current.message === message ? null : current));
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authError, purchaseError]);

  useEffect(() => {
    if (!marketPurchaseSuccessNonce || !lastMarketPurchase) {
      return;
    }

    const message =
      lastMarketPurchase.itemType === "slot"
        ? "Extra slot unlocked. You can now deploy one more active agent."
        : `${getTempoPackage(lastMarketPurchase.itemId).starterAgentLabel} added to your inventory.`;

    setToastState({
      title: "Transaction Confirmed",
      message,
      tone: "success",
    });

    const timeoutId = window.setTimeout(() => {
      setToastState((current) => (current?.tone === "success" ? null : current));
    }, 3800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [lastMarketPurchase, marketPurchaseSuccessNonce]);

  useEffect(() => {
    if (!purchaseSuccessNonce) {
      return;
    }

    setShowPurchaseConfirmedModal(true);
    const timeoutId = window.setTimeout(() => {
      setShowPurchaseConfirmedModal(false);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [purchaseSuccessNonce]);

  useEffect(() => {
    const baseDevicePixelRatio = window.devicePixelRatio || 1;
    let frame = 0;

    function updateBrowserZoomScale() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const currentDevicePixelRatio = window.devicePixelRatio || baseDevicePixelRatio;
        setBrowserZoomScale(baseDevicePixelRatio / currentDevicePixelRatio);
      });
    }

    updateBrowserZoomScale();
    window.addEventListener("resize", updateBrowserZoomScale);
    window.visualViewport?.addEventListener("resize", updateBrowserZoomScale);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateBrowserZoomScale);
      window.visualViewport?.removeEventListener("resize", updateBrowserZoomScale);
    };
  }, []);

  async function saveStateAndSync(newState: any, syncDb = true) {
    const currentState = {
      twitterHandle: newState.twitterHandle ?? twitterHandle,
      walletAddress: newState.walletAddress ?? walletInput,
      completedTasks: newState.completedTasks ?? completedTasks,
      whitelistStep: newState.whitelistStep ?? whitelistStep,
      isWhitelistSubmitted: newState.isWhitelistSubmitted ?? isWhitelistSubmitted,
    };
    localStorage.setItem("tempo_whitelist_state", JSON.stringify(currentState));

    if (syncDb && currentState.twitterHandle && currentState.twitterHandle.trim().length > 1) {
      try {
        const normalized = currentState.twitterHandle.trim().replace(/^@+/, "");
        await fetch("/api/whitelist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...currentState, twitterHandle: normalized }),
        });
      } catch (err) {
        console.error("Failed to sync DB", err);
      }
    }
  }
  const normalizedTwitterHandle = twitterHandle.trim().replace(/^@+/, "");
  const normalizedWalletInput = walletInput.trim();
  const twitterAvatarUrl = normalizedTwitterHandle
    ? `https://unavatar.io/x/${encodeURIComponent(normalizedTwitterHandle)}`
    : "";
  const hasValidWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(normalizedWalletInput);
  const allTasksCompleted = completedTasks.length === whitelistTasks.length;
  const canSubmitWhitelist =
    normalizedTwitterHandle.length > 1 && hasValidWalletAddress && allTasksCompleted && !!turnstileToken;
  const canAdvanceTwitter = normalizedTwitterHandle.length > 1;
  const canAdvanceWallet = hasValidWalletAddress;
  const hasWhitelistAccess = true;
  const connectWalletStyle: ConnectWalletStyle = {
    "--browser-zoom-scale": browserZoomScale,
  };
  const connectWalletStageStyle: ConnectWalletStageStyle = {
    "--connect-wallet-mobile-bg": `url("${mobilePhoto.src}")`,
  };
  const activePack = tempoPackages.find((item) => item.id === activePackId) ?? tempoPackages[0];
  const selectedPackPaymentToken = getPaymentToken(packPaymentToken);
  const selectedMarketPaymentToken = getPaymentToken(marketPaymentToken);
  const activePackVisualTone =
    activePack.id === "builder" ? "starter" : activePack.id === "trader" ? "trader" : "finance";
  const activePanelTone =
    activePack.id === "trader" ? "shop-active-panel-trader" : activePack.id === "finance" ? "shop-active-panel-finance" : "";
  const activeKickerTone =
    activePack.id === "trader" ? "shop-package-kicker-trader" : activePack.id === "finance" ? "shop-package-kicker-finance" : "";
  const activeTitleTone =
    activePack.id === "trader" ? "shop-package-title-trader" : activePack.id === "finance" ? "shop-package-title-finance" : "";
  const activeBuyTone =
    activePack.id === "trader" ? "shop-liquid-buy-button-trader" : activePack.id === "finance" ? "shop-liquid-buy-button-finance" : "";
  const showLiveAccessGate = isReady && !isRestoring && LIVE_ACCESS_LOCK;
  const showConnectWalletScreen =
    isReady && !isRestoring && !showLiveAccessGate && hasWhitelistAccess && !isConnected;
  const showPacksScreen =
    isReady &&
    !isRestoring &&
    !showLiveAccessGate &&
    hasWhitelistAccess &&
    isConnected &&
    isAuthenticated &&
    (!selectedPackage || showPurchaseConfirmedModal);
  const showGameScreen =
    isReady &&
    !isRestoring &&
    !showLiveAccessGate &&
    hasWhitelistAccess &&
    isConnected &&
    isAuthenticated &&
    !!selectedPackage &&
    !showPurchaseConfirmedModal;
  const activeAgents = player?.agents ?? [];
  const activeAgentSignature = activeAgents.map((agent) => agent.id).join("|");
  const activeOfficeTier = selectedPackage?.officeTier ?? "standard";
  const activeOfficeScene = officeStageByTier[activeOfficeTier];
  useEffect(() => {
    if (selectedAgentId && !activeAgents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(null);
    }

    if (movingAgentId && !activeAgents.some((agent) => agent.id === movingAgentId)) {
      setMovingAgentId(null);
    }
  }, [activeAgents, movingAgentId, selectedAgentId]);
  const savedAgentPositionById = new Map(
    (player?.agentPositions ?? []).map((position) => [position.agentId, position]),
  );
  const tableStyle: GameTableStyle = {
    "--home-image": activeOfficeScene.homeImage,
    "--table-image": activeOfficeScene.tableImage,
    "--table-left": `${activeOfficeScene.table.left}%`,
    "--table-top": `${activeOfficeScene.table.top}%`,
    "--table-width": `${activeOfficeScene.table.width}%`,
  };
  const stagedAgents = activeAgents.map((agent, index) => {
    const workPoint = activeOfficeScene.workPoints[index % activeOfficeScene.workPoints.length];
    const rowOffset = Math.floor(index / activeOfficeScene.workPoints.length) * 2.4;
    const fallbackWorkY = workPoint.y + rowOffset;
    const savedPosition = savedAgentPositionById.get(agent.id);
    const workX = savedPosition?.x ?? workPoint.x;
    const workY = savedPosition?.y ?? fallbackWorkY;
    const workScale = savedPosition
      ? getScaleForPosition(activeOfficeScene.workPoints, workY)
      : workPoint.scale;

    return {
      agent,
      isMoving: movingAgentId === agent.id,
      isSelected: selectedAgentId === agent.id,
      notification: agentNotifications[agent.id],
      work: {
        x: workX,
        y: workY,
        scale: workScale,
      },
    };
  });
  const displayName = normalizedTwitterHandle || "Topia";
  const displayedPathUsdBalance = pathUsdBalance;
  const displayedUsdcBalance = usdcBalance;
  const displayedTopiaEarned = formatTopiaAmount((player?.lifetimeCollected ?? 0) + unclaimedIncome);
  const displayedUnclaimedIncome = formatTopiaAmount(unclaimedIncome);
  const displayedIncomePerMinute = formatIncomePerMinute(totalIncomePerMinute);
  const displayedIncomePerDay = formatTopiaAmount(getIncomePerDay(totalIncomePerMinute));
  const activePackBaseIncomePerMinute = getPackageBaseIncomePerMinute(activePack);
  const activePackIncomePerDay = getIncomePerDay(activePack.incomePerMinute);
  const activePackBaseIncomePerDay = getIncomePerDay(activePackBaseIncomePerMinute);
  const nftOffers = tempoPackages.map((pack) => ({
    id: pack.id,
    title: pack.id === "builder" ? "Starter Agent" : pack.starterAgentLabel,
    subtitle: `${pack.rarityLabel} NFT`,
    originalPrice: Number(pack.pathUsdPrice),
    discountedPrice: Number((Number(pack.pathUsdPrice) * 0.8).toFixed(2)),
    detail: pack.detail,
  }));
  const extraSlotOffer = {
    title: "Single Extra Slot",
    originalPrice: Number((Number(selectedPackage?.pathUsdPrice ?? "0.50") * 0.55).toFixed(2)),
    discountedPrice: Number((Number(selectedPackage?.pathUsdPrice ?? "0.50") * 0.44).toFixed(2)),
    detail: "Each purchase adds one active agent slot. Slots are bought one at a time.",
  };

  function getAgentWorkMessage(agentId: string) {
    const messages = agentWorkMessages;
    const previousMessage = lastAgentMessageRef.current[agentId];
    let nextMessage = messages[Math.floor(Math.random() * messages.length)];

    if (messages.length > 1 && nextMessage === previousMessage) {
      nextMessage = messages[(messages.indexOf(nextMessage) + 1) % messages.length];
    }

    lastAgentMessageRef.current[agentId] = nextMessage;
    return nextMessage;
  }

  async function handleWorkspacePlacement(event: MouseEvent<HTMLDivElement>) {
    if (!movingAgentId || !workspaceRef.current) {
      return;
    }

    const rect = workspaceRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const rawX = ((event.clientX - rect.left) / rect.width) * 100;
    const rawY = ((event.clientY - rect.top) / rect.height) * 100;
    const moveBounds = activeOfficeScene.moveBounds;
    const isMobilePlacement = window.matchMedia("(max-width: 760px)").matches;
    const mobileMaxY = isMobilePlacement
      ? Math.min(100, moveBounds.minY + (moveBounds.maxY - moveBounds.minY) * 1.25)
      : moveBounds.maxY;
    const nextX = Number(
      clampToRange(rawX, moveBounds.minX, moveBounds.maxX).toFixed(2),
    );
    const nextY = Number(
      clampToRange(rawY, moveBounds.minY, mobileMaxY).toFixed(2),
    );

    try {
      await moveAgentPosition({ agentId: movingAgentId, x: nextX, y: nextY });
      setSelectedAgentId(movingAgentId);
      setMovingAgentId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to move agent.";
      setToastState({
        title: "Action Failed",
        message,
        tone: "error",
      });
    }
  }

  function getPresenceStorageKey() {
    return address ? `${GAME_PRESENCE_STORAGE_PREFIX}${address.toLowerCase()}` : null;
  }

  function readPresenceState() {
    const storageKey = getPresenceStorageKey();

    if (!storageKey) {
      return null;
    }

    try {
      const cached = localStorage.getItem(storageKey);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as Partial<GamePresenceState>;
      if (typeof parsed.lastSeenAt !== "number" || !Number.isFinite(parsed.lastSeenAt)) {
        return null;
      }

      return {
        awayStartedAt:
          typeof parsed.awayStartedAt === "number" && Number.isFinite(parsed.awayStartedAt)
            ? parsed.awayStartedAt
            : null,
        lastSeenAt: parsed.lastSeenAt,
      };
    } catch {
      return null;
    }
  }

  function writePresenceState(nextState: GamePresenceState) {
    const storageKey = getPresenceStorageKey();

    if (!storageKey) {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(nextState));
    } catch {
      // Presence is helpful for AFK summaries, but gameplay should not depend on storage availability.
    }
  }

  function markPresent() {
    writePresenceState({
      awayStartedAt: null,
      lastSeenAt: getTrustedNow(),
    });
  }

  function markAway() {
    const now = getTrustedNow();
    writePresenceState({
      awayStartedAt: now,
      lastSeenAt: now,
    });
  }

  function openAwaySummarySnapshot(awaySince: number | null) {
    if (!showGameScreen || !player) {
      setAwaySummary(null);
      return;
    }

    if (typeof awaySince !== "number" || !Number.isFinite(awaySince)) {
      return;
    }

    const effectiveAwaySince = Math.max(awaySince, player.lastCollectedAt);
    const elapsedMs = Math.max(0, getTrustedNow() - effectiveAwaySince);
    const snapshotMinutes = Math.floor(elapsedMs / 60000);
    const snapshotIncomePerMinute = player.agents.reduce((sum, agent) => sum + agent.incomePerMinute, 0);
    const snapshotIncome = snapshotMinutes * snapshotIncomePerMinute;
    const summaryKey = `${player.lastCollectedAt}:${Math.floor(effectiveAwaySince)}:${Math.floor(elapsedMs / 5000)}`;

    if (lastAwaySummaryRef.current === summaryKey) {
      return;
    }

    if (elapsedMs < 1000 || snapshotIncome <= 0) {
      setAwaySummary(null);
      return;
    }

    lastAwaySummaryRef.current = summaryKey;
    setAwaySummary({
      agentCount: player.agents.length,
      durationLabel: snapshotMinutes < 1 ? "<1 min" : `${snapshotMinutes} min`,
      minutes: snapshotMinutes,
      topia: formatTopiaAmount(snapshotIncome),
      lastCollectedAt: player.lastCollectedAt,
    });

    if (awaySummaryTimerRef.current) {
      window.clearTimeout(awaySummaryTimerRef.current);
    }

    awaySummaryTimerRef.current = window.setTimeout(() => {
      setAwaySummary((current) =>
        current?.lastCollectedAt === player.lastCollectedAt ? null : current,
      );
      awaySummaryTimerRef.current = null;
    }, 6200);
  }

  useEffect(() => {
    if (!showGameScreen || activeAgents.length === 0) {
      setAgentNotifications({});
      return;
    }

    let clearBubbleTimer = 0;

    function publishAgentNotifications() {
      setAgentNotifications(() => {
        const nextNotifications: Record<string, { message: string; nonce: number }> = {};

        activeAgents.forEach((agent) => {
          nextNotifications[agent.id] = {
            message: getAgentWorkMessage(agent.id),
            nonce: Date.now() + agent.createdAt,
          };
        });

        return nextNotifications;
      });

      window.clearTimeout(clearBubbleTimer);
      clearBubbleTimer = window.setTimeout(() => {
        setAgentNotifications({});
      }, 4600);
    }

    const notificationTimer = window.setInterval(publishAgentNotifications, 10000);

    return () => {
      window.clearTimeout(clearBubbleTimer);
      window.clearInterval(notificationTimer);
    };
  }, [activeAgentSignature, showGameScreen]);

  useEffect(() => {
    if (!showGameScreen || !player) {
      setAwaySummary(null);
      return;
    }

    const cachedPresence = readPresenceState();
    openAwaySummarySnapshot(cachedPresence?.awayStartedAt ?? cachedPresence?.lastSeenAt ?? null);
    markPresent();
  }, [address, player?.lastCollectedAt, showGameScreen]);

  useEffect(() => {
    if (!showGameScreen || !player) {
      return;
    }

    function handleReturnToGame() {
      if (document.visibilityState === "hidden") {
        markAway();
        return;
      }

      if (document.visibilityState === "visible") {
        const cachedPresence = readPresenceState();
        openAwaySummarySnapshot(cachedPresence?.awayStartedAt ?? cachedPresence?.lastSeenAt ?? null);
        markPresent();
      }
    }

    function handleLeaveGame() {
      markAway();
    }

    document.addEventListener("visibilitychange", handleReturnToGame);
    window.addEventListener("blur", handleLeaveGame);
    window.addEventListener("focus", handleReturnToGame);
    window.addEventListener("pageshow", handleReturnToGame);
    window.addEventListener("pagehide", handleLeaveGame);
    window.addEventListener("beforeunload", handleLeaveGame);

    const heartbeatTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        markPresent();
      }
    }, 2000);

    return () => {
      document.removeEventListener("visibilitychange", handleReturnToGame);
      window.removeEventListener("blur", handleLeaveGame);
      window.removeEventListener("focus", handleReturnToGame);
      window.removeEventListener("pageshow", handleReturnToGame);
      window.removeEventListener("pagehide", handleLeaveGame);
      window.removeEventListener("beforeunload", handleLeaveGame);
      window.clearInterval(heartbeatTimer);
    };
  }, [getTrustedNow, player?.lastCollectedAt, showGameScreen]);

  useEffect(() => {
    if (!showGameScreen || !player) {
      return;
    }

    return () => {
      markAway();
    };
  }, [address, showGameScreen, !!player]);

  useEffect(() => {
    return () => {
      if (awaySummaryTimerRef.current) {
        window.clearTimeout(awaySummaryTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showGameScreen) {
      return;
    }

    let ignore = false;

    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/game/leaderboard", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || ignore) {
          return;
        }

        setLeaderboardEntries(Array.isArray(data.entries) ? data.entries : []);
      } catch {
        if (!ignore) {
          setLeaderboardEntries([]);
        }
      }
    }

    void loadLeaderboard();
    const timer = window.setInterval(() => {
      void loadLeaderboard();
    }, 20000);

    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, [showGameScreen]);

  function toggleGameTab(nextTab: Exclude<GameNavTab, null>) {
    setActiveGameTab((current) => (current === nextTab ? null : nextTab));
  }

  function handleWhitelistTaskClick(taskId: string, href: string) {
    setCompletedTasks((current) => {
      const newTasks = current.includes(taskId) ? current : [...current, taskId];
      setTimeout(() => saveStateAndSync({ completedTasks: newTasks }), 0);
      return newTasks;
    });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function handleLiveAccessSubmit() {
    if (!canAdvanceTwitter || isCheckingLiveAccess) {
      return;
    }

    const normalized = twitterHandle.trim().replace(/^@+/, "").toLowerCase();

    setIsCheckingLiveAccess(true);
    setLiveAccessResult(null);
    void saveStateAndSync({ twitterHandle: normalized }, false);

    try {
      const response = await fetch(`/api/whitelist?twitterHandle=${encodeURIComponent(normalized)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const result = await response.json();

        if (result.found) {
          setLiveAccessResult({
            title: "Whitelist Secured",
            message: "This username is reserved for live access. Wallet connection opens in a later phase.",
            tone: "secured",
          });
          return;
        }
      }

      if (response.status === 404) {
        setLiveAccessResult({
          title: "Registrations Closed",
          message: "This username is not on the active whitelist. Registrations are closed for now.",
          tone: "closed",
        });
        return;
      }

      throw new Error("Whitelist lookup failed.");
    } catch {
      setLiveAccessResult({
        title: "Check Failed",
        message: "Whitelist status could not be verified right now. Try again shortly.",
        tone: "error",
      });
    } finally {
      setIsCheckingLiveAccess(false);
    }
  }

  async function handleTwitterContinue() {
    if (!canAdvanceTwitter) return;

    try {
      const normalized = twitterHandle.trim().replace(/^@+/, "");
      const res = await fetch(`/api/whitelist?twitterHandle=${encodeURIComponent(normalized)}`);
      if (res.ok) {
        const result = await res.json();
        if (result.found && result.data) {
          const d = result.data;
          setWalletInput(d.walletAddress || "");
          setCompletedTasks(d.completedTasks || []);
          setWhitelistStep(d.whitelistStep || "wallet");
          setIsWhitelistSubmitted(d.isWhitelistSubmitted || false);

          saveStateAndSync({
            twitterHandle: normalized,
            walletAddress: d.walletAddress,
            completedTasks: d.completedTasks,
            whitelistStep: d.whitelistStep,
            isWhitelistSubmitted: d.isWhitelistSubmitted
          }, false);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to fetch handle", e);
    }

    setWhitelistStep("wallet");
    saveStateAndSync({ twitterHandle, whitelistStep: "wallet" });
  }

  function handleWalletContinue() {
    setWhitelistStep("tasks");
    saveStateAndSync({ walletAddress: walletInput, whitelistStep: "tasks" });
  }

  async function handleWhitelistSubmit() {
    if (!canSubmitWhitelist || !turnstileToken) {
      return;
    }

    const normalized = twitterHandle.trim().replace(/^@+/, "");
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitterHandle: normalized,
          walletAddress: walletInput,
          completedTasks,
          whitelistStep,
          isWhitelistSubmitted: true,
          turnstileToken,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Submit failed:", err);
        // Token was consumed, refresh it.
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }
    } catch (e) {
      console.error(e);
      return;
    }

    setIsWhitelistSubmitted(true);
    localStorage.setItem("tempo_whitelist_state", JSON.stringify({
      twitterHandle: normalized,
      walletAddress: walletInput,
      completedTasks,
      whitelistStep,
      isWhitelistSubmitted: true,
    }));
  }

  return (
    <main
      className={`tempo-shell ${showConnectWalletScreen || showLiveAccessGate ? "tempo-shell-connect-wallet" : ""} ${
        showPacksScreen ? "tempo-shell-packs" : ""
      }`.trim()}
    >
      <div
        aria-hidden="true"
        className={`tempo-scene-background ${showGameScreen ? "tempo-scene-background-game" : "tempo-scene-background-soft"}`}
      >
        <Image
          alt=""
          className="tempo-scene-background-image tempo-scene-background-image-desktop"
          fill
          priority
          src={showPacksScreen || showGameScreen ? backgroundPhoto : connectPhoto}
        />
        <Image
          alt=""
          className="tempo-scene-background-image tempo-scene-background-image-mobile"
          fill
          priority
          src={showPacksScreen || showGameScreen ? backgroundPhoto : mobilePhoto}
        />
      </div>

      <section className={`tempo-frame ${showGameScreen ? "tempo-frame-game" : ""}`.trim()}>
        {!isReady || isRestoring ? (
          <section className="panel panel-centered flow-panel">
            <p className="meta-label">Loading state</p>
            <strong>Preparing command architecture...</strong>
          </section>
        ) : null}

        {false ? (
          <section className="wallet-gate whitelist-gate-stage">
            <div className={`wallet-gate-minimal whitelist-gate whitelist-gate-${whitelistStep}`}>
              <div className="wallet-gate-intro whitelist-gate-intro">
                <h2>
                  Join the <span className="brand-accent">Lego Miners</span>
                </h2>
                <p>
                  Complete the X tasks, drop your handle and EVM wallet address, then unlock
                  the Early Access gate.
                </p>

                <div className={`whitelist-task-stack ${whitelistStep === "tasks" ? "" : "whitelist-task-stack-hidden"}`}>
                  <span className="whitelist-task-label">Tasks</span>
                  <div className="whitelist-profile-pill">
                    {twitterAvatarUrl ? (
                      <img
                        alt={normalizedTwitterHandle}
                        className="whitelist-profile-avatar"
                        referrerPolicy="no-referrer"
                        src={twitterAvatarUrl}
                      />
                    ) : null}
                    <div className="whitelist-profile-copy">
                      <span>X/Twitter Username</span>
                      <strong>@{normalizedTwitterHandle}</strong>
                    </div>
                  </div>
                  <div className="whitelist-task-grid">
                    {whitelistTasks.map((task) => (
                      <button
                        className={`whitelist-task-button ${completedTasks.includes(task.id) ? "whitelist-task-button-complete" : ""
                          }`}
                        key={task.id}
                        onClick={() => handleWhitelistTaskClick(task.id, task.href)}
                        type="button"
                      >
                        {task.label}
                      </button>
                    ))}
                  </div>
                  {whitelistStep === "tasks" ? (
                    <div className="whitelist-task-submit-stack">
                      <div className="turnstile-wrapper whitelist-task-turnstile">
                        <Turnstile
                          ref={turnstileRef}
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                          onSuccess={(token) => setTurnstileToken(token)}
                          onExpire={() => setTurnstileToken(null)}
                          onError={() => setTurnstileToken(null)}
                          options={{ theme: "light", size: "normal" }}
                        />
                      </div>
                      <button
                        className="whitelist-task-button whitelist-task-button-submit"
                        disabled={!canSubmitWhitelist}
                        onClick={handleWhitelistSubmit}
                        type="button"
                      >
                        Join Early Access
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="whitelist-panel whitelist-panel-inline">
                  {whitelistStep === "twitter" ? (
                    <label className="whitelist-field">
                      <span>X/Twitter Username</span>
                      <input
                        onChange={(event) => setTwitterHandle(event.target.value)}
                        placeholder="@yourhandle"
                        type="text"
                        value={twitterHandle}
                      />
                    </label>
                  ) : null}

                  {whitelistStep === "wallet" ? (
                    <label className="whitelist-field">
                      <span>EVM wallet address</span>
                      <input
                        onChange={(event) => setWalletInput(event.target.value)}
                        placeholder="0x..."
                        type="text"
                        value={walletInput}
                      />
                    </label>
                  ) : null}

                  {whitelistStep !== "tasks" ? (
                    <button
                      className="wallet-button whitelist-submit-button"
                      disabled={whitelistStep === "twitter" ? !canAdvanceTwitter : !canAdvanceWallet}
                      onClick={whitelistStep === "twitter" ? handleTwitterContinue : handleWalletContinue}
                      type="button"
                    >
                      Continue
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {showLiveAccessGate ? (
          <section className="connect-wallet-stage live-access-stage" style={connectWalletStageStyle}>
            <div className="connect-wallet-shell live-access-shell">
              <div className="connect-wallet-copy whitelist-gate-intro live-access-copy">
                <div className="connect-wallet-zoom-lock" style={connectWalletStyle}>
                  <span className="meta-label">Live Access</span>
                  <h2>Check your whitelist status.</h2>
                  <p>
                    Enter your registered username to confirm your slot.
                  </p>

                  <div className="whitelist-panel live-access-panel">
                    <span className="live-access-panel-kicker">Whitelist Check</span>
                    <form
                      className="live-access-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleLiveAccessSubmit();
                      }}
                    >
                      <label className="whitelist-field" htmlFor="live-access-username">
                        <span>Username</span>
                        <input
                          id="live-access-username"
                          onChange={(event) => {
                            setTwitterHandle(event.target.value);
                            if (liveAccessResult) {
                              setLiveAccessResult(null);
                            }
                          }}
                          placeholder="@yourusername"
                          type="text"
                          value={twitterHandle}
                        />
                      </label>

                      <button
                        className="wallet-button live-access-submit"
                        disabled={!canAdvanceTwitter || isCheckingLiveAccess}
                        type="submit"
                      >
                        {isCheckingLiveAccess ? "Checking Whitelist..." : "Check Username"}
                      </button>
                    </form>

                    <div
                      className={`live-access-status ${
                        liveAccessResult ? `live-access-status-${liveAccessResult.tone}` : "live-access-status-idle"
                      }`}
                    >
                      <strong>{liveAccessResult?.title ?? "Waiting For Username"}</strong>
                      <p>
                        {liveAccessResult?.message ??
                          "Enter the username you used during registration. If your slot exists, you will see whitelist confirmation here."}
                      </p>
                    </div>
                  </div>

                  <div className="live-access-links">
                    <Link className="ghost-button live-access-docs-link" href="/docs">
                      Open Docs
                    </Link>
                    <a className="ghost-button live-access-docs-link" href="https://x.com/LegoMiners" rel="noreferrer" target="_blank">
                      X / Updates
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {showConnectWalletScreen ? (
          <section className="connect-wallet-stage" style={connectWalletStageStyle}>
            <div className="connect-wallet-shell">
              <div className="connect-wallet-copy">
                <div className="connect-wallet-zoom-lock" style={connectWalletStyle}>
                  <h2>Link your wallet to start the game</h2>
                  <p>
                    Connect an EVM wallet on Base Mainnet. Your game progress stays tied to
                    the wallet you use here.
                  </p>

                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      mounted,
                      openAccountModal,
                      openChainModal,
                      openConnectModal,
                    }) => {
                      const connected = mounted && account && chain;

                      return (
                        <div
                          aria-hidden={!mounted}
                          className="connect-wallet-action"
                          style={{
                            opacity: mounted ? 1 : 0,
                            pointerEvents: mounted ? "auto" : "none",
                          }}
                        >
                          {!connected ? (
                            <div className="connect-wallet-action-row">
                              <button
                                className="wallet-button connect-wallet-button"
                                onClick={openConnectModal}
                                type="button"
                              >
                                Connect Wallet
                              </button>
                              <Link className="ghost-button connect-wallet-docs-link" href="/docs">
                                Docs
                              </Link>
                            </div>
                          ) : chain.unsupported ? (
                            <button
                              className="wallet-button connect-wallet-button connect-wallet-button-alert"
                              onClick={openChainModal}
                              type="button"
                            >
                              Switch Network
                            </button>
                          ) : (
                            <button
                              className="wallet-button connect-wallet-button connect-wallet-button-linked"
                              onClick={openAccountModal}
                              type="button"
                            >
                              Wallet linked: {account.displayName}
                            </button>
                          )}
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {isReady && !isRestoring && !showLiveAccessGate && hasWhitelistAccess && isConnected && !isAuthenticated ? (
          <section className="connect-wallet-stage" style={connectWalletStageStyle}>
            <div className="connect-wallet-shell">
              <div className="connect-wallet-copy">
                <div className="connect-wallet-zoom-lock" style={connectWalletStyle}>
                  <h2>Confirm your wallet access</h2>
                  <p>
                    Wallet connected. Signature request should open automatically so the server can
                    bind your session securely.
                  </p>
                  <div className="connect-wallet-action">
                    <button
                      className="wallet-button connect-wallet-button connect-wallet-button-linked"
                      disabled={isAuthenticating}
                      onClick={authenticateWallet}
                      type="button"
                    >
                      {isAuthenticating ? "Awaiting Signature..." : "Retry Signature"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {showPacksScreen ? (
          <section className="wallet-gate shop-stage">
            <div className="shop-shell">
              <div className="shop-shell-head">
                <p className="meta-label">Wallet Authenticated</p>
                <h2 className="shop-title">Choose Your Pack</h2>
                <p className="shop-subtitle">Choose PathUSD or USDC, confirm on Base, then unlock the game.</p>
              </div>

              <div className="shop-package-grid">
                {tempoPackages.map((pack) => (
                  <button
                    className={`shop-package-visual ${
                      pack.id === "builder" ? "shop-package-visual-starter" : `shop-package-visual-${pack.id}`
                    } ${hasPackInteracted && activePackId === pack.id ? "shop-package-visual-selected" : ""}`}
                    key={pack.id}
                    onClick={() => {
                      setActivePackId(pack.id);
                      setHasPackInteracted(true);
                    }}
                    type="button"
                  >
                    <div className="shop-package-sparkles" aria-hidden="true">
                      <span className="shop-package-spark shop-package-spark-1" />
                      <span className="shop-package-spark shop-package-spark-2" />
                      <span className="shop-package-spark shop-package-spark-3" />
                      <span className="shop-package-spark shop-package-spark-4" />
                      <span className="shop-package-spark shop-package-spark-5" />
                    </div>
                    <img
                      alt={pack.title}
                      className="shop-package-visual-image"
                      src={packImageById[pack.id]}
                    />
                  </button>
                ))}
              </div>

              <div className={`shop-active-panel ${activePanelTone}`.trim()}>
                <div className="shop-active-panel-copy">
                  <div className="shop-package-info-head">
                    <span className={`shop-package-kicker ${activeKickerTone}`.trim()}>{activePack.badge}</span>
                    <span className="meta-label">{activePack.rarityLabel}</span>
                  </div>
                  <h3 className={`shop-package-title ${activeTitleTone}`.trim()}>{activePack.title}</h3>
                  <p>{activePack.detail}</p>
                </div>

                <div className="shop-active-panel-stats">
                  <div>
                    <span>Price</span>
                    <strong>{activePack.pathUsdPrice} USD</strong>
                  </div>
                  <div>
                    <span>Slots</span>
                    <strong>{activePack.agentLimit}</strong>
                  </div>
                  <div>
                    <span>$TOPIA / min</span>
                    <strong className="shop-bonus-stat">
                      {activePack.bonusPercent > 0 ? (
                        <span className="shop-bonus-base">{formatIncomePerMinute(activePackBaseIncomePerMinute)}</span>
                      ) : null}
                      <span>{formatIncomePerMinute(activePack.incomePerMinute)}</span>
                      {activePack.bonusPercent > 0 ? (
                        <em className="shop-bonus-pill">+{activePack.bonusPercent}% bonus</em>
                      ) : null}
                    </strong>
                  </div>
                  <div>
                    <span>$TOPIA / day</span>
                    <strong className="shop-bonus-stat">
                      {activePack.bonusPercent > 0 ? (
                        <span className="shop-bonus-base">{formatTopiaAmount(activePackBaseIncomePerDay)}</span>
                      ) : null}
                      <span>{formatTopiaAmount(activePackIncomePerDay)}</span>
                    </strong>
                  </div>
                  <div>
                    <span>Includes</span>
                    <strong>{activePack.guaranteedItems.join(" • ")}</strong>
                  </div>
                </div>

                <div className="shop-active-panel-actions">
                  <div className="shop-payment-selector" aria-label="Pack payment token">
                    <span>Pay with</span>
                    <div className="shop-payment-options">
                      {paymentTokens.map((paymentTokenOption) => (
                        <button
                          aria-pressed={packPaymentToken === paymentTokenOption.id}
                          className={`shop-payment-option ${
                            packPaymentToken === paymentTokenOption.id ? "shop-payment-option-active" : ""
                          }`.trim()}
                          disabled={isPurchasing}
                          key={paymentTokenOption.id}
                          onClick={() => setPackPaymentToken(paymentTokenOption.id)}
                          type="button"
                        >
                          {paymentTokenOption.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    className={`action-button shop-liquid-buy-button ${activeBuyTone}`.trim()}
                    disabled={isPurchasing}
                    onClick={() => purchasePackage(activePack.id, packPaymentToken)}
                    type="button"
                  >
                    {isPurchasing
                      ? "Processing..."
                      : `Buy Pack • ${activePack.pathUsdPrice} USD`}
                  </button>
                  <p className="meta-label">
                    You will pay {activePack.pathUsdPrice} {selectedPackPaymentToken.symbol} + network gas.
                  </p>
                  {pendingPurchaseTxHash ? (
                    <>
                      <p className="shop-purchase-error">Pending finalize tx: {pendingPurchaseTxHash.slice(0, 10)}...</p>
                      <button className="ghost-button game-action-secondary" onClick={retryFinalizePurchase} type="button">
                        Retry Finalize
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {showGameScreen ? (
          <section className="game-layout">
            <div className="game-main-grid game-main-grid-expanded">
              <div className={`panel game-stage-shell game-stage-${selectedPackage?.id}`}>
                <div className="game-stage">
                  <div className="game-stage-noise" />
                  <div className="game-stage-grid" />
                  <div className="game-stage-aura game-stage-aura-left" />
                  <div className="game-stage-aura game-stage-aura-right" />
                  <div className="game-hud-profile">
                    <div className="game-hud-profile-logo-box" aria-hidden="true">
                      <img alt="" className="game-hud-profile-logo" src="/legominers.jpg" />
                    </div>
                    <div className="game-hud-profile-copy">
                      <strong>{displayName}</strong>
                      <div className="game-hud-mini-stat">
                        <img alt="" className="game-hud-coin-icon game-hud-path-icon" src={PATHUSD_ICON_URL} />
                        <div>
                          <small>pathUSD Balance</small>
                          <em>{displayedPathUsdBalance}</em>
                        </div>
                      </div>
                      <div className="game-hud-mini-stat">
                        <span className="game-hud-coin game-hud-coin-usdc">U</span>
                        <div>
                          <small>USDC Balance</small>
                          <em>{displayedUsdcBalance}</em>
                        </div>
                      </div>
                      <div className="game-hud-mini-stat">
                        <span className="game-hud-coin game-hud-coin-topia">T</span>
                        <div>
                          <small>$TOPIA Earned</small>
                          <em>{displayedTopiaEarned}</em>
                        </div>
                      </div>
                    </div>
                  </div>
                  <nav className="game-hud-nav" aria-label="Game sections">
                    {gameNavItems.map((item) => (
                      <button
                        key={item.id}
                        className={`game-hud-nav-item ${activeGameTab === item.id ? "game-hud-nav-item-active" : ""}`}
                        onClick={() => toggleGameTab(item.id)}
                        type="button"
                      >
                        <span className="game-hud-nav-symbol">{item.symbol}</span>
                        <span className="game-hud-nav-label">{item.label}</span>
                      </button>
                    ))}
                    <Link className="game-hud-nav-item game-hud-nav-link" href="/docs">
                      <span className="game-hud-nav-symbol">?</span>
                      <span className="game-hud-nav-label">Docs</span>
                    </Link>
                  </nav>
                  {awaySummary ? (
                    <div className="game-away-summary" role="status" aria-live="polite">
                      <span>While you were away</span>
                      <strong>{awaySummary.topia} $TOPIA</strong>
                      <p>{awaySummary.agentCount} agents kept working for {awaySummary.durationLabel}.</p>
                    </div>
                  ) : null}
                  <div
                    aria-label={movingAgentId ? "Agent placement mode" : "Agent work area"}
                    className={`game-stage-workspace${movingAgentId ? " game-stage-workspace-move-mode" : ""}`}
                    onClick={handleWorkspacePlacement}
                    ref={workspaceRef}
                  >
                    <div className="game-stage-work-table" style={tableStyle} />
                    {movingAgentId ? (
                      <div className="game-stage-move-hint">
                        Click inside the house to place the selected agent.
                      </div>
                    ) : null}
                    <div className="game-stage-worker-layer">
                      {tempoSpriteSheetUrl
                        ? stagedAgents.map(({ agent, isMoving, isSelected, notification, work }) => (
                            <TempoStageWorker
                              agentLabel={agent.label}
                              agentType={agent.type}
                              frameDurationMs={
                                agent.type === "builder"
                                  ? 280
                                  : agent.type === "trader"
                                    ? 190
                                    : 190
                              }
                              isMoveArmed={isMoving}
                              isSelected={isSelected}
                              key={agent.id}
                              notification={notification}
                              onRequestMove={() => {
                                setMovingAgentId((current) => (current === agent.id ? null : agent.id));
                                setSelectedAgentId(agent.id);
                              }}
                              onSelect={() => {
                                setSelectedAgentId((current) => (current === agent.id ? null : agent.id));
                                setMovingAgentId((current) => (current === agent.id ? null : current));
                              }}
                              spriteScale={agent.type === "builder" ? 2 : agent.type === "trader" ? 1.75 : 1.75}
                              spriteSheetUrl={tempoSpriteSheetUrl}
                              work={work}
                              workingIdleFrameIndex={
                                agent.type === "builder" ? 2 : agent.type === "trader" ? 3 : agent.type === "finance" ? 2 : undefined
                              }
                              workingColumns={agent.type === "builder" ? 2 : 5}
                              workingPulseFrameIndex={
                                agent.type === "builder" ? 3 : agent.type === "trader" ? 2 : agent.type === "finance" ? 2 : undefined
                              }
                              workingPulseIntervalMs={
                                agent.type === "builder" || agent.type === "trader" || agent.type === "finance" ? 10000 : undefined
                              }
                              workingRows={agent.type === "builder" ? 2 : 1}
                              workingSheetUrl={
                                agent.type === "builder"
                                  ? "/builder_work.png"
                                  : agent.type === "trader"
                                    ? "/special_work2.png"
                                    : "/legendary_work.png"
                              }
                            />
                          ))
                        : null}
                    </div>
                  </div>
                  {activeGameTab ? (
                  <aside
                    className={`game-hud-panel ${activeGameTab === "shop" ? "game-hud-panel-shop" : ""} ${activeGameTab === "leaderboard" ? "game-hud-panel-leaderboard" : ""}`.trim()}
                  >
                    {activeGameTab === "shop" ? (
                      <>
                        <div className="game-hud-panel-head">
                          <span className="meta-label">Marketplace</span>
                          <strong>Shop</strong>
                          <p>Available inventory for this account.</p>
                        </div>
                        <div className="shop-payment-selector game-shop-payment-selector" aria-label="Shop payment token">
                          <span>Pay with</span>
                          <div className="shop-payment-options">
                            {paymentTokens.map((paymentTokenOption) => (
                              <button
                                aria-pressed={marketPaymentToken === paymentTokenOption.id}
                                className={`shop-payment-option ${
                                  marketPaymentToken === paymentTokenOption.id ? "shop-payment-option-active" : ""
                                }`.trim()}
                                disabled={isPurchasing}
                                key={paymentTokenOption.id}
                                onClick={() => setMarketPaymentToken(paymentTokenOption.id)}
                                type="button"
                              >
                                {paymentTokenOption.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="game-hud-shop-layout">
                        <div className="game-hud-section">
                          <div className="game-hud-section-head">
                            <span className="meta-label">NFT</span>
                            <strong>Agent Collection</strong>
                          </div>
                          <div className="game-hud-shop-grid">
                          {nftOffers.map((offer) => (
                            <article className="game-hud-card" key={offer.title}>
                              <span>{offer.subtitle}</span>
                              <strong>{offer.title}</strong>
                              <p>{offer.detail}</p>
                              <div className="game-hud-card-foot">
                                <div className="game-hud-price-stack">
                                  <small>{offer.originalPrice.toFixed(2)} USD</small>
                                  <em>{offer.discountedPrice.toFixed(2)} USD</em>
                                  <span>20% Off</span>
                                </div>
                                <button
                                  className="ghost-button game-hud-inline-button"
                                  disabled={isPurchasing}
                                  onClick={() =>
                                    purchaseMarketItem({
                                      itemType: "agent",
                                      itemId: offer.id,
                                      pathUsdPrice: offer.discountedPrice.toFixed(2),
                                      paymentToken: marketPaymentToken,
                                    })
                                  }
                                  type="button"
                                >
                                  Buy with {selectedMarketPaymentToken.label}
                                </button>
                              </div>
                            </article>
                          ))}
                          </div>
                        </div>
                        <div className="game-hud-section">
                          <div className="game-hud-section-head">
                            <strong>Extra Slot</strong>
                          </div>
                          <article className="game-hud-card game-hud-card-slot">
                            <strong>{extraSlotOffer.title}</strong>
                            <p>{extraSlotOffer.detail}</p>
                            <div className="game-hud-card-foot">
                              <div className="game-hud-price-stack">
                                <small>{extraSlotOffer.originalPrice.toFixed(2)} USD</small>
                                <em>{extraSlotOffer.discountedPrice.toFixed(2)} USD</em>
                                <span>20% Off</span>
                              </div>
                              <button
                                className="ghost-button game-hud-inline-button"
                                disabled={isPurchasing}
                                onClick={() =>
                                  purchaseMarketItem({
                                    itemType: "slot",
                                    pathUsdPrice: extraSlotOffer.discountedPrice.toFixed(2),
                                    paymentToken: marketPaymentToken,
                                  })
                                }
                                type="button"
                              >
                                Buy with {selectedMarketPaymentToken.label}
                              </button>
                            </div>
                          </article>
                        </div>
                        </div>
                      </>
                    ) : null}

                    {activeGameTab === "leaderboard" ? (
                      <>
                        <div className="game-hud-panel-head game-hud-panel-head-leaderboard">
                          <span className="meta-label">Ranking</span>
                          <div className="game-hud-panel-head-title-row">
                            <strong>Leaderboard</strong>
                            <Image
                              alt=""
                              aria-hidden="true"
                              className="game-hud-leaderboard-badge"
                              height={88}
                              src="/kelahmad.png"
                              width={88}
                            />
                          </div>
                          <p>Ranking is based on minute income. Highest income sits at rank one.</p>
                        </div>
                        <div className="game-hud-leaderboard">
                          {leaderboardDisplayEntries.map((entry) => {
                            const isCurrentPlayer =
                              !entry.isPlaceholder && entry.walletAddress.toLowerCase() === address?.toLowerCase();

                            return (
                              <div
                                className={`game-hud-leaderboard-row ${entry.rank <= 5 ? "game-hud-leaderboard-row-top" : ""} ${isCurrentPlayer ? "game-hud-leaderboard-row-self" : ""} ${entry.isPlaceholder ? "game-hud-leaderboard-row-placeholder" : ""}`.trim()}
                                key={`${entry.walletAddress}-${entry.rank}`}
                              >
                                <span>#{entry.rank}</span>
                                <strong>{isCurrentPlayer ? displayName : entry.label}</strong>
                                <em>{entry.isPlaceholder ? "Awaiting score" : `${formatIncomePerMinute(entry.incomePerMinute)} / min`}</em>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : null}

                    {activeGameTab === "withdraw" ? (
                      <>
                        <div className="game-hud-panel-head">
                          <span className="meta-label">Treasury</span>
                          <strong>Withdraw</strong>
                          <p>Move the available balance to your wallet when you are ready.</p>
                        </div>
                        <div className="game-hud-withdraw-grid">
                          <div className="game-hud-card game-hud-card-highlight">
                            <span>Available</span>
                            <strong>{displayedTopiaEarned} $TOPIA</strong>
                            <p>Current in-game balance ready for withdrawal.</p>
                          </div>
                          <div className="game-hud-card">
                            <span>Wallet</span>
                            <strong>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "-"}</strong>
                            <p>Withdrawals settle to the connected wallet.</p>
                          </div>
                        </div>
                        <div className="game-hud-withdraw-actions">
                          <button
                            className="action-button game-hud-withdraw-button"
                            disabled={!WITHDRAWALS_ENABLED}
                            onClick={collectIncome}
                            title="Supply has not been created yet. It will be created soon. Follow updates on X."
                            type="button"
                          >
                            Withdraw $TOPIA
                          </button>
                          <button className="ghost-button game-hud-inline-button" onClick={logout} type="button">
                            Disconnect
                          </button>
                        </div>
                      </>
                    ) : null}
                  </aside>
                  ) : null}
                  <div className="game-stage-floor" />
                  <div aria-label="Lego Miners home scene" className="game-stage-home-scene" style={tableStyle} />
                </div>
              </div>

              <div className="game-side-rail game-panel-passive" aria-hidden="true">
                <div className="panel game-metrics-panel">
                  <div className="game-metric-card">
                    <span>$TOPIA / min</span>
                    <strong>{displayedIncomePerMinute}</strong>
                  </div>
                  <div className="game-metric-card">
                    <span>$TOPIA / day</span>
                    <strong>{displayedIncomePerDay}</strong>
                  </div>
                  <div className="game-metric-card">
                    <span>Unclaimed</span>
                    <strong>{displayedUnclaimedIncome}</strong>
                  </div>
                  <div className="game-metric-card">
                    <span>Available Slots</span>
                    <strong>{nextAgentSlots}</strong>
                  </div>
                  <div className="game-action-stack">
                    <button
                      className="action-button game-action-primary"
                      disabled={!WITHDRAWALS_ENABLED}
                      onClick={collectIncome}
                      title="Supply has not been created yet. It will be created soon. Follow updates on X."
                      type="button"
                    >
                      Withdraw $TOPIA
                    </button>
                    <button className="ghost-button game-action-secondary" onClick={resetProgress} type="button">
                      Reset Progress
                    </button>
                    <button className="ghost-button game-action-secondary" onClick={logout} type="button">
                      Logout
                    </button>
                  </div>
                </div>

                <div className="panel game-agents-panel">
                  <div className="panel-head">
                    <strong>Agents</strong>
                    <span className="meta-label">{activeAgents.length} Active</span>
                  </div>
                  <div className="agent-grid">
                    {activeAgents.map((agent) => (
                      <article className="agent-slot" key={agent.id}>
                        <div className="agent-slot-head">
                          <span className="meta-label">{agent.rarity}</span>
                          <strong>{agent.label}</strong>
                        </div>
                        <p>{agent.description}</p>
                        <div className="agent-slot-foot">
                          <span>$TOPIA / min</span>
                          <strong>{formatIncomePerMinute(agent.incomePerMinute)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {showPurchaseConfirmedModal ? (
          <div className="tempo-confirm-overlay" role="presentation">
            <div className="tempo-confirm-card">
              <span className="tempo-confirm-kicker">Confirmed</span>
              <h3>{selectedPackage?.title ?? activePack.title} unlocked</h3>
              <p>Payment verified on-chain. You will be redirected to the game in 5 seconds.</p>
            </div>
          </div>
        ) : null}

        {isClient && toastState
          ? createPortal(
              <div className="tempo-toast-shell" role="status" aria-live="polite">
                <div className={`tempo-toast-card tempo-toast-card-${toastState.tone}`}>
                  <strong>{toastState.title}</strong>
                  <p>{toastState.message}</p>
                </div>
              </div>,
              document.body,
            )
          : null}
      </section>
    </main>
  );
}
