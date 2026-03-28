import type { BufferGeometry } from "three";

export interface UVTriangle {
	uvA: { x: number; y: number };
	uvB: { x: number; y: number };
	uvC: { x: number; y: number };
	faceIndex: number;
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface UVIndex {
	triangles: UVTriangle[];
	/** faceIndex → islandId */
	islandOf: number[];
	/** islandId → list of face indices */
	islandFaces: Map<number, number[]>;
}

export function buildUVIndex(geometry: BufferGeometry): UVIndex {
	const uvAttr = geometry.getAttribute("uv");
	const index = geometry.index;
	if (!uvAttr || !index) return { triangles: [], islandOf: [], islandFaces: new Map() };

	const faceCount = index.count / 3;
	const triangles: UVTriangle[] = new Array(faceCount);

	// Build triangles array
	for (let f = 0; f < faceCount; f++) {
		const i = f * 3;
		const a = index.getX(i);
		const b = index.getX(i + 1);
		const c = index.getX(i + 2);

		const uvA = { x: uvAttr.getX(a), y: uvAttr.getY(a) };
		const uvB = { x: uvAttr.getX(b), y: uvAttr.getY(b) };
		const uvC = { x: uvAttr.getX(c), y: uvAttr.getY(c) };

		triangles[f] = {
			uvA,
			uvB,
			uvC,
			faceIndex: f,
			minX: Math.min(uvA.x, uvB.x, uvC.x),
			minY: Math.min(uvA.y, uvB.y, uvC.y),
			maxX: Math.max(uvA.x, uvB.x, uvC.x),
			maxY: Math.max(uvA.y, uvB.y, uvC.y),
		};
	}

	// Build UV islands using union-find on shared UV vertex indices
	const parent = new Int32Array(faceCount);
	const rank = new Int32Array(faceCount);
	for (let i = 0; i < faceCount; i++) parent[i] = i;

	function find(x: number): number {
		while (parent[x] !== x) {
			parent[x] = parent[parent[x]];
			x = parent[x];
		}
		return x;
	}

	function union(a: number, b: number): void {
		const ra = find(a);
		const rb = find(b);
		if (ra === rb) return;
		if (rank[ra] < rank[rb]) {
			parent[ra] = rb;
		} else if (rank[ra] > rank[rb]) {
			parent[rb] = ra;
		} else {
			parent[rb] = ra;
			rank[ra]++;
		}
	}

	// Map UV vertex index → face indices that use it
	// Faces sharing a UV vertex index are in the same island
	const vertexToFace = new Map<number, number>();
	for (let f = 0; f < faceCount; f++) {
		const i = f * 3;
		for (let v = 0; v < 3; v++) {
			const vi = index.getX(i + v);
			const existing = vertexToFace.get(vi);
			if (existing !== undefined) {
				union(f, existing);
			} else {
				vertexToFace.set(vi, f);
			}
		}
	}

	// Build island mappings
	const islandOf = new Array<number>(faceCount);
	const islandFaces = new Map<number, number[]>();
	for (let f = 0; f < faceCount; f++) {
		const island = find(f);
		islandOf[f] = island;
		const list = islandFaces.get(island);
		if (list) {
			list.push(f);
		} else {
			islandFaces.set(island, [f]);
		}
	}

	return { triangles, islandOf, islandFaces };
}

/** Find the face index at a UV coordinate using barycentric test */
export function findFaceAtUV(uvX: number, uvY: number, triangles: UVTriangle[]): number {
	for (let i = 0; i < triangles.length; i++) {
		const t = triangles[i];
		// Fast bounding box rejection
		if (uvX < t.minX || uvX > t.maxX || uvY < t.minY || uvY > t.maxY) continue;
		// Barycentric coordinate test
		if (pointInTriangle(uvX, uvY, t.uvA.x, t.uvA.y, t.uvB.x, t.uvB.y, t.uvC.x, t.uvC.y)) {
			return t.faceIndex;
		}
	}
	return -1;
}

/** Find all face indices in the island at a UV coordinate */
export function findIslandAtUV(uvX: number, uvY: number, uvIndex: UVIndex): number[] {
	const face = findFaceAtUV(uvX, uvY, uvIndex.triangles);
	if (face === -1) return [];
	const islandId = uvIndex.islandOf[face];
	return uvIndex.islandFaces.get(islandId) ?? [];
}

function pointInTriangle(
	px: number,
	py: number,
	ax: number,
	ay: number,
	bx: number,
	by: number,
	cx: number,
	cy: number,
): boolean {
	const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
	const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
	const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
	const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
	const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
	return !(hasNeg && hasPos);
}
