"use client";

import { useEffect, useRef, useState } from "react";
import {
  getTempoSpriteRowIndex,
  TEMPO_AGENT_FRAME_DURATION_MS,
} from "../lib/tempo-agent-sprite";
import { extractSpriteSheetFrames } from "../lib/sprite-sheet";

type StagePoint = {
  x: number;
  y: number;
  scale: number;
};

type Notification = {
  message: string;
  nonce: number;
};

type TempoStageWorkerProps = {
  agentLabel: string;
  agentType: string;
  frameDurationMs?: number;
  isMoveArmed?: boolean;
  isSelected?: boolean;
  notification?: Notification;
  onRequestMove?: () => void;
  onSelect?: () => void;
  spriteScale?: number;
  spriteSheetUrl: string;
  work: StagePoint;
  workingIdleFrameIndex?: number;
  workingPulseFrameIndex?: number;
  workingPulseIntervalMs?: number;
  workingFrameSequence?: number[];
  workingFrameAdjustments?: Partial<
    Record<
      number,
      {
        scale?: number;
        x?: number;
        y?: number;
      }
    >
  >;
  workingColumns?: number;
  workingRows?: number;
  workingSheetUrl?: string;
};

type WorkerActorState = {
  frameElapsedMs: number;
  frameIndex: number;
};

const createInitialActorState = (): WorkerActorState => {
  return {
    frameElapsedMs: 0,
    frameIndex: 0,
  };
};

