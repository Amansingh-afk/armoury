import { vi } from "vitest";

// Polyfill ImageData if jsdom does not expose it
if (typeof globalThis.ImageData === "undefined") {
	globalThis.ImageData = class ImageData {
		readonly data: Uint8ClampedArray;
		readonly width: number;
		readonly height: number;

		constructor(dataOrWidth: Uint8ClampedArray | number, width: number, height?: number) {
			if (dataOrWidth instanceof Uint8ClampedArray) {
				this.data = dataOrWidth;
				this.width = width;
				this.height = height ?? dataOrWidth.length / 4 / width;
			} else {
				this.width = dataOrWidth;
				this.height = width;
				this.data = new Uint8ClampedArray(dataOrWidth * width * 4);
			}
		}
	} as any;
}

// Minimal in-memory 2D rendering context for tests.
// jsdom does not implement canvas 2D without the optional `canvas` package,
// so we provide our own pixel-buffer implementation that covers everything
// the painting tests need.
class InMemoryContext2D {
	private data: Uint8ClampedArray;
	fillStyle: string | any = "transparent";
	globalAlpha = 1;
	globalCompositeOperation = "source-over";

	// State stack for save/restore
	private _stateStack: Array<{
		fillStyle: string | any;
		globalAlpha: number;
		globalCompositeOperation: string;
	}> = [];

	// Path accumulator for arc/fill
	private _pathOps: Array<{ type: "arc"; cx: number; cy: number; r: number }> = [];

	constructor(
		private width: number,
		private height: number,
	) {
		this.data = new Uint8ClampedArray(width * height * 4);
	}

	save(): void {
		this._stateStack.push({
			fillStyle: this.fillStyle,
			globalAlpha: this.globalAlpha,
			globalCompositeOperation: this.globalCompositeOperation,
		});
	}

	restore(): void {
		const state = this._stateStack.pop();
		if (state) {
			this.fillStyle = state.fillStyle;
			this.globalAlpha = state.globalAlpha;
			this.globalCompositeOperation = state.globalCompositeOperation;
		}
	}

	beginPath(): void {
		this._pathOps = [];
	}

	arc(cx: number, cy: number, r: number, _startAngle: number, _endAngle: number): void {
		this._pathOps.push({ type: "arc", cx, cy, r });
	}

	fill(): void {
		// Fill accumulated arcs as filled circles (bounding-box approximation)
		for (const op of this._pathOps) {
			if (op.type === "arc") {
				const { cx, cy, r } = op;
				this.fillRect(cx - r, cy - r, r * 2, r * 2);
			}
		}
		this._pathOps = [];
	}

	createRadialGradient(
		_x0: number,
		_y0: number,
		_r0: number,
		_x1: number,
		_y1: number,
		_r1: number,
	): { addColorStop: (offset: number, color: string) => void; _colors: string[] } {
		const colors: string[] = [];
		return {
			_colors: colors,
			addColorStop(_offset: number, color: string) {
				colors.push(color);
			},
		};
	}

	private parseColor(color: string): [number, number, number, number] {
		// Handle gradient objects from createRadialGradient (use first color stop)
		if (color && typeof color === "object") {
			const gradColors = (color as any)._colors;
			if (gradColors && gradColors.length > 0) {
				return this.parseColor(gradColors[0]);
			}
			return [0, 0, 0, 255];
		}
		// Handle rgba(...) and named colors used in tests
		const rgba = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
		if (rgba) {
			return [
				Number(rgba[1]),
				Number(rgba[2]),
				Number(rgba[3]),
				rgba[4] !== undefined ? Math.round(Number(rgba[4]) * 255) : 255,
			];
		}
		// Named colors
		if (color === "red" || color === "#ff0000") return [255, 0, 0, 255];
		if (color === "green" || color === "#00ff00") return [0, 255, 0, 255];
		if (color === "blue" || color === "#0000ff") return [0, 0, 255, 255];
		if (color === "transparent") return [0, 0, 0, 0];
		if (color === "black" || color === "#000000") return [0, 0, 0, 255];
		if (color === "white" || color === "#ffffff") return [255, 255, 255, 255];
		return [0, 0, 0, 255];
	}

	fillRect(x: number, y: number, w: number, h: number): void {
		const [r, g, b, a] = this.parseColor(this.fillStyle);
		const effectiveAlpha = Math.round(a * this.globalAlpha);
		const x0 = Math.round(x);
		const y0 = Math.round(y);
		const x1 = Math.round(x + w);
		const y1 = Math.round(y + h);
		for (let row = y0; row < y1; row++) {
			for (let col = x0; col < x1; col++) {
				if (row < 0 || col < 0 || row >= this.height || col >= this.width) continue;
				const idx = (row * this.width + col) * 4;
				this.data[idx] = r;
				this.data[idx + 1] = g;
				this.data[idx + 2] = b;
				this.data[idx + 3] = effectiveAlpha;
			}
		}
	}

