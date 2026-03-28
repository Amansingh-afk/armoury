import { type BlendMode, type ColorAdjust, Layer } from "./layer";
import { TextureCanvas } from "./texture-canvas";
import { applyWear, generateWearMask } from "./wear";

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;
	return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	h = ((h % 360) + 360) % 360;
	if (s === 0) {
		const v = Math.round(l * 255);
		return [v, v, v];
	}
	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const hNorm = h / 360;
	return [
		Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
		Math.round(hue2rgb(p, q, hNorm) * 255),
		Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
	];
}

function hasColorAdjust(adj: ColorAdjust): boolean {
	return adj.hue !== 0 || adj.saturation !== 0 || adj.brightness !== 0;
}

function applyColorAdjust(data: ImageData, adj: ColorAdjust): void {
	const d = data.data;
	for (let i = 0; i < d.length; i += 4) {
		let [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
		h = h + adj.hue;
		s = Math.max(0, Math.min(1, s + adj.saturation));
		l = Math.max(0, Math.min(1, l + adj.brightness));
		const [r, g, b] = hslToRgb(h, s, l);
		d[i] = r;
		d[i + 1] = g;
		d[i + 2] = b;
	}
}

function applyEmboss(data: ImageData, strength: number): void {
	const w = data.width;
	const h = data.height;
	const src = new Uint8ClampedArray(data.data);
	const d = data.data;
	// Emboss kernel: light from top-left
	// [-2, -1, 0]
	// [-1,  1, 1]
	// [ 0,  1, 2]
	const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];

	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			let embossVal = 0;
			for (let ky = -1; ky <= 1; ky++) {
				for (let kx = -1; kx <= 1; kx++) {
					const idx = ((y + ky) * w + (x + kx)) * 4;
					const lum = (src[idx] * 77 + src[idx + 1] * 150 + src[idx + 2] * 29) >> 8;
					embossVal += lum * kernel[(ky + 1) * 3 + (kx + 1)];
				}
			}

			// Normalize to [-1, 1] range and scale by strength
			const effect = (embossVal / 255) * strength;
			const i = (y * w + x) * 4;

			for (let c = 0; c < 3; c++) {
				const orig = src[i + c];
				if (effect > 0) {
					// Lighten (screen toward white)
					d[i + c] = Math.min(255, Math.round(orig + (255 - orig) * effect));
				} else {
					// Darken (multiply toward black)
					d[i + c] = Math.max(0, Math.round(orig * (1 + effect)));
				}
			}
		}
	}
}

function blendChannel(base: number, src: number, mode: BlendMode): number {
	const b = base / 255;
	const s = src / 255;
	let r: number;
	switch (mode) {
		case "multiply":
			r = b * s;
			break;
		case "screen":
			r = 1 - (1 - b) * (1 - s);
			break;
		case "overlay":
			r = b < 0.5 ? 2 * b * s : 1 - 2 * (1 - b) * (1 - s);
			break;
		case "soft-light":
			r = s < 0.5 ? b - (1 - 2 * s) * b * (1 - b) : b + (2 * s - 1) * (Math.sqrt(b) - b);
			break;
		case "color-dodge":
			r = s >= 1 ? 1 : Math.min(1, b / (1 - s));
			break;
		case "color-burn":
			r = s <= 0 ? 0 : Math.max(0, 1 - (1 - b) / s);
			break;
		case "difference":
			r = Math.abs(b - s);
			break;
		default:
			r = s;
			break;
	}
	return Math.round(r * 255);
}

export class LayerStack {
	layers: Layer[] = [];
	private layerCount = 0;
	private compositeCanvas: TextureCanvas;

