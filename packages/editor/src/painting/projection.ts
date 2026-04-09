import { Vector3 } from "three";
import type { BufferGeometry } from "three";
import type { TextureCanvas } from "./texture-canvas";

export type ProjectionAxis = "front" | "back" | "left" | "right" | "top" | "bottom";

const PROJECTION_NORMALS: Record<ProjectionAxis, [number, number, number]> = {
	front: [0, 0, 1],
	back: [0, 0, -1],
	right: [1, 0, 0],
	left: [-1, 0, 0],
	top: [0, 1, 0],
	bottom: [0, -1, 0],
};

/**
 * Project an image onto a UV texture using orthographic projection from a fixed axis.
 * Only renders faces that roughly face the projection direction (dot product > 0).
 */
export function projectImageToTexture(
	target: TextureCanvas,
	geometry: BufferGeometry,
	image: ImageBitmap,
	axis: ProjectionAxis = "front",
): void {
	const indexAttr = geometry.index;
	const posAttr = geometry.getAttribute("position");
	const uvAttr = geometry.getAttribute("uv");
	if (!indexAttr || !posAttr || !uvAttr) return;

	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	target.clear();

	const project = makeProjectionFn(axis);
	const [pnx, pny, pnz] = PROJECTION_NORMALS[axis];

	let minA = Number.POSITIVE_INFINITY,
		maxA = Number.NEGATIVE_INFINITY;
	let minB = Number.POSITIVE_INFINITY,
		maxB = Number.NEGATIVE_INFINITY;

	for (let i = 0; i < posAttr.count; i++) {
		const [a, b] = project(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
		if (a < minA) minA = a;
		if (a > maxA) maxA = a;
		if (b < minB) minB = b;
		if (b > maxB) maxB = b;
	}

	const rangeA = maxA - minA || 1;
	const rangeB = maxB - minB || 1;
	const imgW = image.width;
	const imgH = image.height;
	const faceCount = indexAttr.count / 3;

	const edge1 = new Vector3();
	const edge2 = new Vector3();
	const faceNormal = new Vector3();
	const p0 = new Vector3();
	const p1 = new Vector3();
	const p2 = new Vector3();

	for (let f = 0; f < faceCount; f++) {
		const i0 = indexAttr.getX(f * 3);
		const i1 = indexAttr.getX(f * 3 + 1);
		const i2 = indexAttr.getX(f * 3 + 2);

		p0.set(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
		p1.set(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
		p2.set(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

		edge1.subVectors(p1, p0);
		edge2.subVectors(p2, p0);
		faceNormal.crossVectors(edge1, edge2);
		const dot = faceNormal.x * pnx + faceNormal.y * pny + faceNormal.z * pnz;
		if (dot <= 0) continue;

		const ux0 = uvAttr.getX(i0) * w;
		const uy0 = (1 - uvAttr.getY(i0)) * h;
		const ux1 = uvAttr.getX(i1) * w;
		const uy1 = (1 - uvAttr.getY(i1)) * h;
		const ux2 = uvAttr.getX(i2) * w;
		const uy2 = (1 - uvAttr.getY(i2)) * h;

		const [a0, b0] = project(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
		const [a1, b1] = project(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
		const [a2, b2] = project(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

		const ix0 = ((a0 - minA) / rangeA) * imgW;
		const iy0 = (1 - (b0 - minB) / rangeB) * imgH;
		const ix1 = ((a1 - minA) / rangeA) * imgW;
		const iy1 = (1 - (b1 - minB) / rangeB) * imgH;
		const ix2 = ((a2 - minA) / rangeA) * imgW;
		const iy2 = (1 - (b2 - minB) / rangeB) * imgH;

		drawTriangleAffine(ctx, image, ix0, iy0, ix1, iy1, ix2, iy2, ux0, uy0, ux1, uy1, ux2, uy2);
	}
}

/** Draw a textured triangle using affine transform: image coords → UV coords */
function drawTriangleAffine(
	ctx: OffscreenCanvasRenderingContext2D,
	image: ImageBitmap,
	ix0: number,
	iy0: number,
	ix1: number,
	iy1: number,
	ix2: number,
	iy2: number,
	ux0: number,
	uy0: number,
	ux1: number,
	uy1: number,
	ux2: number,
	uy2: number,
): void {
	const dix10 = ix0 - ix1,
		diy10 = iy0 - iy1;
	const dix20 = ix0 - ix2,
		diy20 = iy0 - iy2;
	const dux10 = ux0 - ux1,
		duy10 = uy0 - uy1;
	const dux20 = ux0 - ux2,
		duy20 = uy0 - uy2;

	const det = dix10 * diy20 - dix20 * diy10;
	if (Math.abs(det) < 1e-10) return;

	const ma = (dux10 * diy20 - dux20 * diy10) / det;
	const mc = (dix10 * dux20 - dix20 * dux10) / det;
	const me = ux0 - ma * ix0 - mc * iy0;

	const mb = (duy10 * diy20 - duy20 * diy10) / det;
	const md = (dix10 * duy20 - dix20 * duy10) / det;
	const mf = uy0 - mb * ix0 - md * iy0;

	ctx.save();
	ctx.beginPath();
	ctx.moveTo(ux0, uy0);
	ctx.lineTo(ux1, uy1);
	ctx.lineTo(ux2, uy2);
	ctx.closePath();
	ctx.clip();

	ctx.setTransform(ma, mb, mc, md, me, mf);
	ctx.drawImage(image, 0, 0);

	ctx.restore();
}

function makeProjectionFn(
	axis: ProjectionAxis,
): (x: number, y: number, z: number) => [number, number] {
	switch (axis) {
		case "front":
			return (x, y) => [x, y];
		case "back":
			return (x, y) => [-x, y];
		case "right":
			return (_x, y, z) => [z, y];
		case "left":
			return (_x, y, z) => [-z, y];
		case "top":
			return (x, _y, z) => [x, z];
		case "bottom":
			return (x, _y, z) => [x, -z];
	}
}

export interface DecalParams {
	/** UV coordinate on the mesh where the decal is centered */
	uvX: number;
	uvY: number;
	/** Scale as a fraction of the model's max dimension (0.2 = 20% of model size) */
	scale: number;
	/** Rotation in radians around the surface normal */
	rotation: number;
}

/**
 * Project a decal image onto a UV texture from the surface normal at a given UV position.
 * The image is projected like a real sticker — it spans across UV islands seamlessly.
 */
export function projectDecalToTexture(
	target: TextureCanvas,
	geometry: BufferGeometry,
	image: ImageBitmap,
	params: DecalParams,
): void {
	const indexAttr = geometry.index;
	const posAttr = geometry.getAttribute("position");
	const uvAttr = geometry.getAttribute("uv");
	const normalAttr = geometry.getAttribute("normal");
	if (!indexAttr || !posAttr || !uvAttr) return;

	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	target.clear();

	// Compute model bounding box to derive decal size
	geometry.computeBoundingBox();
	const bbox = geometry.boundingBox;
	if (!bbox) return;
	const modelSize = bbox.getSize(new Vector3());
	const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
	const hs = maxDim * params.scale * 0.5;

	// Find the face at the decal center UV
	const centerFace = findFaceAtUVBary(params.uvX, params.uvY, indexAttr, uvAttr);
	if (!centerFace) return;

	// Interpolate 3D position at the UV center
	const { i0, i1, i2, baryU, baryV } = centerFace;
	const baryW = 1 - baryU - baryV;

	const centerPos = new Vector3(
		posAttr.getX(i0) * baryW + posAttr.getX(i1) * baryV + posAttr.getX(i2) * baryU,
		posAttr.getY(i0) * baryW + posAttr.getY(i1) * baryV + posAttr.getY(i2) * baryU,
		posAttr.getZ(i0) * baryW + posAttr.getZ(i1) * baryV + posAttr.getZ(i2) * baryU,
	);

	// Get surface normal (from attribute or compute from face)
	let normal: Vector3;
	if (normalAttr) {
		normal = new Vector3(
			normalAttr.getX(i0) * baryW + normalAttr.getX(i1) * baryV + normalAttr.getX(i2) * baryU,
			normalAttr.getY(i0) * baryW + normalAttr.getY(i1) * baryV + normalAttr.getY(i2) * baryU,
			normalAttr.getZ(i0) * baryW + normalAttr.getZ(i1) * baryV + normalAttr.getZ(i2) * baryU,
		).normalize();
	} else {
		const e1 = new Vector3().subVectors(
			new Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1)),
			new Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0)),
		);
		const e2 = new Vector3().subVectors(
			new Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2)),
			new Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0)),
		);
		normal = new Vector3().crossVectors(e1, e2).normalize();
	}

	// Build tangent frame: right and up vectors on the surface
	// Pick a reference vector that's not parallel to the normal
	const ref = Math.abs(normal.y) < 0.99 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
	const right = new Vector3().crossVectors(ref, normal).normalize();
	const up = new Vector3().crossVectors(normal, right).normalize();

	// Apply rotation around the normal
	if (params.rotation !== 0) {
		const cos = Math.cos(params.rotation);
		const sin = Math.sin(params.rotation);
		const rx = right.x, ry = right.y, rz = right.z;
		const ux = up.x, uy = up.y, uz = up.z;
		right.set(rx * cos + ux * sin, ry * cos + uy * sin, rz * cos + uz * sin);
		up.set(-rx * sin + ux * cos, -ry * sin + uy * cos, -rz * sin + uz * cos);
	}

	const imgW = image.width;
	const imgH = image.height;
	const aspect = imgH / imgW;
	const hsY = hs * aspect;

	const faceCount = indexAttr.count / 3;
	const edge1 = new Vector3();
	const edge2 = new Vector3();
	const faceNormal = new Vector3();

	for (let f = 0; f < faceCount; f++) {
		const fi0 = indexAttr.getX(f * 3);
		const fi1 = indexAttr.getX(f * 3 + 1);
		const fi2 = indexAttr.getX(f * 3 + 2);

		const p0x = posAttr.getX(fi0), p0y = posAttr.getY(fi0), p0z = posAttr.getZ(fi0);
		const p1x = posAttr.getX(fi1), p1y = posAttr.getY(fi1), p1z = posAttr.getZ(fi1);
		const p2x = posAttr.getX(fi2), p2y = posAttr.getY(fi2), p2z = posAttr.getZ(fi2);

		// Back-face culling: skip faces pointing away from the projector
		edge1.set(p1x - p0x, p1y - p0y, p1z - p0z);
		edge2.set(p2x - p0x, p2y - p0y, p2z - p0z);
		faceNormal.crossVectors(edge1, edge2);
		if (faceNormal.dot(normal) <= 0) continue;

		// Project each vertex into decal-local space: (right, up) relative to centerPos
		// Result in range [-1,1] maps to the decal area
		const project = (px: number, py: number, pz: number): [number, number] => {
			const dx = px - centerPos.x;
			const dy = py - centerPos.y;
			const dz = pz - centerPos.z;
			return [
				(dx * right.x + dy * right.y + dz * right.z) / hs,
				(dx * up.x + dy * up.y + dz * up.z) / hsY,
			];
		};

		const [d0a, d0b] = project(p0x, p0y, p0z);
		const [d1a, d1b] = project(p1x, p1y, p1z);
		const [d2a, d2b] = project(p2x, p2y, p2z);

		// Skip face if entirely outside the [-1, 1] decal bounds
		const minA = Math.min(d0a, d1a, d2a);
		const maxA = Math.max(d0a, d1a, d2a);
		const minB = Math.min(d0b, d1b, d2b);
		const maxB = Math.max(d0b, d1b, d2b);
		if (maxA < -1 || minA > 1 || maxB < -1 || minB > 1) continue;

		// Map decal-local [-1,1] to image pixel coords [0, imgW/H]
		const ix0 = (d0a * 0.5 + 0.5) * imgW;
		const iy0 = (1 - (d0b * 0.5 + 0.5)) * imgH;
		const ix1 = (d1a * 0.5 + 0.5) * imgW;
		const iy1 = (1 - (d1b * 0.5 + 0.5)) * imgH;
		const ix2 = (d2a * 0.5 + 0.5) * imgW;
		const iy2 = (1 - (d2b * 0.5 + 0.5)) * imgH;

		// UV output coords (note: no Y flip here, consistent with layer rendering)
		const ux0 = uvAttr.getX(fi0) * w;
		const uy0 = uvAttr.getY(fi0) * h;
		const ux1 = uvAttr.getX(fi1) * w;
		const uy1 = uvAttr.getY(fi1) * h;
		const ux2 = uvAttr.getX(fi2) * w;
		const uy2 = uvAttr.getY(fi2) * h;

		drawTriangleAffine(ctx, image, ix0, iy0, ix1, iy1, ix2, iy2, ux0, uy0, ux1, uy1, ux2, uy2);
	}
}

