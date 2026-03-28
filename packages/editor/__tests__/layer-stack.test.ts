import { describe, expect, it } from "vitest";
import { LayerStack } from "../src/painting/layer-stack";

describe("LayerStack", () => {
	it("starts with one default layer", () => {
		const stack = new LayerStack(64, 64);
		expect(stack.layers.length).toBe(1);
		expect(stack.layers[0].name).toBe("Layer 1");
	});

	it("adds a new layer on top", () => {
		const stack = new LayerStack(64, 64);
		stack.addLayer();
		expect(stack.layers.length).toBe(2);
		expect(stack.layers[1].name).toBe("Layer 2");
	});

	it("deletes a layer by id (but never the last one)", () => {
		const stack = new LayerStack(64, 64);
		stack.addLayer();
		const idToDelete = stack.layers[0].id;
		stack.deleteLayer(idToDelete);
		expect(stack.layers.length).toBe(1);
	});

	it("refuses to delete the last layer", () => {
		const stack = new LayerStack(64, 64);
		const id = stack.layers[0].id;
		stack.deleteLayer(id);
		expect(stack.layers.length).toBe(1);
	});

	it("reorders layers", () => {
		const stack = new LayerStack(64, 64);
		stack.addLayer();
		stack.addLayer();
		const ids = stack.layers.map((l) => l.id);
		stack.reorder(ids[2], 0);
		expect(stack.layers[0].id).toBe(ids[2]);
	});

	it("composites visible layers bottom-to-top onto output canvas", () => {
		const stack = new LayerStack(4, 4);
		const ctx = stack.layers[0].textureCanvas.getContext();
		ctx.fillStyle = "rgba(255, 0, 0, 1)";
		ctx.fillRect(0, 0, 4, 4);

		const result = stack.composite();
		expect(result.data[0]).toBe(255);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);
	});

	it("skips hidden layers during compositing", () => {
		const stack = new LayerStack(4, 4);
		const ctx = stack.layers[0].textureCanvas.getContext();
		ctx.fillStyle = "red";
		ctx.fillRect(0, 0, 4, 4);
		stack.layers[0].visible = false;

		const result = stack.composite();
		expect(result.data[0]).toBe(0);
	});
});
