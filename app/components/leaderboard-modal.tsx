"use client";

import { useEffect } from "react";
import styles from "./leaderboard-modal.module.css";

type LeaderboardEntry = {
  rank: number;
  walletAddress: string;
  incomePerMinute: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  entries?: LeaderboardEntry[];
};

const MOCK_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, walletAddress: "0x1a2b3c4d5e6f...9a0b", incomePerMinute: 124.5 },
  { rank: 2, walletAddress: "0x2b3c4d5e6f7a...0c1d", incomePerMinute: 98.3 },
  { rank: 3, walletAddress: "0x3c4d5e6f7a8b...2d3e", incomePerMinute: 87.2 },
  { rank: 4, walletAddress: "0x4d5e6f7a8b9c...4e5f", incomePerMinute: 76.1 },
  { rank: 5, walletAddress: "0x5e6f7a8b9c0d...6f7a", incomePerMinute: 65.4 },
  { rank: 6, walletAddress: "0x6f7a8b9c0d1e...8a9b", incomePerMinute: 54.8 },
  { rank: 7, walletAddress: "0x7a8b9c0d1e2f...0c1d", incomePerMinute: 43.2 },
  { rank: 8, walletAddress: "0x8b9c0d1e2f3a...2e3f", incomePerMinute: 32.7 },
  { rank: 9, walletAddress: "0x9c0d1e2f3a4b...4f5a", incomePerMinute: 21.9 },
  { rank: 10, walletAddress: "0x0d1e2f3a4b5c...6a7b", incomePerMinute: 15.3 },
];

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatIncome(value: number): string {
  return `$${value.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}/min`;
}

export function LeaderboardModal({ isOpen, onClose, entries = MOCK_ENTRIES }: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalGlow} />
        <div className={styles.modalContent}>
          {/* Blur wrapper - will be removed at launch */}
          <div className={styles.blurContent}>
            <header className={styles.header}>
              <h2 className={styles.title}>LEADERBOARD</h2>
              <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </header>

            <div className={styles.tableHeader}>
              <span className={styles.colRank}>#</span>
              <span className={styles.colWallet}>WALLET</span>
              <span className={styles.colIncome}>EARNINGS</span>
            </div>

            <div className={styles.entries}>
              {entries.map((entry) => (
                <div
                  key={entry.rank}
                  className={`${styles.entry} ${styles[`rank${entry.rank}`]}`}
                >
                  <span className={styles.rank}>{entry.rank}</span>
                  <span className={styles.wallet}>{shortenAddress(entry.walletAddress)}</span>
                  <span className={styles.income}>{formatIncome(entry.incomePerMinute)}</span>
                </div>
              ))}
            </div>

            <div className={styles.footerGlow} />
          </div>

          {/* Full leaderboard will be available at launch */}
          <p className={styles.launchNotice}>Unknown</p>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
