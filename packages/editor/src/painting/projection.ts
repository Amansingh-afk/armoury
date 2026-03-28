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
