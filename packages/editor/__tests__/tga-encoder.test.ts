import { describe, expect, it } from "vitest";
import { encodeTGA } from "../src/export/tga-encoder";

describe("encodeTGA", () => {
	it("produces a valid TGA file with correct header", () => {
		const imageData = new ImageData(2, 2);
		for (let i = 0; i < 16; i += 4) {
			imageData.data[i] = 255;
			imageData.data[i + 1] = 0;
			imageData.data[i + 2] = 0;
			imageData.data[i + 3] = 255;
		}
		const tga = encodeTGA(imageData);
		expect(tga).toBeInstanceOf(Uint8Array);
		expect(tga[2]).toBe(2);
		expect(tga[12]).toBe(2);
		expect(tga[13]).toBe(0);
		expect(tga[14]).toBe(2);
		expect(tga[15]).toBe(0);
		expect(tga[16]).toBe(32);
		expect(tga.length).toBe(34);
	});

	it("converts RGBA to BGRA byte order", () => {
		const imageData = new ImageData(1, 1);
		imageData.data[0] = 100;
		imageData.data[1] = 150;
		imageData.data[2] = 200;
		imageData.data[3] = 255;
		const tga = encodeTGA(imageData);
		expect(tga[18]).toBe(200);
		expect(tga[19]).toBe(150);
		expect(tga[20]).toBe(100);
		expect(tga[21]).toBe(255);
	});

	it("writes pixels bottom-to-top (TGA origin is bottom-left)", () => {
		const imageData = new ImageData(1, 2);
		imageData.data[0] = 255;
		imageData.data[1] = 0;
		imageData.data[2] = 0;
		imageData.data[3] = 255;
		imageData.data[4] = 0;
		imageData.data[5] = 0;
		imageData.data[6] = 255;
		imageData.data[7] = 255;
		const tga = encodeTGA(imageData);
		expect(tga[18]).toBe(255);
		expect(tga[20]).toBe(0);
		expect(tga[22]).toBe(0);
		expect(tga[24]).toBe(255);
	});
});
