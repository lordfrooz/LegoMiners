"use client";

export type TempoSpriteDirection = "down" | "left" | "right" | "up";

export type TempoAgentSpriteAssets = {
  demoUrl: string;
  spriteCanvas: HTMLCanvasElement;
  spriteSheetUrl: string;
};

export const TEMPO_AGENT_CELL_SIZE = 32;
export const TEMPO_AGENT_FRAME_COUNT = 4;
export const TEMPO_AGENT_FRAME_DURATION_MS = 140;
export const TEMPO_AGENT_DIRECTION_ROWS: TempoSpriteDirection[] = ["down", "left", "right", "up"];

const paintPixel = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  pixelSize: number,
  offsetX: number,
  offsetY: number,
) => {
  context.fillStyle = color;
  context.fillRect(
    offsetX + x * pixelSize,
    offsetY + y * pixelSize,
    width * pixelSize,
    height * pixelSize,
  );
};

const drawDirectionalSprite = (
  context: CanvasRenderingContext2D,
  direction: TempoSpriteDirection,
  frameIndex: number,
  offsetX: number,
  offsetY: number,
) => {
  const pixelSize = 2;
  const skin = "#ffd39a";
  const outline = "#12212f";
  const visor = "#91ecff";
  const coat = "#ff7f50";
  const coatShade = "#d8633d";
  const boot = "#3b4255";
  const trim = "#8ff6a6";
  const armSwing = [0, -1, 0, 1][frameIndex] ?? 0;
  const legSwing = [-1, 1, 0, -1][frameIndex] ?? 0;

  paintPixel(context, 5, 1, 6, 5, outline, pixelSize, offsetX, offsetY);
  paintPixel(context, 5, 2, 6, 4, skin, pixelSize, offsetX, offsetY);
  paintPixel(context, 6, 6, 4, 1, outline, pixelSize, offsetX, offsetY);

  if (direction === "down") {
    paintPixel(context, 6, 3, 1, 1, outline, pixelSize, offsetX, offsetY);
    paintPixel(context, 9, 3, 1, 1, outline, pixelSize, offsetX, offsetY);
    paintPixel(context, 4, 7, 8, 5, coat, pixelSize, offsetX, offsetY);
    paintPixel(context, 5, 8, 6, 3, coatShade, pixelSize, offsetX, offsetY);
    paintPixel(context, 3 + armSwing, 7, 1, 5, skin, pixelSize, offsetX, offsetY);
    paintPixel(context, 12 - armSwing, 7, 1, 5, skin, pixelSize, offsetX, offsetY);
    paintPixel(context, 5 - legSwing, 12, 2, 3, boot, pixelSize, offsetX, offsetY);
    paintPixel(context, 9 + legSwing, 12, 2, 3, boot, pixelSize, offsetX, offsetY);
    paintPixel(context, 6, 7, 4, 1, trim, pixelSize, offsetX, offsetY);
    return;
  }

  if (direction === "up") {
    paintPixel(context, 5, 2, 6, 2, outline, pixelSize, offsetX, offsetY);
    paintPixel(context, 4, 7, 8, 5, coat, pixelSize, offsetX, offsetY);
    paintPixel(context, 5, 8, 6, 3, coatShade, pixelSize, offsetX, offsetY);
    paintPixel(context, 6, 7, 4, 1, trim, pixelSize, offsetX, offsetY);
    paintPixel(context, 3 - armSwing, 7, 1, 5, skin, pixelSize, offsetX, offsetY);
    paintPixel(context, 12 + armSwing, 7, 1, 5, skin, pixelSize, offsetX, offsetY);
    paintPixel(context, 5 + legSwing, 12, 2, 3, boot, pixelSize, offsetX, offsetY);
    paintPixel(context, 9 - legSwing, 12, 2, 3, boot, pixelSize, offsetX, offsetY);
    return;
  }

  const facingRight = direction === "right";
  const headX = facingRight ? 6 : 5;
  const eyeX = facingRight ? 9 : 6;
  const armX = facingRight ? 10 + armSwing : 5 - armSwing;
  const frontLegX = facingRight ? 9 + legSwing : 5 - legSwing;
  const backLegX = facingRight ? 6 - legSwing : 8 + legSwing;

  paintPixel(context, headX, 2, 5, 4, skin, pixelSize, offsetX, offsetY);
  paintPixel(context, eyeX, 3, 1, 1, visor, pixelSize, offsetX, offsetY);
  paintPixel(context, 6, 7, 6, 5, coat, pixelSize, offsetX, offsetY);
  paintPixel(context, 7, 8, 4, 3, coatShade, pixelSize, offsetX, offsetY);
  paintPixel(context, armX, 7, 1, 5, skin, pixelSize, offsetX, offsetY);
  paintPixel(context, backLegX, 12, 2, 3, boot, pixelSize, offsetX, offsetY);
  paintPixel(context, frontLegX, 12, 2, 3, boot, pixelSize, offsetX, offsetY);
  paintPixel(context, 7, 7, 3, 1, trim, pixelSize, offsetX, offsetY);
};