	clearRect(x: number, y: number, w: number, h: number): void {
		for (let row = y; row < y + h; row++) {
			for (let col = x; col < x + w; col++) {
				if (row < 0 || col < 0 || row >= this.height || col >= this.width) continue;
				const idx = (row * this.width + col) * 4;
				this.data[idx] = 0;
				this.data[idx + 1] = 0;
				this.data[idx + 2] = 0;
				this.data[idx + 3] = 0;
			}
		}
	}

	getImageData(x: number, y: number, w: number, h: number): ImageData {
		const out = new Uint8ClampedArray(w * h * 4);
		for (let row = 0; row < h; row++) {
			for (let col = 0; col < w; col++) {
				const srcIdx = ((y + row) * this.width + (x + col)) * 4;
				const dstIdx = (row * w + col) * 4;
				out[dstIdx] = this.data[srcIdx];
				out[dstIdx + 1] = this.data[srcIdx + 1];
				out[dstIdx + 2] = this.data[srcIdx + 2];
				out[dstIdx + 3] = this.data[srcIdx + 3];
			}
		}
		return new ImageData(out, w, h);
	}

	putImageData(imageData: ImageData, dx: number, dy: number): void {
		for (let row = 0; row < imageData.height; row++) {
			for (let col = 0; col < imageData.width; col++) {
				const srcIdx = (row * imageData.width + col) * 4;
				const dstRow = dy + row;
				const dstCol = dx + col;
				if (dstRow < 0 || dstCol < 0 || dstRow >= this.height || dstCol >= this.width) continue;
				const dstIdx = (dstRow * this.width + dstCol) * 4;
				this.data[dstIdx] = imageData.data[srcIdx];
				this.data[dstIdx + 1] = imageData.data[srcIdx + 1];
				this.data[dstIdx + 2] = imageData.data[srcIdx + 2];
				this.data[dstIdx + 3] = imageData.data[srcIdx + 3];
			}
		}
	}

	// Simple source-over composite used by LayerStack
	drawImage(
		source: { width: number; height: number; _ctx?: InMemoryContext2D },
		dx: number,
		dy: number,
	): void {
		const srcCtx = (source as any)._ctx as InMemoryContext2D | undefined;
		if (!srcCtx) return;
		const srcData = srcCtx.data;
		const alpha = this.globalAlpha;
		for (let row = 0; row < source.height; row++) {
			for (let col = 0; col < source.width; col++) {
				const srcIdx = (row * source.width + col) * 4;
				const dstRow = dy + row;
				const dstCol = dx + col;
				if (dstRow < 0 || dstCol < 0 || dstRow >= this.height || dstCol >= this.width) continue;
				const dstIdx = (dstRow * this.width + dstCol) * 4;
				const sA = (srcData[srcIdx + 3] / 255) * alpha;
				const dA = this.data[dstIdx + 3] / 255;
				const outA = sA + dA * (1 - sA);
				if (outA === 0) {
					this.data[dstIdx] = 0;
					this.data[dstIdx + 1] = 0;
					this.data[dstIdx + 2] = 0;
					this.data[dstIdx + 3] = 0;
				} else {
					this.data[dstIdx] = Math.round(
						(srcData[srcIdx] * sA + this.data[dstIdx] * dA * (1 - sA)) / outA,
					);
					this.data[dstIdx + 1] = Math.round(
						(srcData[srcIdx + 1] * sA + this.data[dstIdx + 1] * dA * (1 - sA)) / outA,
					);
					this.data[dstIdx + 2] = Math.round(
						(srcData[srcIdx + 2] * sA + this.data[dstIdx + 2] * dA * (1 - sA)) / outA,
					);
					this.data[dstIdx + 3] = Math.round(outA * 255);
				}
			}
		}
	}
}

// Polyfill URL.createObjectURL / revokeObjectURL if jsdom doesn't provide them
if (typeof URL.createObjectURL === "undefined") {
	URL.createObjectURL = (_blob: Blob) => "blob:mock";
}
if (typeof URL.revokeObjectURL === "undefined") {
	URL.revokeObjectURL = (_url: string) => {};
}

// Polyfill OffscreenCanvas for tests if jsdom doesn't provide it
if (typeof globalThis.OffscreenCanvas === "undefined") {
	globalThis.OffscreenCanvas = class OffscreenCanvas {
		width: number;
		height: number;
		_ctx: InMemoryContext2D;

		constructor(width: number, height: number) {
			this.width = width;
			this.height = height;
			this._ctx = new InMemoryContext2D(width, height);
		}

		getContext(type: string) {
			if (type === "2d") return this._ctx;
			return null;
		}

		convertToBlob(_options?: any): Promise<Blob> {
			return Promise.resolve(new Blob());
		}
	} as any;
}
