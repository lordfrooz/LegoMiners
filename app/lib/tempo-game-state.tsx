"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { formatUnits, getAddress, parseUnits } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import {
  getPaymentToken,
  getTempoPackage,
  type PackageDefinition,
  type PackageTier,
  type PaymentToken,
  type StoredPlayerState,
} from "./tempo-game-data";
import { tempoMainnet } from "./tempo-network";

const DEFAULT_PAYMENT_RECEIVER = "0xF3496428451A874845f770d719cc1C609a5c661e";
const DEFAULT_PATHUSD_ADDRESS = "0x20c0000000000000000000000000000000000000";
const DEFAULT_USDC_ADDRESS = "0x20c000000000000000000000b9537d11c60e8b50";
const PAYMENT_TOKEN_DECIMALS = 6;
const PENDING_PURCHASE_STORAGE_KEY_PREFIX = "tempo-pending-purchase:";

const erc20TransferAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type PendingPurchase = {
  packageId: PackageTier;
  paymentToken: PaymentToken;
  txHash: `0x${string}`;
};

type MarketPurchaseInput =
  | { itemType: "agent"; itemId: PackageTier; pathUsdPrice: string; paymentToken: PaymentToken }
  | { itemType: "slot"; pathUsdPrice: string; paymentToken: PaymentToken };

type TempoGameContextValue = {
  address?: string;
  sessionAddress: string | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isReady: boolean;
  isPurchasing: boolean;
  authError: string | null;
  purchaseError: string | null;
  player: StoredPlayerState | null;
  selectedPackage: PackageDefinition | null;
  totalIncomePerMinute: number;
  unclaimedIncome: number;
  trustedNow: number;
  getTrustedNow: () => number;
  nextAgentSlots: number;
  pathUsdBalance: string;
  usdcBalance: string;
  lastPurchaseTxHash: string | null;
  pendingPurchaseTxHash: string | null;
  purchaseSuccessNonce: number;
  marketPurchaseSuccessNonce: number;
  lastMarketPurchase: MarketPurchaseInput | null;
  authenticateWallet: () => Promise<void>;
  logout: () => Promise<void>;
  purchasePackage: (packageId: PackageTier, paymentToken: PaymentToken) => Promise<void>;
  purchaseMarketItem: (input: MarketPurchaseInput) => Promise<void>;
  retryFinalizePurchase: () => Promise<void>;
  collectIncome: () => Promise<void>;
  moveAgentPosition: (input: { agentId: string; x: number; y: number }) => Promise<void>;
  resetProgress: () => Promise<void>;
};

const TempoGameContext = createContext<TempoGameContextValue | null>(null);

function normalizeAddress(address: string) {
  return getAddress(address.trim());
}

function readAddressConfig(value: string | undefined, fallback: string) {
  return normalizeAddress(value?.trim() || fallback);
}

function getPaymentTokenAddress(paymentToken: PaymentToken) {
  return readAddressConfig(
    paymentToken === "usdc"
      ? process.env.NEXT_PUBLIC_USDC_ADDRESS
      : process.env.NEXT_PUBLIC_PATHUSD_ADDRESS,
    paymentToken === "usdc" ? DEFAULT_USDC_ADDRESS : DEFAULT_PATHUSD_ADDRESS,
  );
}

function calculateUnclaimedIncome(player: StoredPlayerState | null, now: number) {
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

function getPendingPurchaseStorageKey(address?: string | null) {
  return address ? `${PENDING_PURCHASE_STORAGE_KEY_PREFIX}${address.toLowerCase()}` : null;
}

function roundIncome(value: number) {
  return Math.floor(value * 1_000_000) / 1_000_000;
}

function getPaymentTokenBalanceMessage(paymentToken: PaymentToken, context: "purchase" | "market" = "purchase") {
  const token = getPaymentToken(paymentToken);
  return `Insufficient ${token.label} balance for this ${context}.`;
}

function formatWalletError(
  error: unknown,
  fallback: string,
  options?: { paymentToken?: PaymentToken; context?: "purchase" | "market" },
) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
        ? error.message
        : fallback;
  const message = rawMessage.toLowerCase();

  if (message.includes("user rejected") || message.includes("user denied") || message.includes("rejected the request")) {
    return "Signature or transaction request was cancelled.";
  }

  if (message.includes("not enough native gas token balance")) {
    return "Not enough Tempo gas balance for this transaction.";
  }

  if (
    options?.paymentToken &&
    (message.includes("transfer amount exceeds balance") ||
      message.includes("erc20insufficientbalance") ||
      message.includes("insufficient balance") ||
      message.includes("amount exceeds balance") ||
      message.includes("exceeds balance"))
  ) {
    return getPaymentTokenBalanceMessage(options.paymentToken, options.context);
  }

  return rawMessage;
}