/** Find the face containing a UV point and return vertex indices + barycentric coords */
function findFaceAtUVBary(
	uvX: number,
	uvY: number,
	indexAttr: { getX: (i: number) => number; count: number },
	uvAttr: { getX: (i: number) => number; getY: (i: number) => number },
): { i0: number; i1: number; i2: number; baryU: number; baryV: number } | null {
	const faceCount = indexAttr.count / 3;
	for (let f = 0; f < faceCount; f++) {
		const i0 = indexAttr.getX(f * 3);
		const i1 = indexAttr.getX(f * 3 + 1);
		const i2 = indexAttr.getX(f * 3 + 2);

		const ax = uvAttr.getX(i0), ay = uvAttr.getY(i0);
		const bx = uvAttr.getX(i1), by = uvAttr.getY(i1);
		const cx = uvAttr.getX(i2), cy = uvAttr.getY(i2);

		// Barycentric test
		const v0x = cx - ax, v0y = cy - ay;
		const v1x = bx - ax, v1y = by - ay;
		const v2x = uvX - ax, v2y = uvY - ay;

		const dot00 = v0x * v0x + v0y * v0y;
		const dot01 = v0x * v1x + v0y * v1y;
		const dot02 = v0x * v2x + v0y * v2y;
		const dot11 = v1x * v1x + v1y * v1y;
		const dot12 = v1x * v2x + v1y * v2y;

		const inv = 1 / (dot00 * dot11 - dot01 * dot01);
		const u = (dot11 * dot02 - dot01 * dot12) * inv;
		const v = (dot00 * dot12 - dot01 * dot02) * inv;

		if (u >= 0 && v >= 0 && u + v <= 1) {
			return { i0, i1, i2, baryU: u, baryV: v };
		}
	}
	return null;
}
