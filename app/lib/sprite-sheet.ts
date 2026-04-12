"use client";

export type ExtractSpriteSheetFramesOptions = {
  src: string;
  columns: number;
  rows: number;
  alphaThreshold?: number;
  fitMode?: "cell" | "tight";
  useBottomAnchor?: boolean;
  paddingX?: number;
  paddingY?: number;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load sprite sheet: ${src}`));
    image.src = src;
  });

export const extractSpriteSheetFrames = async ({
  src,
  columns,
  rows,
  alphaThreshold = 18,
  fitMode = "tight",
  useBottomAnchor = true,
  paddingX = 14,
  paddingY = 10,
}: ExtractSpriteSheetFramesOptions): Promise<string[]> => {
  if (typeof window === "undefined") {
    return [];
  }

  const image = await loadImage(src);
  const sheetWidth = image.naturalWidth || image.width;
  const sheetHeight = image.naturalHeight || image.height;
  if (sheetWidth <= 0 || sheetHeight <= 0 || columns <= 0 || rows <= 0) {
    return [];
  }

  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = sheetWidth;
  analysisCanvas.height = sheetHeight;
  const analysisContext = analysisCanvas.getContext("2d", { willReadFrequently: true });
  if (!analysisContext) {
    return [];
  }

  analysisContext.drawImage(image, 0, 0);
  const pixels = analysisContext.getImageData(0, 0, sheetWidth, sheetHeight).data;
  if (sheetWidth / columns <= 0 || sheetHeight / rows <= 0) {
    return [];
  }

  const boxes: Array<{
    anchorMaxX: number;
    anchorMinX: number;
    drawH: number;
    drawW: number;
    drawX: number;
    drawY: number;
  }> = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const startX = Math.round((column * sheetWidth) / columns);
      const startY = Math.round((row * sheetHeight) / rows);
      const endX = Math.round(((column + 1) * sheetWidth) / columns) - 1;
      const endY = Math.round(((row + 1) * sheetHeight) / rows) - 1;
      const currentCellHeight = endY - startY + 1;

      let minX = endX + 1;
      let maxX = startX - 1;
      let minY = endY + 1;
      let maxY = startY - 1;

      for (let y = startY; y <= endY; y += 1) {
        for (let x = startX; x <= endX; x += 1) {
          const alpha = pixels[(y * sheetWidth + x) * 4 + 3];
          if (alpha > alphaThreshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const hasOpaquePixels = !(maxX < minX || maxY < minY);
      const sourceX = fitMode === "cell" || !hasOpaquePixels ? startX : minX;
      const sourceY = fitMode === "cell" || !hasOpaquePixels ? startY : minY;
      const sourceW = fitMode === "cell" || !hasOpaquePixels ? endX - startX + 1 : maxX - minX + 1;
      const sourceH = fitMode === "cell" || !hasOpaquePixels ? endY - startY + 1 : maxY - minY + 1;

      let anchorMinX = Number.POSITIVE_INFINITY;
      let anchorMaxX = Number.NEGATIVE_INFINITY;
      if (useBottomAnchor && hasOpaquePixels) {
        const bottomBandHeight = Math.max(8, Math.floor(currentCellHeight * 0.08));
        const anchorBandStartY = Math.max(startY, maxY - bottomBandHeight + 1);
        for (let x = startX; x <= endX; x += 1) {
          let hasOpaquePixelInBand = false;
          for (let y = anchorBandStartY; y <= maxY; y += 1) {
            const alpha = pixels[(y * sheetWidth + x) * 4 + 3];
            if (alpha > alphaThreshold) {
              hasOpaquePixelInBand = true;
              break;
            }
          }
          if (hasOpaquePixelInBand) {
            if (x < anchorMinX) anchorMinX = x;
            if (x > anchorMaxX) anchorMaxX = x;
          }
        }
      }

      boxes.push({
        anchorMaxX,
        anchorMinX,
        drawH: sourceH,
        drawW: sourceW,
        drawX: sourceX,
        drawY: sourceY,
      });
    }
  }

  if (boxes.length === 0) {
    return [];
  }

  const anchorOffsetXs = boxes.map((box) => {
    if (!useBottomAnchor) {
      return box.drawW / 2;
    }

    const anchorX = Number.isFinite(box.anchorMinX)
      ? (box.anchorMinX + box.anchorMaxX) / 2
      : box.drawX + box.drawW / 2;

    return anchorX - box.drawX;
  });
  const maxLeftExtent = Math.max(...anchorOffsetXs);
  const maxRightExtent = Math.max(
    ...boxes.map((box, index) => box.drawW - anchorOffsetXs[index]),
  );
  const outputWidth = Math.ceil(maxLeftExtent + maxRightExtent + paddingX);
  const outputHeight = Math.max(...boxes.map((box) => box.drawH)) + paddingY;
  const anchorTargetX = Math.round(maxLeftExtent + paddingX / 2);

  return boxes.map((box, index) => {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = outputWidth;
    frameCanvas.height = outputHeight;
    const frameContext = frameCanvas.getContext("2d");
    if (!frameContext) {
      return "";
    }

    let drawX = Math.floor((outputWidth - box.drawW) / 2);
    if (useBottomAnchor) {
      drawX = Math.round(anchorTargetX - anchorOffsetXs[index]);
    }

    const drawY = outputHeight - box.drawH;
    frameContext.clearRect(0, 0, outputWidth, outputHeight);
    frameContext.drawImage(
      analysisCanvas,
      box.drawX,
      box.drawY,
      box.drawW,
      box.drawH,
      drawX,
      drawY,
      box.drawW,
      box.drawH,
    );

    return frameCanvas.toDataURL("image/png");
  }).filter(Boolean);
};
