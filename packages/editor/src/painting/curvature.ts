import type { BufferGeometry } from "three";

/**
 * Compute per-vertex curvature from mesh geometry.
 * Curvature = average angular deviation between normals of adjacent faces
 * sharing each vertex. High values = sharp edges/corners.
 * Returns Float32Array(vertexCount) normalized to [0, 1].
 */
export function computeVertexCurvature(geometry: BufferGeometry): Float32Array {
	const posAttr = geometry.getAttribute("position");
	const index = geometry.index;
	if (!posAttr || !index) return new Float32Array(0);

	const vertexCount = posAttr.count;
	const faceCount = index.count / 3;

	// Compute per-face normals
	const faceNormals = new Float32Array(faceCount * 3);
	for (let f = 0; f < faceCount; f++) {
		const i = f * 3;
		const ai = index.getX(i);
		const bi = index.getX(i + 1);
		const ci = index.getX(i + 2);

		const ax = posAttr.getX(ai), ay = posAttr.getY(ai), az = posAttr.getZ(ai);
		const bx = posAttr.getX(bi), by = posAttr.getY(bi), bz = posAttr.getZ(bi);
		const cx = posAttr.getX(ci), cy = posAttr.getY(ci), cz = posAttr.getZ(ci);

		// Edge vectors
		const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
		const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;

		// Cross product
		let nx = e1y * e2z - e1z * e2y;
		let ny = e1z * e2x - e1x * e2z;
		let nz = e1x * e2y - e1y * e2x;

		// Normalize
		const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
		if (len > 0) { nx /= len; ny /= len; nz /= len; }

		faceNormals[f * 3] = nx;
		faceNormals[f * 3 + 1] = ny;
		faceNormals[f * 3 + 2] = nz;
	}

	// Build vertex → face adjacency
	const vertexFaces: number[][] = new Array(vertexCount);
	for (let v = 0; v < vertexCount; v++) vertexFaces[v] = [];

	for (let f = 0; f < faceCount; f++) {
		const i = f * 3;
		vertexFaces[index.getX(i)].push(f);
		vertexFaces[index.getX(i + 1)].push(f);
		vertexFaces[index.getX(i + 2)].push(f);
	}

	// Compute curvature per vertex
	const curvature = new Float32Array(vertexCount);
	let maxCurv = 0;

	for (let v = 0; v < vertexCount; v++) {
		const faces = vertexFaces[v];
		if (faces.length < 2) continue;

		let totalAngle = 0;
		let pairCount = 0;

		for (let i = 0; i < faces.length; i++) {
			for (let j = i + 1; j < faces.length; j++) {
				const fi = faces[i] * 3;
				const fj = faces[j] * 3;

				// Dot product of face normals
				const dot =
					faceNormals[fi] * faceNormals[fj] +
					faceNormals[fi + 1] * faceNormals[fj + 1] +
					faceNormals[fi + 2] * faceNormals[fj + 2];

				// Angle between normals (clamped for numerical stability)
				totalAngle += Math.acos(Math.max(-1, Math.min(1, dot)));
				pairCount++;
			}
		}

		if (pairCount > 0) {
			curvature[v] = totalAngle / pairCount;
			if (curvature[v] > maxCurv) maxCurv = curvature[v];
		}
	}

	// Normalize to [0, 1] using power curve to spread values
	if (maxCurv > 0) {
		// Use 95th percentile as effective max to prevent outliers from compressing values
		const sorted = Array.from(curvature).filter((v) => v > 0).sort((a, b) => a - b);
		const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : maxCurv;
		const effectiveMax = Math.max(p95, maxCurv * 0.1);

		for (let v = 0; v < vertexCount; v++) {
			curvature[v] = Math.min(1, curvature[v] / effectiveMax);
			// Power curve to spread midrange values
			curvature[v] = Math.sqrt(curvature[v]);
		}
	}

	return curvature;
}

/**
 * Bake per-vertex curvature into UV space using barycentric interpolation.
 * Returns Float32Array(width * height) with curvature values in [0, 1].
 */
export function bakeCurvatureToUV(
	geometry: BufferGeometry,
	vertexCurvature: Float32Array,
	width: number,
	height: number,
): Float32Array {
	const uvAttr = geometry.getAttribute("uv");
	const index = geometry.index;
	if (!uvAttr || !index) return new Float32Array(width * height);

	const output = new Float32Array(width * height);
	const faceCount = index.count / 3;

	for (let f = 0; f < faceCount; f++) {
		const i = f * 3;
		const ai = index.getX(i);
		const bi = index.getX(i + 1);
		const ci = index.getX(i + 2);

		// UV coords
		const uA = uvAttr.getX(ai) * width;
		const vA = uvAttr.getY(ai) * height;
		const uB = uvAttr.getX(bi) * width;
		const vB = uvAttr.getY(bi) * height;
		const uC = uvAttr.getX(ci) * width;
		const vC = uvAttr.getY(ci) * height;

		// Curvature at each vertex
		const cA = vertexCurvature[ai];
		const cB = vertexCurvature[bi];
		const cC = vertexCurvature[ci];

		// Scanline rasterize with barycentric interpolation
		rasterizeTriangleBarycentric(
			output, width, height,
			uA, vA, cA,
			uB, vB, cB,
			uC, vC, cC,
		);
	}

	return output;
}

/** Scanline rasterize a triangle, interpolating a value using barycentric coordinates */
function rasterizeTriangleBarycentric(
	output: Float32Array,
	width: number,
	height: number,
	x0: number, y0: number, v0: number,
	x1: number, y1: number, v1: number,
	x2: number, y2: number, v2: number,
): void {
	// Sort vertices by Y
	let ax = x0, ay = y0, av = v0;
	let bx = x1, by = y1, bv = v1;
	let cx = x2, cy = y2, cv = v2;
	if (ay > by) { [ax, ay, av, bx, by, bv] = [bx, by, bv, ax, ay, av]; }
	if (ay > cy) { [ax, ay, av, cx, cy, cv] = [cx, cy, cv, ax, ay, av]; }
	if (by > cy) { [bx, by, bv, cx, cy, cv] = [cx, cy, cv, bx, by, bv]; }

	const minY = Math.max(0, Math.ceil(ay));
	const maxY = Math.min(height - 1, Math.floor(cy));

	// Precompute for barycentric
	const denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
	if (Math.abs(denom) < 1e-10) return; // degenerate triangle
	const invDenom = 1 / denom;

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
			// Barycentric coordinates
			const w0 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) * invDenom;
			const w1 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) * invDenom;
			const w2 = 1 - w0 - w1;

			// Interpolate curvature
			const val = w0 * av + w1 * bv + w2 * cv;
			const idx = y * width + x;
			// Take max in case of overlapping triangles
			if (val > output[idx]) output[idx] = val;
		}
	}
}
