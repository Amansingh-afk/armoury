import { describe, expect, it } from "vitest";
import { Layer } from "../src/painting/layer";

describe("Layer", () => {
	it("creates a layer with a name and default properties", () => {
		const layer = new Layer("Background", 512, 512);
		expect(layer.name).toBe("Background");
		expect(layer.visible).toBe(true);
		expect(layer.opacity).toBe(1);
	});

	it("exposes the underlying TextureCanvas", () => {
		const layer = new Layer("Test", 64, 64);
		expect(layer.textureCanvas.width).toBe(64);
	});

	it("can snapshot and restore ImageData for undo", () => {
		const layer = new Layer("Test", 4, 4);
		const ctx = layer.textureCanvas.getContext();
		ctx.fillStyle = "red";
		ctx.fillRect(0, 0, 4, 4);
		const snapshot = layer.snapshot();

		layer.textureCanvas.clear();
		const cleared = layer.textureCanvas.getImageData();
		expect(cleared.data[0]).toBe(0);

		layer.restore(snapshot);
		const restored = layer.textureCanvas.getImageData();
		expect(restored.data[0]).toBe(255);
	});
});
