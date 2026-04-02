import type { BufferGeometry } from "three";

/**
 * Build a pixel ownership map: for each pixel in the texture,
 * stores the index of the mesh that owns it (-1 = no owner).
 */
export function buildUVOwnershipMap(
  meshGeometries: Array<{ name: string; geometry: BufferGeometry }>,
  width: number,
  height: number,
): Int16Array {
  const map = new Int16Array(width * height).fill(-1);

  for (let meshIdx = 0; meshIdx < meshGeometries.length; meshIdx++) {
    const { geometry } = meshGeometries[meshIdx];
    const uvAttr = geometry.getAttribute("uv");
    const index = geometry.index;
    if (!uvAttr || !index) continue;

    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);

      const ax = uvAttr.getX(a) * width;
      const ay = uvAttr.getY(a) * height;
      const bx = uvAttr.getX(b) * width;
      const by = uvAttr.getY(b) * height;
      const cx = uvAttr.getX(c) * width;
      const cy = uvAttr.getY(c) * height;

      rasterizeTriangle(map, width, height, ax, ay, bx, by, cx, cy, meshIdx);
    }
  }

  return map;
}

/** Rasterize a single triangle into the ownership map using scanline fill */
function rasterizeTriangle(
  map: Int16Array,
  width: number,
  height: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  value: number,
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
      map[y * width + x] = value;
    }
  }
}
