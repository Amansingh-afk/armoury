import { describe, expect, it } from "vitest";
import { dilateSeams } from "../src/export/seam-dilation";

describe("dilateSeams", () => {
	it("expands painted pixels into adjacent transparent pixels", () => {
		const imageData = new ImageData(4, 4);
		const idx = (2 * 4 + 2) * 4;
		imageData.data[idx] = 255;
		imageData.data[idx + 1] = 0;
		imageData.data[idx + 2] = 0;
		imageData.data[idx + 3] = 255;

		const result = dilateSeams(imageData, 1);

		const neighbors = [(2 * 4 + 1) * 4, (2 * 4 + 3) * 4, (1 * 4 + 2) * 4, (3 * 4 + 2) * 4];
		for (const nIdx of neighbors) {
			expect(result.data[nIdx]).toBe(255);
			expect(result.data[nIdx + 3]).toBe(255);
		}
	});

	it("does not overwrite already-painted pixels", () => {
		const imageData = new ImageData(4, 4);
		const idx1 = (1 * 4 + 1) * 4;
		imageData.data[idx1] = 255;
		imageData.data[idx1 + 3] = 255;
		const idx2 = (1 * 4 + 2) * 4;
		imageData.data[idx2 + 2] = 255;
		imageData.data[idx2 + 3] = 255;

		const result = dilateSeams(imageData, 1);

		expect(result.data[idx2]).toBe(0);
		expect(result.data[idx2 + 2]).toBe(255);
	});

	it("dilates multiple iterations", () => {
		const imageData = new ImageData(8, 8);
		const idx = (4 * 8 + 4) * 4;
		imageData.data[idx] = 255;
		imageData.data[idx + 3] = 255;

		const result = dilateSeams(imageData, 3);

		const farIdx = (1 * 8 + 4) * 4;
		expect(result.data[farIdx + 3]).toBe(255);
	});
});
