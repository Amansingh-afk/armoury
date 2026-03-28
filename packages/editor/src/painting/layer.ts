import { TextureCanvas } from "./texture-canvas";

export type BlendMode =
	| "normal"
	| "multiply"
	| "screen"
	| "overlay"
	| "soft-light"
	| "color-dodge"
	| "color-burn"
	| "difference";

export interface ColorAdjust {
	hue: number; // -180 to 180
	saturation: number; // -1 to 1
	brightness: number; // -1 to 1
}

export const DEFAULT_COLOR_ADJUST: ColorAdjust = { hue: 0, saturation: 0, brightness: 0 };

export type ImageFillMode = "stretch" | "tile";

export interface ImageTransform {
	scale: number;
	fillMode: ImageFillMode;
}

export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
	scale: 1,
	fillMode: "stretch",
};

export class Layer {
	private static nextId = 0;

	readonly id: number;
	readonly textureCanvas: TextureCanvas;
	visible = true;
	opacity = 1;
	blendMode: BlendMode = "normal";
	colorAdjust: ColorAdjust = { ...DEFAULT_COLOR_ADJUST };
	emboss = false;
	embossStrength = 0.5;

	image: ImageBitmap | null = null;
	imageTransform: ImageTransform = { ...DEFAULT_IMAGE_TRANSFORM };

	constructor(
		public name: string,
		private width: number,
		private height: number,
	) {
		this.id = Layer.nextId++;
		this.textureCanvas = new TextureCanvas(width, height);
	}

	get isImageLayer(): boolean {
		return this.image !== null;
	}

	setImage(img: ImageBitmap): void {
		this.image = img;
		this.imageTransform = { ...DEFAULT_IMAGE_TRANSFORM };
	}

	renderImage(): void {
		if (!this.image) return;
		const ctx = this.textureCanvas.getContext();
		this.textureCanvas.clear();

		const w = this.width;
		const h = this.height;
		const t = this.imageTransform;

		switch (t.fillMode) {
			case "stretch":
				ctx.drawImage(this.image, 0, 0, w, h);
				break;

			case "tile": {
				const tileW = this.image.width * t.scale;
				const tileH = this.image.height * t.scale;
				if (tileW < 1 || tileH < 1) break;
				for (let y = 0; y < h; y += tileH) {
					for (let x = 0; x < w; x += tileW) {
						ctx.drawImage(this.image, x, y, tileW, tileH);
					}
				}
				break;
			}
		}
	}

	snapshot(): ImageData {
		return this.textureCanvas.getImageData();
	}

	restore(data: ImageData): void {
		this.textureCanvas.clear();
		this.textureCanvas.getContext().putImageData(data, 0, 0);
	}
}
