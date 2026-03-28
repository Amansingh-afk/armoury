export interface BrushSettings {
	size: number;
	color: string;
	opacity: number;
	hardness: number;
}

export const DEFAULT_TEXTURE_SIZE = 2048;

/** Deterministic pseudo-random [0,1) from an integer seed */
export function pseudoRandom(seed: number): number {
	let x = Math.sin(seed * 9301 + 49297) * 233280;
	x = x - Math.floor(x);
	return x;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const h = hex.replace("#", "");
	return {
		r: Number.parseInt(h.substring(0, 2), 16) || 128,
		g: Number.parseInt(h.substring(2, 4), 16) || 128,
		b: Number.parseInt(h.substring(4, 6), 16) || 128,
	};
}
