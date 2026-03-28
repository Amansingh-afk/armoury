import { describe, expect, it } from "vitest";
import { TextureCanvas } from "../src/painting/texture-canvas";

describe("TextureCanvas", () => {
	it("creates a canvas with the specified dimensions", () => {
		const tc = new TextureCanvas(512, 512);
		expect(tc.width).toBe(512);
		expect(tc.height).toBe(512);
	});

	it("defaults to 2048x2048", () => {
		const tc = new TextureCanvas();
		expect(tc.width).toBe(2048);
		expect(tc.height).toBe(2048);
	});

	it("returns ImageData of the full canvas", () => {
		const tc = new TextureCanvas(4, 4);
		const data = tc.getImageData();
		expect(data.width).toBe(4);
		expect(data.height).toBe(4);
		expect(data.data.length).toBe(4 * 4 * 4);
	});

	it("clears the canvas to transparent black", () => {
		const tc = new TextureCanvas(2, 2);
		tc.getContext().fillStyle = "red";
		tc.getContext().fillRect(0, 0, 2, 2);
		tc.clear();
		const data = tc.getImageData();
		expect(data.data.every((v) => v === 0)).toBe(true);
	});

	it("exposes the underlying canvas element", () => {
		const tc = new TextureCanvas(64, 64);
		expect(tc.canvas).toBeDefined();
		expect(tc.canvas.width).toBe(64);
	});
});