async function readJsonResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data.error === "string" ? data.error : "Request failed.";
    throw new Error(message);
  }

  return data;
}

function isRetriableFinalizeError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("transaction not found") ||
    normalizedMessage.includes("receipt") ||
    normalizedMessage.includes("no matching payment token transfer was found") ||
    normalizedMessage.includes("fetch failed") ||
    normalizedMessage.includes("request failed")
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type TempoGameStateProviderProps = {
  children: React.ReactNode;
};

export function TempoGameStateProvider({
  children,
}: TempoGameStateProviderProps) {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const [player, setPlayer] = useState<StoredPlayerState | null>(null);
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [lastPurchaseTxHash, setLastPurchaseTxHash] = useState<string | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null);
  const [purchaseSuccessNonce, setPurchaseSuccessNonce] = useState(0);
  const [marketPurchaseSuccessNonce, setMarketPurchaseSuccessNonce] = useState(0);
  const [lastMarketPurchase, setLastMarketPurchase] = useState<MarketPurchaseInput | null>(null);
  const [pathUsdBalance, setPathUsdBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [clock, setClock] = useState(() => Date.now());
  const autoAuthAttemptRef = useRef<string | null>(null);
  const pendingFinalizeAttemptRef = useRef(false);
  const serverClockRef = useRef({
    performanceNow: 0,
    serverNow: Date.now(),
  });

  const getMonotonicNow = useCallback(() => {
    if (typeof performance === "undefined") {
      return Date.now();
    }

    const elapsedMs = Math.max(0, performance.now() - serverClockRef.current.performanceNow);
    return serverClockRef.current.serverNow + elapsedMs;
  }, []);

  const syncServerClock = useCallback((serverNow: unknown) => {
    if (typeof serverNow !== "number" || !Number.isFinite(serverNow)) {
      return;
    }

    serverClockRef.current = {
      performanceNow: typeof performance === "undefined" ? 0 : performance.now(),
      serverNow,
    };
    setClock(serverNow);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setInterval(() => {
      setClock(getMonotonicNow());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [getMonotonicNow]);

  async function loadGameState() {
    try {
      const response = await fetch("/api/game/state", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await readJsonResponse(response);
      syncServerClock(data.serverNow);
      setSessionAddress(data.walletAddress ?? null);
      setPlayer(data.player ?? null);
      setLastPurchaseTxHash(data.player?.purchaseTxHash ?? null);
    } catch (error) {
      setPlayer(null);
      throw error;
    }
  }

  async function readPaymentTokenBalance(paymentToken: PaymentToken, targetAddress: string) {
    const tokenAddress = getPaymentTokenAddress(paymentToken);
    const balance = await publicClient!.readContract({
      address: tokenAddress,
      abi: erc20TransferAbi,
      functionName: "balanceOf",
      args: [normalizeAddress(targetAddress)],
    });

    return Number(formatUnits(balance, PAYMENT_TOKEN_DECIMALS)).toFixed(2);
  }

  async function refreshPaymentTokenBalances(targetAddress?: string) {
    if (!publicClient || !targetAddress) {
      setPathUsdBalance("0.00");
      setUsdcBalance("0.00");
      return;
    }

    const [pathUsdResult, usdcResult] = await Promise.allSettled([
      readPaymentTokenBalance("pathusd", targetAddress),
      readPaymentTokenBalance("usdc", targetAddress),
    ]);

    setPathUsdBalance(pathUsdResult.status === "fulfilled" ? pathUsdResult.value : "0.00");
    setUsdcBalance(usdcResult.status === "fulfilled" ? usdcResult.value : "0.00");
  }

  async function syncSession() {
    setIsReady(false);

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setIsAuthenticated(false);
        setSessionAddress(null);
        setPlayer(null);
        setLastPurchaseTxHash(null);
        return;
      }

      const data = await response.json();
      const walletAddress = normalizeAddress(data.walletAddress);

      if (address && walletAddress !== normalizeAddress(address)) {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        setIsAuthenticated(false);
        setSessionAddress(null);
        setPlayer(null);
        setLastPurchaseTxHash(null);
        setAuthError("Wallet changed. Sign again to continue.");
        return;
      }

      setIsAuthenticated(true);
      setSessionAddress(walletAddress);
      await loadGameState();
      await refreshPaymentTokenBalances(walletAddress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to restore session.";
      setAuthError(message);
      setIsAuthenticated(false);
      setSessionAddress(null);
      setPlayer(null);
      setPathUsdBalance("0.00");
      setUsdcBalance("0.00");
    } finally {
      setIsReady(true);
    }
  }

  useEffect(() => {
    void syncSession();
  }, [address, isConnected]);

  useEffect(() => {
    if (!isConnected || !address) {
      setPathUsdBalance("0.00");
      setUsdcBalance("0.00");
      return;
    }

    void refreshPaymentTokenBalances(address);

    const timer = window.setInterval(() => {
      void refreshPaymentTokenBalances(address);
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [address, isConnected, publicClient]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = getPendingPurchaseStorageKey(address);
    if (!storageKey) {
      return;
    }

    try {
      const rawValue = window.sessionStorage.getItem(storageKey);
      if (!rawValue) {
        return;
      }

      const parsed = JSON.parse(rawValue) as PendingPurchase | null;
      if (!parsed?.txHash || !parsed.packageId || !parsed.paymentToken) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }

      setPendingPurchase((current) => current ?? parsed);
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [address]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = getPendingPurchaseStorageKey(address);
    if (!storageKey) {
      return;
    }

    if (!pendingPurchase) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(pendingPurchase));
  }, [address, pendingPurchase]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!address || !isConnected) {
      autoAuthAttemptRef.current = null;
      return;
    }

    const normalizedAddress = normalizeAddress(address);

    if (isAuthenticated && sessionAddress === normalizedAddress) {
      autoAuthAttemptRef.current = normalizedAddress;
      return;
    }

    if (!walletClient || isAuthenticating) {
      return;
    }

    if (autoAuthAttemptRef.current === normalizedAddress) {
      return;
    }

    autoAuthAttemptRef.current = normalizedAddress;
    void authenticateWallet();
  }, [address, isAuthenticated, isAuthenticating, isConnected, isReady, sessionAddress, walletClient]);

  const selectedPackage = player ? player.packageSnapshot ?? getTempoPackage(player.packageId) : null;
  const totalIncomePerMinute = player
    ? player.agents.reduce((sum, agent) => sum + agent.incomePerMinute, 0)
    : 0;
  const unclaimedIncome = roundIncome(calculateUnclaimedIncome(player, clock));
  const nextAgentSlots = selectedPackage
    ? Math.max(0, selectedPackage.agentLimit - (player?.agents.length ?? 0))
    : 0;

  async function authenticateWallet() {
    if (!address || !walletClient) {
      setAuthError("Connect a wallet before signing in.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      if (chainId !== tempoMainnet.id) {
        await switchChainAsync({ chainId: tempoMainnet.id });
      }

      const nonceResponse = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address }),
      });
      const nonceData = await readJsonResponse(nonceResponse);

      const signature = await walletClient.signMessage({
        account: normalizeAddress(address),
        message: nonceData.message,
      });

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address,
          signature,
        }),
      });
      const verifyData = await readJsonResponse(verifyResponse);

      setIsAuthenticated(true);
      setSessionAddress(verifyData.walletAddress);
      autoAuthAttemptRef.current = normalizeAddress(verifyData.walletAddress);
      await loadGameState();
    } catch (error) {
      const message = formatWalletError(error, "Wallet authentication failed.");
      setAuthError(message);
      setIsAuthenticated(false);
      setSessionAddress(null);
      setPlayer(null);
      setPathUsdBalance("0.00");
      setUsdcBalance("0.00");
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
      setSessionAddress(null);
      setPlayer(null);
      setPendingPurchase(null);
      setLastPurchaseTxHash(null);
      setPathUsdBalance("0.00");
      setUsdcBalance("0.00");
      autoAuthAttemptRef.current = null;
    }
  }

  async function finalizePurchase(
    txHash: `0x${string}`,
    packageId: PackageTier,
    paymentToken: PaymentToken,
  ) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const response = await fetch("/api/game/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ txHash, packageId, paymentToken }),
        });

        if (response.status === 409) {
          await loadGameState();
          setPendingPurchase(null);
          setPurchaseSuccessNonce(Date.now());
          await refreshPaymentTokenBalances(address);
          return;
        }

        const data = await readJsonResponse(response);

        syncServerClock(data.serverNow);
        setPlayer(data.player);
        setLastPurchaseTxHash(data.player?.purchaseTxHash ?? txHash);
        setPendingPurchase(null);
        setPurchaseSuccessNonce(Date.now());
        await refreshPaymentTokenBalances(address);
        return;
      } catch (error) {
        const nextError = error instanceof Error ? error : new Error("Failed to finalize package purchase.");
        lastError = nextError;

        if (attempt === 7 || !isRetriableFinalizeError(nextError.message)) {
          throw nextError;
        }

        await wait(1500 * (attempt + 1));
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  async function retryFinalizePurchase() {
    if (!pendingPurchase || pendingFinalizeAttemptRef.current) {
      return;
    }

    pendingFinalizeAttemptRef.current = true;
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      await finalizePurchase(
        pendingPurchase.txHash,
        pendingPurchase.packageId,
        pendingPurchase.paymentToken,
      );
    } catch (error) {
      const message = formatWalletError(error, "Failed to finalize package purchase.");
      setPurchaseError(message);
    } finally {
      pendingFinalizeAttemptRef.current = false;
      setIsPurchasing(false);
    }
  }

  async function purchasePackage(packageId: PackageTier, paymentToken: PaymentToken) {
    if (!address || !walletClient || !publicClient) {
      setPurchaseError("Connect and authenticate your wallet before buying a pack.");
      return;
    }

    if (!isAuthenticated || !sessionAddress || sessionAddress !== normalizeAddress(address)) {
      setPurchaseError("Sign the wallet message before buying a pack.");
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const packageDefinition = getTempoPackage(packageId);
      const amount = parseUnits(packageDefinition.pathUsdPrice, PAYMENT_TOKEN_DECIMALS);
      const tokenAddress = getPaymentTokenAddress(paymentToken);
      const paymentReceiver = readAddressConfig(
        process.env.NEXT_PUBLIC_PAYMENT_RECEIVER,
        DEFAULT_PAYMENT_RECEIVER,
      );

      if (chainId !== tempoMainnet.id) {
        await switchChainAsync({ chainId: tempoMainnet.id });
      }

      const tokenBalance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20TransferAbi,
        functionName: "balanceOf",
        args: [normalizeAddress(address)],
      });

      if (tokenBalance < amount) {
        throw new Error(getPaymentTokenBalanceMessage(paymentToken));
      }

      const [gasEstimate, gasPrice, nativeBalance] = await Promise.all([
        publicClient.estimateContractGas({
          account: normalizeAddress(address),
          address: tokenAddress,
          abi: erc20TransferAbi,
          functionName: "transfer",
          args: [paymentReceiver, amount],
        }),
        publicClient.getGasPrice(),
        publicClient.getBalance({ address: normalizeAddress(address) }),
      ]);

      if (nativeBalance < gasEstimate * gasPrice) {
        throw new Error("Not enough native gas token balance on Tempo Mainnet.");
      }

      const txHash = await walletClient.writeContract({
        account: normalizeAddress(address),
        address: tokenAddress,
        abi: erc20TransferAbi,
        functionName: "transfer",
        args: [paymentReceiver, amount],
        chain: tempoMainnet,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error("Payment transaction failed on-chain.");
      }

      setPendingPurchase({ txHash, packageId, paymentToken });
      await finalizePurchase(txHash, packageId, paymentToken);
    } catch (error) {
      const message = formatWalletError(error, "Pack purchase failed.", {
        paymentToken,
        context: "purchase",
      });
      setPurchaseError(message);
    } finally {
      setIsPurchasing(false);
    }
  }

  async function purchaseMarketItem(input: MarketPurchaseInput) {
    if (!address || !walletClient || !publicClient) {
      setPurchaseError("Connect and authenticate your wallet before buying from the market.");
      return;
    }

    if (!player) {
      setPurchaseError("Choose a pack before buying from the market.");
      return;
    }

    if (!isAuthenticated || !sessionAddress || sessionAddress !== normalizeAddress(address)) {
      setPurchaseError("Sign the wallet message before buying from the market.");
      return;
    }

    if (input.itemType === "agent" && nextAgentSlots <= 0) {
      setPurchaseError("No available agent slots. Buy an extra slot first.");
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const amount = parseUnits(input.pathUsdPrice, PAYMENT_TOKEN_DECIMALS);
      const tokenAddress = getPaymentTokenAddress(input.paymentToken);
      const paymentReceiver = readAddressConfig(
        process.env.NEXT_PUBLIC_PAYMENT_RECEIVER,
        DEFAULT_PAYMENT_RECEIVER,
      );

      if (chainId !== tempoMainnet.id) {
        await switchChainAsync({ chainId: tempoMainnet.id });
      }

      const tokenBalance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20TransferAbi,
        functionName: "balanceOf",
        args: [normalizeAddress(address)],
      });

      if (tokenBalance < amount) {
        throw new Error(getPaymentTokenBalanceMessage(input.paymentToken, "market"));
      }

      const [gasEstimate, gasPrice, nativeBalance] = await Promise.all([
        publicClient.estimateContractGas({
          account: normalizeAddress(address),
          address: tokenAddress,
          abi: erc20TransferAbi,
          functionName: "transfer",
          args: [paymentReceiver, amount],
        }),
        publicClient.getGasPrice(),
        publicClient.getBalance({ address: normalizeAddress(address) }),
      ]);

      if (nativeBalance < gasEstimate * gasPrice) {
        throw new Error("Not enough native gas token balance on Tempo Mainnet.");
      }

      const txHash = await walletClient.writeContract({
        account: normalizeAddress(address),
        address: tokenAddress,
        abi: erc20TransferAbi,
        functionName: "transfer",
        args: [paymentReceiver, amount],
        chain: tempoMainnet,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error("Payment transaction failed on-chain.");
      }

      const response = await fetch("/api/game/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          txHash,
          itemType: input.itemType,
          itemId: input.itemType === "agent" ? input.itemId : "extra-slot",
          paymentToken: input.paymentToken,
        }),
      });
      const data = await readJsonResponse(response);

      syncServerClock(data.serverNow);
      setPlayer(data.player);
      setLastMarketPurchase(input);
      setMarketPurchaseSuccessNonce(Date.now());
      await refreshPaymentTokenBalances(address);
    } catch (error) {
      const message = formatWalletError(error, "Market purchase failed.", {
        paymentToken: input.paymentToken,
        context: "market",
      });
      setPurchaseError(message);
    } finally {
      setIsPurchasing(false);
    }
  }

  async function collectIncome() {
    if (!isAuthenticated) {
      return;
    }

    try {
      setPurchaseError(null);
      const response = await fetch("/api/game/collect", {
        method: "POST",
        credentials: "include",
      });
      const data = await readJsonResponse(response);
      syncServerClock(data.serverNow);
      setPlayer(data.player);
      await refreshPaymentTokenBalances(address);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to collect income.";
      setPurchaseError(message);
    }
  }

  async function moveAgentPosition(input: { agentId: string; x: number; y: number }) {
    if (!isAuthenticated) {
      return;
    }

    const response = await fetch("/api/game/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = await readJsonResponse(response);
    syncServerClock(data.serverNow);
    setPlayer(data.player);
  }

  async function resetProgress() {
    if (!isAuthenticated) {
      return;
    }

    const response = await fetch("/api/game/reset", {
      method: "POST",
      credentials: "include",
    });
    await readJsonResponse(response);
    setPlayer(null);
    setLastPurchaseTxHash(null);
    setPendingPurchase(null);
    await refreshPaymentTokenBalances(address);
  }

  useEffect(() => {
    if (!pendingPurchase || !isAuthenticated || !!player) {
      return;
    }

    const timer = window.setTimeout(() => {
      void retryFinalizePurchase();
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, pendingPurchase?.packageId, pendingPurchase?.paymentToken, pendingPurchase?.txHash, !!player]);

  return (
    <TempoGameContext.Provider
      value={{
        address,
        sessionAddress,
        isConnected,
        isAuthenticated,
        isAuthenticating,
        isReady,
        isPurchasing,
        authError,
        purchaseError,
        player,
        selectedPackage,
        totalIncomePerMinute,
        unclaimedIncome,
        trustedNow: clock,
        getTrustedNow: getMonotonicNow,
        nextAgentSlots,
        pathUsdBalance,
        usdcBalance,
        lastPurchaseTxHash,
        pendingPurchaseTxHash: pendingPurchase?.txHash ?? null,
        purchaseSuccessNonce,
        marketPurchaseSuccessNonce,
        lastMarketPurchase,
        authenticateWallet,
        logout,
        purchasePackage,
        purchaseMarketItem,
        retryFinalizePurchase,
        collectIncome,
        moveAgentPosition,
        resetProgress,
      }}
    >
      {children}
    </TempoGameContext.Provider>
  );
}

export function useTempoGameState() {
  const value = useContext(TempoGameContext);

  if (!value) {
    throw new Error("useTempoGameState must be used inside TempoGameStateProvider");
  }

  return value;
}
