"use client";

import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  buildTempoAgentSpriteAssets,
  getTempoSpriteDirectionFromDelta,
  TEMPO_AGENT_CELL_SIZE,
  TEMPO_AGENT_FRAME_COUNT,
  TEMPO_AGENT_FRAME_DURATION_MS,
  TEMPO_AGENT_DIRECTION_ROWS,
} from "../lib/tempo-agent-sprite";
import styles from "./sprite-sheet-widget.module.css";

type Direction = "down" | "left" | "right" | "up";

type SpriteAssets = {
  demoUrl: string;
  spriteCanvas: HTMLCanvasElement;
};

type ActorState = {
  currentWaypointIndex: number;
  direction: Direction;
  frameElapsedMs: number;
  frameIndex: number;
  x: number;
  y: number;
  targetWaypointIndex: number;
};

type RouteStatus = {
  complete: boolean;
  direction: Direction;
  frameIndex: number;
  waypoint: number;
};

const CLIP_CELL_SIZE = 92;
const WALK_SPEED = 104;
const ROUTE_WIDTH = 720;
const ROUTE_HEIGHT = 360;
const WAYPOINTS = [
  { x: 82, y: 278 },
  { x: 190, y: 278 },
  { x: 190, y: 148 },
  { x: 328, y: 148 },
  { x: 328, y: 252 },
  { x: 508, y: 252 },
  { x: 618, y: 112 },
] as const;

const createInitialActorState = (): ActorState => ({
  currentWaypointIndex: 0,
  direction: "right",
  frameElapsedMs: 0,
  frameIndex: 0,
  targetWaypointIndex: 1,
  x: WAYPOINTS[0].x,
  y: WAYPOINTS[0].y,
});

const getRouteStatus = (actor: ActorState): RouteStatus => ({
  complete: actor.currentWaypointIndex >= WAYPOINTS.length - 1,
  direction: actor.direction,
  frameIndex: actor.frameIndex,
  waypoint: actor.currentWaypointIndex + 1,
});

