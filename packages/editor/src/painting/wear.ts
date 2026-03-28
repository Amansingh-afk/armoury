import { pseudoRandom } from "./types";

/** CS2 wear level names and their float ranges */
export const WEAR_PRESETS = [
	{ name: "Factory New", value: 0 },
	{ name: "Minimal Wear", value: 0.1 },
	{ name: "Field-Tested", value: 0.25 },
	{ name: "Well-Worn", value: 0.42 },
	{ name: "Battle-Scarred", value: 0.75 },
] as const;

/**
 * Generate a wear mask at the given level.
 * Uses multi-octave noise + scratch lines.
 */
export function generateWearMask(
	width: number,
	height: number,
	wearLevel: number,
	seed = 42,
	sharpness = 0.25,
): ImageData {
	const data = new Uint8ClampedArray(width * height * 4);
	if (wearLevel <= 0) {
		return new ImageData(data, width, height);
	}

	// Generate value noise at multiple octaves
	const noiseMap = new Float32Array(width * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let val = 0;
			// Large patches
			val += valueNoise(x * 0.003, y * 0.003, seed) * 0.5;
			// Medium detail
			val += valueNoise(x * 0.01, y * 0.01, seed + 100) * 0.3;
			// Fine detail
			val += valueNoise(x * 0.04, y * 0.04, seed + 200) * 0.2;
			noiseMap[y * width + x] = val;
		}
	}

	// Threshold based on wear level
	// At wearLevel=0, threshold is very high (nothing passes)
	// At wearLevel=1, threshold is low (most passes)
	const threshold = 1 - wearLevel * 1.2;
	// Edge sharpness: higher = harder edges, lower = softer gradient
	const edgeScale = 1 + sharpness * 8;

	for (let i = 0; i < noiseMap.length; i++) {
		let wear = 0;
		if (noiseMap[i] > threshold) {
			wear = Math.min(1, (noiseMap[i] - threshold) * edgeScale);
		}
		const v = Math.round(wear * 255);
		const p = i * 4;
		data[p] = v;
		data[p + 1] = v;
		data[p + 2] = v;
		data[p + 3] = 255;
	}

	// Add scratches
	const scratchCount = Math.floor(wearLevel * 80);
	for (let s = 0; s < scratchCount; s++) {
		const sx = pseudoRandom(seed + s * 17) * width;
		const sy = pseudoRandom(seed + s * 31) * height;
		const angle = pseudoRandom(seed + s * 43) * Math.PI;
		const len = 20 + pseudoRandom(seed + s * 59) * 200 * wearLevel;
		const intensity = 100 + pseudoRandom(seed + s * 73) * 155;
		const dx = Math.cos(angle);
		const dy = Math.sin(angle);

		for (let t = 0; t < len; t++) {
			const px = Math.round(sx + dx * t);
			const py = Math.round(sy + dy * t);
			if (px < 0 || px >= width || py < 0 || py >= height) continue;
			const p = (py * width + px) * 4;
			data[p] = Math.min(255, data[p] + intensity);
			data[p + 1] = Math.min(255, data[p + 1] + intensity);
			data[p + 2] = Math.min(255, data[p + 2] + intensity);
		}
	}

	return new ImageData(data, width, height);
}

/**
 * Apply wear mask to composited texture.
 * Where the mask is white, reveals a dark metallic base color.
 */
export function applyWear(
	composited: ImageData,
	wearMask: ImageData,
	baseColor = { r: 45, g: 45, b: 48 },
): ImageData {
	const result = new ImageData(
		new Uint8ClampedArray(composited.data),
		composited.width,
		composited.height,
	);
	const src = composited.data;
	const mask = wearMask.data;
	const dst = result.data;

	for (let i = 0; i < src.length; i += 4) {
		const wear = mask[i] / 255; // mask is grayscale, use R channel
		if (wear > 0) {
			dst[i] = Math.round(src[i] * (1 - wear) + baseColor.r * wear);
			dst[i + 1] = Math.round(src[i + 1] * (1 - wear) + baseColor.g * wear);
			dst[i + 2] = Math.round(src[i + 2] * (1 - wear) + baseColor.b * wear);
		}
	}

	return result;
}

/** Simple 2D value noise using integer lattice */
function valueNoise(x: number, y: number, seed: number): number {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	const fx = x - ix;
	const fy = y - iy;

	// Smooth interpolation
	const sx = fx * fx * (3 - 2 * fx);
	const sy = fy * fy * (3 - 2 * fy);

	const n00 = pseudoRandom(ix * 374761 + iy * 668265 + seed);
	const n10 = pseudoRandom((ix + 1) * 374761 + iy * 668265 + seed);
	const n01 = pseudoRandom(ix * 374761 + (iy + 1) * 668265 + seed);
	const n11 = pseudoRandom((ix + 1) * 374761 + (iy + 1) * 668265 + seed);

	const nx0 = n00 + (n10 - n00) * sx;
	const nx1 = n01 + (n11 - n01) * sx;
	return nx0 + (nx1 - nx0) * sy;
}