	wearLevel = 0;
	wearBaseColor = { r: 45, g: 45, b: 48 };
	wearSharpness = 0.25;
	private cachedCompositeResult: ImageData | null = null;
	private cachedWearMask: ImageData | null = null;
	private cachedWearLevel = -1;
	private cachedWearSharpness = -1;
	private lastWearGenTime = 0;
	private pendingWearLevel = -1;
	private wearGenTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private width: number,
		private height: number,
	) {
		this.compositeCanvas = new TextureCanvas(width, height);
		const layer = this.addLayer();
		const ctx = layer.textureCanvas.getContext();
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, width, height);
	}

	addLayer(): Layer {
		this.layerCount++;
		const layer = new Layer(`Layer ${this.layerCount}`, this.width, this.height);
		this.layers.push(layer);
		return layer;
	}

	deleteLayer(id: number): void {
		if (this.layers.length <= 1) return;
		this.layers = this.layers.filter((l) => l.id !== id);
	}

	reorder(layerId: number, toIndex: number): void {
		const fromIndex = this.layers.findIndex((l) => l.id === layerId);
		if (fromIndex === -1) return;
		const [layer] = this.layers.splice(fromIndex, 1);
		this.layers.splice(toIndex, 0, layer);
	}

	setWear(level: number): void {
		this.wearLevel = Math.max(0, Math.min(1, level));
	}

	composite(): ImageData {
		const ctx = this.compositeCanvas.getContext();
		this.compositeCanvas.clear();

		// Opaque background so no transparent pixels in export
		ctx.fillStyle = "#808080";
		ctx.fillRect(0, 0, this.width, this.height);

		for (const layer of this.layers) {
			if (!layer.visible) continue;

			const needsColorAdj = hasColorAdjust(layer.colorAdjust);
			const needsEmboss = layer.emboss && layer.embossStrength > 0;
			const needsPixelBlend = layer.blendMode !== "normal" || needsColorAdj || needsEmboss;

			if (!needsPixelBlend) {
				ctx.globalAlpha = layer.opacity;
				ctx.drawImage(layer.textureCanvas.canvas, 0, 0);
			} else {
				const baseData = ctx.getImageData(0, 0, this.width, this.height);
				const layerData = layer.textureCanvas.getImageData();

				if (needsColorAdj) {
					applyColorAdjust(layerData, layer.colorAdjust);
				}

				if (needsEmboss) {
					applyEmboss(layerData, layer.embossStrength);
				}

				const bd = baseData.data;
				const ld = layerData.data;
				const alpha = layer.opacity;
				const mode = layer.blendMode;

				for (let i = 0; i < bd.length; i += 4) {
					const srcA = (ld[i + 3] / 255) * alpha;
					if (srcA === 0) continue;

					if (mode === "normal") {
						bd[i] = Math.round(bd[i] + (ld[i] - bd[i]) * srcA);
						bd[i + 1] = Math.round(bd[i + 1] + (ld[i + 1] - bd[i + 1]) * srcA);
						bd[i + 2] = Math.round(bd[i + 2] + (ld[i + 2] - bd[i + 2]) * srcA);
					} else {
						bd[i] = Math.round(bd[i] + (blendChannel(bd[i], ld[i], mode) - bd[i]) * srcA);
						bd[i + 1] = Math.round(
							bd[i + 1] + (blendChannel(bd[i + 1], ld[i + 1], mode) - bd[i + 1]) * srcA,
						);
						bd[i + 2] = Math.round(
							bd[i + 2] + (blendChannel(bd[i + 2], ld[i + 2], mode) - bd[i + 2]) * srcA,
						);
					}
				}

				ctx.putImageData(baseData, 0, 0);
			}
		}

		ctx.globalAlpha = 1;
		let result = this.compositeCanvas.getImageData();

		if (this.wearLevel > 0) {
			this.updateWearMask();
			if (this.cachedWearMask) {
				result = applyWear(result, this.cachedWearMask, this.wearBaseColor);
			}
		}

		this.cachedCompositeResult = result;
		return result;
	}

	getCachedComposite(): ImageData | null {
		return this.cachedCompositeResult;
	}

	private updateWearMask(): void {
		if (this.cachedWearLevel === this.wearLevel && this.cachedWearSharpness === this.wearSharpness) return;

		const now = performance.now();
		const elapsed = now - this.lastWearGenTime;
		const THROTTLE_MS = 150;

		if (elapsed >= THROTTLE_MS || this.cachedWearMask === null) {
			this.cachedWearMask = generateWearMask(this.width, this.height, this.wearLevel, 42, this.wearSharpness);
			this.cachedWearLevel = this.wearLevel;
			this.cachedWearSharpness = this.wearSharpness;
			this.lastWearGenTime = now;
			this.cancelPendingWear();
		} else if (this.pendingWearLevel !== this.wearLevel || this.cachedWearSharpness !== this.wearSharpness) {
			this.pendingWearLevel = this.wearLevel;
			this.cancelPendingWear();
			this.wearGenTimer = setTimeout(() => {
				this.cachedWearMask = generateWearMask(this.width, this.height, this.wearLevel, 42, this.wearSharpness);
				this.cachedWearLevel = this.wearLevel;
				this.cachedWearSharpness = this.wearSharpness;
				this.lastWearGenTime = performance.now();
				this.pendingWearLevel = -1;
				this.wearGenTimer = null;
			}, THROTTLE_MS);
		}
	}

	private cancelPendingWear(): void {
		if (this.wearGenTimer !== null) {
			clearTimeout(this.wearGenTimer);
			this.wearGenTimer = null;
		}
	}
}