export function SpriteSheetWidget() {
  const [assets, setAssets] = useState<SpriteAssets | null>(null);
  const [clipStep, setClipStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<RouteStatus>(() => getRouteStatus(createInitialActorState()));
  const spriteSheetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const actorRef = useRef<ActorState>(createInitialActorState());
  const routeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const statusRef = useRef<RouteStatus>(status);

  useEffect(() => {
    const nextAssets = buildTempoAgentSpriteAssets();
    if (!nextAssets) {
      return;
    }

    spriteSheetCanvasRef.current = nextAssets.spriteCanvas;
    setAssets(nextAssets);
  }, []);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!assets) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setClipStep((previous) => (previous + 1) % (TEMPO_AGENT_FRAME_COUNT * TEMPO_AGENT_DIRECTION_ROWS.length));
    }, TEMPO_AGENT_FRAME_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [assets]);

  const syncStatus = useEffectEvent((nextStatus: RouteStatus) => {
    const previous = statusRef.current;
    if (
      previous.complete === nextStatus.complete &&
      previous.direction === nextStatus.direction &&
      previous.frameIndex === nextStatus.frameIndex &&
      previous.waypoint === nextStatus.waypoint
    ) {
      return;
    }

    statusRef.current = nextStatus;
    startTransition(() => {
      setStatus(nextStatus);
    });
  });

  const drawRouteScene = useEffectEvent(() => {
    const canvas = routeCanvasRef.current;
    const spriteSheet = spriteSheetCanvasRef.current;
    if (!canvas || !spriteSheet) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    if (
      canvas.width !== Math.floor(ROUTE_WIDTH * devicePixelRatio) ||
      canvas.height !== Math.floor(ROUTE_HEIGHT * devicePixelRatio)
    ) {
      canvas.width = Math.floor(ROUTE_WIDTH * devicePixelRatio);
      canvas.height = Math.floor(ROUTE_HEIGHT * devicePixelRatio);
    }

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, ROUTE_WIDTH, ROUTE_HEIGHT);

    const gradient = context.createLinearGradient(0, 0, ROUTE_WIDTH, ROUTE_HEIGHT);
    gradient.addColorStop(0, "#08131f");
    gradient.addColorStop(1, "#11273a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, ROUTE_WIDTH, ROUTE_HEIGHT);

    context.strokeStyle = "rgba(123, 210, 255, 0.08)";
    context.lineWidth = 1;
    for (let x = 24; x < ROUTE_WIDTH; x += 24) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, ROUTE_HEIGHT);
      context.stroke();
    }
    for (let y = 24; y < ROUTE_HEIGHT; y += 24) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(ROUTE_WIDTH, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(255, 182, 111, 0.22)";
    context.lineWidth = 18;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
    WAYPOINTS.slice(1).forEach((point) => {
      context.lineTo(point.x, point.y);
    });
    context.stroke();

    context.strokeStyle = "#ffd16f";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
    WAYPOINTS.slice(1).forEach((point) => {
      context.lineTo(point.x, point.y);
    });
    context.stroke();

    WAYPOINTS.forEach((point, index) => {
      const isReached = index <= actorRef.current.currentWaypointIndex;
      const isTarget = index === actorRef.current.targetWaypointIndex;

      context.fillStyle = isReached ? "#8ff6a6" : "#0f2535";
      context.strokeStyle = isTarget ? "#fff0bc" : "rgba(148, 224, 255, 0.45)";
      context.lineWidth = isTarget ? 4 : 2;
      context.beginPath();
      context.arc(point.x, point.y, isTarget ? 11 : 8, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = "#dcefff";
      context.font = "600 12px 'IBM Plex Mono', monospace";
      context.fillText(String(index + 1), point.x - 4, point.y - 16);
    });

    context.fillStyle = "rgba(0, 0, 0, 0.26)";
    context.beginPath();
    context.ellipse(actorRef.current.x, actorRef.current.y + 16, 16, 8, 0, 0, Math.PI * 2);
    context.fill();

    const rowIndex = TEMPO_AGENT_DIRECTION_ROWS.indexOf(actorRef.current.direction);
    const drawSize = 54;
    context.imageSmoothingEnabled = false;
    context.drawImage(
      spriteSheet,
      actorRef.current.frameIndex * TEMPO_AGENT_CELL_SIZE,
      rowIndex * TEMPO_AGENT_CELL_SIZE,
      TEMPO_AGENT_CELL_SIZE,
      TEMPO_AGENT_CELL_SIZE,
      Math.round(actorRef.current.x - drawSize / 2),
      Math.round(actorRef.current.y - drawSize * 0.84),
      drawSize,
      drawSize,
    );
  });

  const runRouteFrame = useEffectEvent((timestamp: number) => {
    const actor = actorRef.current;
    const previousTimestamp = lastTimestampRef.current ?? timestamp;
    const deltaMs = Math.min(timestamp - previousTimestamp, 48);
    lastTimestampRef.current = timestamp;

    if (actor.targetWaypointIndex >= WAYPOINTS.length) {
      drawRouteScene();
      syncStatus(getRouteStatus(actor));
      setIsPlaying(false);
      return;
    }

    const target = WAYPOINTS[actor.targetWaypointIndex];
    const dx = target.x - actor.x;
    const dy = target.y - actor.y;
    const distance = Math.hypot(dx, dy);
    const travelDistance = (WALK_SPEED * deltaMs) / 1000;

    if (distance <= travelDistance) {
      actor.x = target.x;
      actor.y = target.y;
      actor.currentWaypointIndex = actor.targetWaypointIndex;
      actor.targetWaypointIndex += 1;
      actor.frameIndex = 0;
      actor.frameElapsedMs = 0;

      if (actor.targetWaypointIndex < WAYPOINTS.length) {
        const nextTarget = WAYPOINTS[actor.targetWaypointIndex];
        actor.direction = getTempoSpriteDirectionFromDelta(nextTarget.x - actor.x, nextTarget.y - actor.y);
      }

      drawRouteScene();
      syncStatus(getRouteStatus(actor));

      if (actor.targetWaypointIndex >= WAYPOINTS.length) {
        setIsPlaying(false);
      } else {
        animationFrameRef.current = window.requestAnimationFrame(runRouteFrame);
      }
    } else {
      const direction = getTempoSpriteDirectionFromDelta(dx, dy);
      actor.direction = direction;

      actor.x += (dx / distance) * travelDistance;
      actor.y += (dy / distance) * travelDistance;

      actor.frameElapsedMs += deltaMs;
      if (actor.frameElapsedMs >= TEMPO_AGENT_FRAME_DURATION_MS) {
        actor.frameElapsedMs -= TEMPO_AGENT_FRAME_DURATION_MS;
        actor.frameIndex = (actor.frameIndex + 1) % TEMPO_AGENT_FRAME_COUNT;
      }

      drawRouteScene();
      syncStatus(getRouteStatus(actor));
      animationFrameRef.current = window.requestAnimationFrame(runRouteFrame);
    }
  });

  useEffect(() => {
    if (!assets) {
      return;
    }

    drawRouteScene();
  }, [assets, drawRouteScene]);

  useEffect(() => {
    if (!isPlaying || !assets) {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      drawRouteScene();
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(runRouteFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [assets, drawRouteScene, isPlaying, runRouteFrame]);

  const handlePlay = () => {
    if (status.complete) {
      const nextActor = createInitialActorState();
      actorRef.current = nextActor;
      const nextStatus = getRouteStatus(nextActor);
      statusRef.current = nextStatus;
      setStatus(nextStatus);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((previous) => !previous);
  };

  const handleReset = () => {
    const nextActor = createInitialActorState();
    actorRef.current = nextActor;
    const nextStatus = getRouteStatus(nextActor);
    statusRef.current = nextStatus;
    setStatus(nextStatus);
    setIsPlaying(false);
    drawRouteScene();
  };

  const clipColumn = clipStep % TEMPO_AGENT_FRAME_COUNT;
  const clipRow = Math.floor(clipStep / TEMPO_AGENT_FRAME_COUNT);
  const clipTransform = `translate(${-clipColumn * CLIP_CELL_SIZE}px, ${-clipRow * CLIP_CELL_SIZE}px)`;

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Sprite Sheet Lab</p>
        <h1>Clipping versus routing, shown with one live pixel character.</h1>
        <p className={styles.summary}>
          The first panel makes the clipping mistake obvious. The second panel reuses the
          same generated sheet on a canvas route, selecting rows from `dx` and `dy`,
          cycling frames on a timer, and stepping through waypoints until the path is done.
        </p>
      </div>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIndex}>01</span>
          <div>
            <h2>Clipping problem</h2>
            <p>
              Both cards move the same sprite sheet. Only the right one clips the viewport
              before applying the frame translation.
            </p>
          </div>
        </div>

        <div className={styles.compareGrid}>
          <article className={styles.compareCard}>
            <div className={styles.cardHeader}>
              <strong>Wrong</strong>
              <span>No clip: the entire sheet leaks into view.</span>
            </div>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>`overflow: visible`</span>
              <span className={styles.badge}>sheet still translates</span>
            </div>
            <div className={styles.demoStage}>
              <div className={styles.viewportGuide}>intended frame window</div>
              {assets ? (
                <img
                  alt="Animated sprite sheet without clipping"
                  className={styles.sheetImage}
                  src={assets.demoUrl}
                  style={{
                    transform: clipTransform,
                    width: `${TEMPO_AGENT_FRAME_COUNT * CLIP_CELL_SIZE}px`,
                  }}
                />
              ) : null}
            </div>
          </article>

          <article className={styles.compareCard}>
            <div className={styles.cardHeader}>
              <strong>Correct</strong>
              <span>Clip first, then reveal one translated frame.</span>
            </div>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>`overflow: hidden`</span>
              <span className={styles.badge}>`transform: translate(...)`</span>
            </div>
            <div className={styles.demoStage}>
              <div className={styles.clipWindow}>
                {assets ? (
                  <img
                    alt="Animated sprite sheet clipped correctly"
                    className={styles.sheetImage}
                    src={assets.demoUrl}
                    style={{
                      transform: clipTransform,
                      width: `${TEMPO_AGENT_FRAME_COUNT * CLIP_CELL_SIZE}px`,
                    }}
                  />
                ) : null}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIndex}>02</span>
          <div>
            <h2>Waypoint route animation</h2>
            <p>
              The canvas moves toward each waypoint, derives direction from the live delta,
              swaps to the matching sprite row, advances walk frames every {TEMPO_AGENT_FRAME_DURATION_MS}
              ms, and continues until the final waypoint is reached.
            </p>
          </div>
        </div>

        <div className={styles.routePanel}>
          <canvas
            ref={routeCanvasRef}
            aria-label="Waypoint route animation canvas"
            className={styles.routeCanvas}
          >
            Canvas route preview
          </canvas>

          <div className={styles.controls}>
            <button className={styles.primaryButton} onClick={handlePlay} type="button">
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button className={styles.secondaryButton} onClick={handleReset} type="button">
              Reset
            </button>
          </div>

          <p aria-live="polite" className={styles.statusLine}>
            Direction <strong>{status.direction}</strong>
            <span>frame {status.frameIndex}</span>
            <span>
              waypoint {status.waypoint}/{WAYPOINTS.length}
            </span>
            {status.complete ? <span>route complete</span> : null}
          </p>
        </div>
      </section>
    </main>
  );
}
