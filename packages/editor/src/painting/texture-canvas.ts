import { DEFAULT_TEXTURE_SIZE } from "./types";

export class TextureCanvas {
	readonly canvas: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;

	constructor(
		public readonly width = DEFAULT_TEXTURE_SIZE,
		public readonly height = DEFAULT_TEXTURE_SIZE,
	) {
		this.canvas = new OffscreenCanvas(width, height);
		const ctx = this.canvas.getContext("2d");
		if (!ctx) throw new Error("Failed to create 2D context");
		this.ctx = ctx;
	}

	getContext(): OffscreenCanvasRenderingContext2D {
		return this.ctx;
	}

	getImageData(): ImageData {
		return this.ctx.getImageData(0, 0, this.width, this.height);
	}

	clear(): void {
		this.ctx.clearRect(0, 0, this.width, this.height);
	}
}
