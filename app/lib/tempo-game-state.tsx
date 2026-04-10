"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  buildStarterAgent,
  getTempoPackage,
  type AgentRecord,
  type PackageDefinition,
  type PackageTier,
  type StoredPlayerState,
} from "./tempo-game-data";

type TempoGameContextValue = {
  address?: string;
  isConnected: boolean;
  isReady: boolean;
  isPurchasing: boolean;
  player: StoredPlayerState | null;
  selectedPackage: PackageDefinition | null;
  totalIncomePerMinute: number;
  unclaimedIncome: number;
  nextAgentSlots: number;
  purchasePackage: (packageId: PackageTier) => Promise<void>;
  collectIncome: () => void;
  resetProgress: () => void;
};

const TempoGameContext = createContext<TempoGameContextValue | null>(null);

function getStorageKey(address?: string) {
  return address ? `tempo-topia-player:${address.toLowerCase()}` : null;
}

function readStoredPlayer(address?: string) {
  const key = getStorageKey(address);

  if (!key || typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredPlayerState;
  } catch {
    return null;
  }
}

function writeStoredPlayer(address: string | undefined, player: StoredPlayerState | null) {
  const key = getStorageKey(address);

  if (!key || typeof window === "undefined") {
    return;
  }

  if (!player) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(player));
}

function calculateUnclaimedIncome(
  player: StoredPlayerState | null,
  now: number,
) {
  if (!player) {
    return 0;
  }

  const elapsedMs = Math.max(0, now - player.lastCollectedAt);
  const totalIncomePerMinute = player.agents.reduce((sum, agent) => {
    return sum + agent.incomePerMinute;
  }, 0);

  return (elapsedMs / 60000) * totalIncomePerMinute;
}

function roundIncome(value: number) {
  return Math.floor(value * 100) / 100;
}

type TempoGameStateProviderProps = {
  children: React.ReactNode;
};

export function TempoGameStateProvider({
  children,
}: TempoGameStateProviderProps) {
  const { address, isConnected } = useAccount();
  const [player, setPlayer] = useState<StoredPlayerState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    setIsReady(false);
    setPlayer(readStoredPlayer(address));
    setIsReady(true);
  }, [address]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    writeStoredPlayer(address, player);
  }, [address, isReady, player]);

  const selectedPackage = player ? getTempoPackage(player.packageId) : null;
  const totalIncomePerMinute = player
    ? player.agents.reduce((sum, agent) => sum + agent.incomePerMinute, 0)
    : 0;
  const unclaimedIncome = roundIncome(calculateUnclaimedIncome(player, clock));
  const nextAgentSlots = selectedPackage
    ? Math.max(0, selectedPackage.agentLimit - player!.agents.length)
    : 0;

  async function purchasePackage(packageId: PackageTier) {
    if (!address || isPurchasing) {
      return;
    }

    setIsPurchasing(true);
    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1400);
      });

      if (!address) {
        return;
      }

      const starterAgent = buildStarterAgent(packageId);

      setPlayer({
        packageId,
        agents: [starterAgent],
        acquiredAt: Date.now(),
        lastCollectedAt: Date.now(),
        lifetimeCollected: 0,
      });
    } finally {
      setIsPurchasing(false);
    }
  }

  function collectIncome() {
    if (!player) {
      return;
    }

    const claimedNow = calculateUnclaimedIncome(player, Date.now());

    setPlayer({
      ...player,
      lifetimeCollected: roundIncome(player.lifetimeCollected + claimedNow),
      lastCollectedAt: Date.now(),
    });
  }

  function resetProgress() {
    setPlayer(null);
  }

  return (
    <TempoGameContext.Provider
      value={{
        address,
        isConnected,
        isReady,
        isPurchasing,
        player,
        selectedPackage,
        totalIncomePerMinute,
        unclaimedIncome,
        nextAgentSlots,
        purchasePackage,
        collectIncome,
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
