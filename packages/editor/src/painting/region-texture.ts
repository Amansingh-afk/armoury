import type { UVIndex } from "./uv-lookup";
import type { PartRegion } from "../store/editor-store";

/**
 * Build a roughness or metalness texture from per-region overrides.
 * Each pixel gets the override value for its region, or the global default.
 */
export function buildRegionPropertyMap(
  regions: PartRegion[],
  uvIndex: UVIndex,
  width: number,
  height: number,
  property: "roughness" | "metalness",
  globalValue: number,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with global value
  const globalByte = Math.round(globalValue * 255);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = globalByte;
    data[i + 1] = globalByte;
    data[i + 2] = globalByte;
    data[i + 3] = 255;
  }

  // For each region, find its islands' triangles and rasterize with the override value
  for (const region of regions) {
    const value = region.overrides[property];
    if (value == null) continue; // no override, stays global

    const byte = Math.round(value * 255);

    for (const islandId of region.islands) {
      const faces = uvIndex.islandFaces.get(islandId);
      if (!faces) continue;

      for (const faceIdx of faces) {
        const tri = uvIndex.triangles[faceIdx];
        if (!tri) continue;

        // Rasterize this UV triangle with the region's value
        rasterizeTriangle(
          data, width, height,
          tri.uvA.x * width, tri.uvA.y * height,
          tri.uvB.x * width, tri.uvB.y * height,
          tri.uvC.x * width, tri.uvC.y * height,
          byte,
        );
      }
    }
  }

  return new ImageData(data, width, height);
}

/**
 * Apply region color overrides onto a composited texture.
 * For regions with removeTexture, fills their UV triangles with the tint color.
 * For regions with colorTint (but not removeTexture), tints those pixels.
 */
export function applyRegionColorOverrides(
  imageData: ImageData,
  regions: PartRegion[],
  uvIndex: UVIndex,
): void {
  const { data, width, height } = imageData;

  for (const region of regions) {
    const { removeTexture, colorTint } = region.overrides;
    if (!removeTexture && !colorTint) continue;

    const hex = colorTint ?? "#808080";
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);

    for (const islandId of region.islands) {
      const faces = uvIndex.islandFaces.get(islandId);
      if (!faces) continue;

      for (const faceIdx of faces) {
        const tri = uvIndex.triangles[faceIdx];
        if (!tri) continue;

        rasterizeTriangleRGB(
          data, width, height,
          tri.uvA.x * width, tri.uvA.y * height,
          tri.uvB.x * width, tri.uvB.y * height,
          tri.uvC.x * width, tri.uvC.y * height,
          r, g, b, removeTexture ?? false,
        );
      }
    }
  }
}

/** Rasterize a triangle with RGB color. If replace=true, overwrites fully. Otherwise tints. */
function rasterizeTriangleRGB(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  r: number, g: number, b: number,
  replace: boolean,
): void {
  let ax = x0, ay = y0, bx = x1, by = y1, cx = x2, cy = y2;
  if (ay > by) { [ax, ay, bx, by] = [bx, by, ax, ay]; }
  if (ay > cy) { [ax, ay, cx, cy] = [cx, cy, ax, ay]; }
  if (by > cy) { [bx, by, cx, cy] = [cx, cy, bx, by]; }

  const minY = Math.max(0, Math.ceil(ay));
  const maxY = Math.min(height - 1, Math.floor(cy));

  for (let y = minY; y <= maxY; y++) {
    let xLeft: number;
    let xRight: number;

    if (y < by) {
      const tAC = (cy - ay) === 0 ? 0 : (y - ay) / (cy - ay);
      const tAB = (by - ay) === 0 ? 0 : (y - ay) / (by - ay);
      xLeft = ax + (cx - ax) * tAC;
      xRight = ax + (bx - ax) * tAB;
    } else {
      const tAC = (cy - ay) === 0 ? 0 : (y - ay) / (cy - ay);
      const tBC = (cy - by) === 0 ? 0 : (y - by) / (cy - by);
      xLeft = ax + (cx - ax) * tAC;
      xRight = bx + (cx - bx) * tBC;
    }

    if (xLeft > xRight) { [xLeft, xRight] = [xRight, xLeft]; }

    const startX = Math.max(0, Math.ceil(xLeft));
    const endX = Math.min(width - 1, Math.floor(xRight));

    for (let x = startX; x <= endX; x++) {
      const p = (y * width + x) * 4;
      if (replace) {
        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
      } else {
        // Multiply tint
        data[p] = Math.round((data[p] / 255) * (r / 255) * 255);
        data[p + 1] = Math.round((data[p + 1] / 255) * (g / 255) * 255);
        data[p + 2] = Math.round((data[p + 2] / 255) * (b / 255) * 255);
      }
    }
  }
}

/** Scanline rasterize a triangle, filling pixels with a grayscale value */
function rasterizeTriangle(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  byte: number,
): void {
  let ax = x0, ay = y0, bx = x1, by = y1, cx = x2, cy = y2;
  if (ay > by) { [ax, ay, bx, by] = [bx, by, ax, ay]; }
  if (ay > cy) { [ax, ay, cx, cy] = [cx, cy, ax, ay]; }
  if (by > cy) { [bx, by, cx, cy] = [cx, cy, bx, by]; }

  const minY = Math.max(0, Math.ceil(ay));
  const maxY = Math.min(height - 1, Math.floor(cy));

  for (let y = minY; y <= maxY; y++) {
    let xLeft: number;
    let xRight: number;

    if (y < by) {
      const tAC = (cy - ay) === 0 ? 0 : (y - ay) / (cy - ay);
      const tAB = (by - ay) === 0 ? 0 : (y - ay) / (by - ay);
      xLeft = ax + (cx - ax) * tAC;
      xRight = ax + (bx - ax) * tAB;
    } else {
      const tAC = (cy - ay) === 0 ? 0 : (y - ay) / (cy - ay);
      const tBC = (cy - by) === 0 ? 0 : (y - by) / (cy - by);
      xLeft = ax + (cx - ax) * tAC;
      xRight = bx + (cx - bx) * tBC;
    }

    if (xLeft > xRight) { [xLeft, xRight] = [xRight, xLeft]; }

    const startX = Math.max(0, Math.ceil(xLeft));
    const endX = Math.min(width - 1, Math.floor(xRight));

    for (let x = startX; x <= endX; x++) {
      const p = (y * width + x) * 4;
      data[p] = byte;
      data[p + 1] = byte;
      data[p + 2] = byte;
      // alpha already 255
    }
  }
}
