"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import connectPhoto from "../../connect_photo.png";
import mobilePhoto from "../../mobile_photo.jpeg";
import { useTempoGameState } from "../lib/tempo-game-state";

const WHITELIST_X_ACCOUNT = process.env.NEXT_PUBLIC_WHITELIST_X_ACCOUNT as string;
const WHITELIST_TWEET_ID = process.env.NEXT_PUBLIC_WHITELIST_TWEET_ID as string;
const WHITELIST_SHARE_TEXT =
  "Joining Tempo Topia Early Access on @tempo. Early Access for early supporters.";
const WHITELIST_SHARE_URL = "https://tempotopia.xyz";

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
    label: "Notify",
    // Linki uygulamanın env dosyasından çekiyoruz:
    href: process.env.NEXT_PUBLIC_PROFILE_LINK || `https://x.com/${WHITELIST_X_ACCOUNT}`,
  },
];

export function TempoGameApp() {
  const { isReady } = useTempoGameState();
  const [twitterHandle, setTwitterHandle] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isWhitelistSubmitted, setIsWhitelistSubmitted] = useState(false);
  const [whitelistStep, setWhitelistStep] = useState<"twitter" | "wallet" | "tasks">("twitter");
  const [isRestoring, setIsRestoring] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);

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

  function handleWhitelistTaskClick(taskId: string, href: string) {
    setCompletedTasks((current) => {
      const newTasks = current.includes(taskId) ? current : [...current, taskId];
      setTimeout(() => saveStateAndSync({ completedTasks: newTasks }), 0);
      return newTasks;
    });
    window.open(href, "_blank", "noopener,noreferrer");
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
        // Token kullanıldı, yenile
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
    <main className="tempo-shell">
      <div
        aria-hidden="true"
        className="tempo-scene-background tempo-scene-background-soft"
      >
        <Image
          alt=""
          className="tempo-scene-background-image tempo-scene-background-image-desktop"
          fill
          priority
          src={connectPhoto}
        />
        <Image
          alt=""
          className="tempo-scene-background-image tempo-scene-background-image-mobile"
          fill
          priority
          src={mobilePhoto}
        />
      </div>

      <section className="tempo-frame">
        {!isReady || isRestoring ? (
          <section className="panel panel-centered flow-panel">
            <p className="meta-label">Loading state</p>
            <strong>Preparing command architecture...</strong>
          </section>
        ) : null}

        {isReady && !isRestoring && !isWhitelistSubmitted ? (
          <section className="wallet-gate whitelist-gate-stage">
            <div className="wallet-gate-minimal whitelist-gate">
              <div className="wallet-gate-intro whitelist-gate-intro">
                <h2>
                  Join the <span className="brand-accent">Tempo Topia</span>
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

        {isReady && !isRestoring && isWhitelistSubmitted ? (
          <section className="wallet-gate whitelist-gate-stage">
            <div className="wallet-gate-minimal whitelist-gate whitelist-confirm-shell">
              <div className="wallet-gate-intro whitelist-gate-intro whitelist-confirm-intro">
                <div className="whitelist-confirm-card">
                  <span className="whitelist-confirm-kicker">Confirmed ✅</span>
                  <div className="whitelist-confirm-profile">
                    {twitterAvatarUrl ? (
                      <img
                        alt={normalizedTwitterHandle}
                        className="whitelist-confirm-avatar"
                        referrerPolicy="no-referrer"
                        src={twitterAvatarUrl}
                      />
                    ) : null}
                    <div className="whitelist-confirm-copy">
                      <strong>@{normalizedTwitterHandle}</strong>
                      <p>You secured Early Access.</p>
                    </div>
                    <a
                      aria-label={`Open @${WHITELIST_X_ACCOUNT} on X`}
                      className="whitelist-confirm-x"
                      href={`https://x.com/${WHITELIST_X_ACCOUNT}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg
                        aria-hidden="true"
                        className="whitelist-confirm-x-icon"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z"
                          fill="currentColor"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