export const getTempoSpriteDirectionFromDelta = (dx: number, dy: number): TempoSpriteDirection => {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }

  return dy >= 0 ? "down" : "up";
};

export const getTempoSpriteRowIndex = (direction: TempoSpriteDirection) =>
  TEMPO_AGENT_DIRECTION_ROWS.indexOf(direction);

export const buildTempoAgentSpriteAssets = (): TempoAgentSpriteAssets | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = TEMPO_AGENT_CELL_SIZE * TEMPO_AGENT_FRAME_COUNT;
  spriteCanvas.height = TEMPO_AGENT_CELL_SIZE * TEMPO_AGENT_DIRECTION_ROWS.length;

  const spriteContext = spriteCanvas.getContext("2d");
  if (!spriteContext) {
    return null;
  }

  spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
  spriteContext.imageSmoothingEnabled = false;

  TEMPO_AGENT_DIRECTION_ROWS.forEach((direction, rowIndex) => {
    for (let columnIndex = 0; columnIndex < TEMPO_AGENT_FRAME_COUNT; columnIndex += 1) {
      drawDirectionalSprite(
        spriteContext,
        direction,
        columnIndex,
        columnIndex * TEMPO_AGENT_CELL_SIZE,
        rowIndex * TEMPO_AGENT_CELL_SIZE + 2,
      );
    }
  });

  const demoCanvas = document.createElement("canvas");
  demoCanvas.width = spriteCanvas.width;
  demoCanvas.height = spriteCanvas.height;
  const demoContext = demoCanvas.getContext("2d");
  if (!demoContext) {
    return null;
  }

  demoContext.fillStyle = "#07131f";
  demoContext.fillRect(0, 0, demoCanvas.width, demoCanvas.height);
  demoContext.imageSmoothingEnabled = false;

  for (let rowIndex = 0; rowIndex < TEMPO_AGENT_DIRECTION_ROWS.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < TEMPO_AGENT_FRAME_COUNT; columnIndex += 1) {
      const cellX = columnIndex * TEMPO_AGENT_CELL_SIZE;
      const cellY = rowIndex * TEMPO_AGENT_CELL_SIZE;

      demoContext.fillStyle = (columnIndex + rowIndex) % 2 === 0 ? "#0d2030" : "#091928";
      demoContext.fillRect(cellX, cellY, TEMPO_AGENT_CELL_SIZE, TEMPO_AGENT_CELL_SIZE);
      demoContext.strokeStyle = "rgba(170, 235, 255, 0.15)";
      demoContext.strokeRect(cellX + 0.5, cellY + 0.5, TEMPO_AGENT_CELL_SIZE - 1, TEMPO_AGENT_CELL_SIZE - 1);
    }
  }

  demoContext.drawImage(spriteCanvas, 0, 0);

  return {
    demoUrl: demoCanvas.toDataURL("image/png"),
    spriteCanvas,
    spriteSheetUrl: spriteCanvas.toDataURL("image/png"),
  };
};