export function TempoStageWorker({
  agentLabel,
  agentType,
  frameDurationMs = TEMPO_AGENT_FRAME_DURATION_MS,
  isMoveArmed = false,
  isSelected = false,
  notification,
  onRequestMove,
  onSelect,
  spriteScale = 1,
  spriteSheetUrl,
  work,
  workingIdleFrameIndex,
  workingPulseFrameIndex,
  workingPulseIntervalMs,
  workingFrameSequence,
  workingFrameAdjustments,
  workingColumns = 2,
  workingRows = 2,
  workingSheetUrl,
}: TempoStageWorkerProps) {
  const workerRef = useRef<HTMLDivElement | null>(null);
  const baseSheetRef = useRef<HTMLImageElement | null>(null);
  const workingFrameRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const actorRef = useRef<WorkerActorState>(createInitialActorState());
  const [workingFrames, setWorkingFrames] = useState<string[]>([]);
  const initialWorkingFrameSrc = workingFrames[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    if (!workingSheetUrl) {
      setWorkingFrames([]);
      return;
    }

    void extractSpriteSheetFrames({
      columns: workingColumns,
      fitMode: "cell",
      paddingX: 24,
      paddingY: 18,
      rows: workingRows,
      src: workingSheetUrl,
      useBottomAnchor: true,
    })
      .then((frames) => {
        if (!cancelled) {
          setWorkingFrames(frames);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkingFrames([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workingColumns, workingRows, workingSheetUrl]);

  useEffect(() => {
    const worker = workerRef.current;
    const baseSheet = baseSheetRef.current;
    if (!worker || !baseSheet) {
      return;
    }

    actorRef.current = createInitialActorState();

    const applyActorState = () => {
      const actor = actorRef.current;
      worker.style.left = `${work.x}%`;
      worker.style.top = `${work.y}%`;
      worker.style.opacity = "1";
      worker.style.transform = `translate(-50%, -100%) scale(${work.scale})`;

      const workingFrame = workingFrameRef.current;
      if (workingFrames.length > 0 && workingFrame) {
        const hasPulseFrames =
          typeof workingIdleFrameIndex === "number" &&
          typeof workingPulseFrameIndex === "number" &&
          typeof workingPulseIntervalMs === "number" &&
          workingPulseIntervalMs > 0;
        const usableFrameSequence =
          workingFrameSequence && workingFrameSequence.length > 0
            ? workingFrameSequence.filter((frame) => frame >= 0 && frame < workingFrames.length)
            : workingFrames.map((_, index) => index);
        const elapsedMs = actor.frameElapsedMs;
        const frameIndex = hasPulseFrames
          ? (() => {
              const normalizedIdleFrameIndex = Math.max(
                0,
                Math.min(workingFrames.length - 1, workingIdleFrameIndex),
              );
              const normalizedPulseFrameIndex = Math.max(
                0,
                Math.min(workingFrames.length - 1, workingPulseFrameIndex),
              );
              const elapsedInInterval = elapsedMs % workingPulseIntervalMs;
              const pulseWindowStart = Math.max(0, workingPulseIntervalMs - frameDurationMs);
              return elapsedInInterval >= pulseWindowStart
                ? normalizedPulseFrameIndex
                : normalizedIdleFrameIndex;
            })()
          : usableFrameSequence[actor.frameIndex % usableFrameSequence.length] ?? 0;
        const adjustment = workingFrameAdjustments?.[frameIndex];
        const offsetX = adjustment?.x ?? 0;
        const offsetY = adjustment?.y ?? 0;
        const scale = adjustment?.scale ?? 1;
        const nextFrameSrc = workingFrames[frameIndex] ?? null;
        baseSheet.style.opacity = "0";
        if (!nextFrameSrc) {
          workingFrame.style.opacity = "0";
          return;
        }

        workingFrame.style.opacity = "1";
        workingFrame.src = nextFrameSrc;
        workingFrame.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        return;
      }

      baseSheet.style.opacity = "1";
      baseSheet.style.transform = `translate(0, ${-getTempoSpriteRowIndex("down") * 25}%)`;
      if (workingFrame) {
        workingFrame.style.opacity = "0";
        workingFrame.style.transform = "translate(0, 0) scale(1)";
      }
    };

    const stopAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimestampRef.current = null;
    };

    const runFrame = (timestamp: number) => {
      if (workingFrames.length === 0) {
        applyActorState();
        stopAnimation();
        return;
      }

      const actor = actorRef.current;
      const previousTimestamp = lastTimestampRef.current ?? timestamp;
      const deltaMs = Math.min(timestamp - previousTimestamp, 48);

      lastTimestampRef.current = timestamp;
      actor.frameElapsedMs += deltaMs;
      if (
        typeof workingIdleFrameIndex !== "number" ||
        typeof workingPulseFrameIndex !== "number" ||
        typeof workingPulseIntervalMs !== "number" ||
        workingPulseIntervalMs <= 0
      ) {
        const usableFrameSequence =
          workingFrameSequence && workingFrameSequence.length > 0
            ? workingFrameSequence.filter((frame) => frame >= 0 && frame < workingFrames.length)
            : workingFrames.map((_, index) => index);
        const frameCount = Math.max(1, usableFrameSequence.length);
        if (actor.frameElapsedMs >= frameDurationMs) {
          actor.frameElapsedMs -= frameDurationMs;
          actor.frameIndex = (actor.frameIndex + 1) % frameCount;
        }
      }

      applyActorState();
      animationFrameRef.current = window.requestAnimationFrame(runFrame);
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    applyActorState();
    if (prefersReducedMotion) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(runFrame);

    return () => {
      stopAnimation();
    };
  }, [
    frameDurationMs,
    work.scale,
    work.x,
    work.y,
    workingFrameSequence,
    workingFrames,
    workingIdleFrameIndex,
    workingPulseFrameIndex,
    workingPulseIntervalMs,
  ]);

  return (
    <div
      aria-label={`${agentLabel} working`}
      className={`game-stage-worker game-stage-worker-${agentType}${isSelected ? " game-stage-worker-selected" : ""}${isMoveArmed ? " game-stage-worker-move-armed" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      ref={workerRef}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
    >
      {notification ? (
        <div className="game-stage-worker-bubble" key={notification.nonce}>
          {notification.message}
        </div>
      ) : null}
      <div className="game-stage-worker-shadow" />
      <div className="game-stage-worker-sprite" aria-hidden="true">
        <div
          className="game-stage-worker-sprite-window"
          style={{ transform: `translateX(-50%) scale(${spriteScale})` }}
        >
          <img
            alt=""
            className="game-stage-worker-sheet"
            draggable="false"
            ref={baseSheetRef}
            src={spriteSheetUrl}
            style={{ height: "calc(100% * 4)", width: "calc(100% * 4)" }}
          />
          {workingSheetUrl && initialWorkingFrameSrc ? (
            <img
              alt=""
              className="game-stage-worker-sheet"
              draggable="false"
              ref={workingFrameRef}
              src={initialWorkingFrameSrc}
              style={{
                height: "100%",
                opacity: 0,
                width: "100%",
              }}
            />
          ) : null}
        </div>
      </div>
      {isSelected ? (
        <button
          className="game-stage-worker-move-button"
          onClick={(event) => {
            event.stopPropagation();
            onRequestMove?.();
          }}
          type="button"
        >
          {isMoveArmed ? "Place" : "Move"}
        </button>
      ) : null}
    </div>
  );
}
