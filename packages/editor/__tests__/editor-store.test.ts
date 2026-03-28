import { beforeEach, describe, expect, it } from "vitest";
import { createEditorStore } from "../src/store/editor-store";

describe("EditorStore", () => {
	let store: ReturnType<typeof createEditorStore>;

	beforeEach(() => {
		store = createEditorStore(64, 64);
	});

	it("initializes with default brush settings", () => {
		const state = store.getState();
		expect(state.brush.size).toBe(20);
		expect(state.brush.opacity).toBe(1);
		expect(state.brush.hardness).toBe(1);
		expect(state.brush.color).toBe("#ff0000");
	});

	it("initializes with one layer", () => {
		const state = store.getState();
		expect(state.layerStack.layers.length).toBe(1);
		expect(state.activeLayerId).toBe(state.layerStack.layers[0].id);
	});

	it("initializes with pan as active tool", () => {
		const state = store.getState();
		expect(state.activeTool).toBe("pan");
	});

	it("updates brush settings", () => {
		store.getState().setBrush({ size: 50, opacity: 0.5 });
		expect(store.getState().brush.size).toBe(50);
		expect(store.getState().brush.opacity).toBe(0.5);
		expect(store.getState().brush.color).toBe("#ff0000");
	});

	it("adds a layer and sets it active", () => {
		store.getState().addLayer();
		const state = store.getState();
		expect(state.layerStack.layers.length).toBe(2);
		expect(state.activeLayerId).toBe(state.layerStack.layers[1].id);
	});

	it("deletes a layer", () => {
		store.getState().addLayer();
		const firstId = store.getState().layerStack.layers[0].id;
		store.getState().deleteLayer(firstId);
		expect(store.getState().layerStack.layers.length).toBe(1);
	});

	it("pushes undo snapshot and restores on undo", () => {
		const state = store.getState();
		const layer = state.layerStack.layers[0];
		const ctx = layer.textureCanvas.getContext();
		ctx.fillStyle = "red";
		ctx.fillRect(0, 0, 64, 64);

		state.pushUndo();
		layer.textureCanvas.clear();

		store.getState().undo();
		const data = layer.textureCanvas.getImageData();
		expect(data.data[0]).toBe(255);
	});

	it("supports redo after undo", () => {
		const state = store.getState();
		const layer = state.layerStack.layers[0];
		const ctx = layer.textureCanvas.getContext();

		ctx.fillStyle = "red";
		ctx.fillRect(0, 0, 64, 64);
		state.pushUndo();

		layer.textureCanvas.clear();

		store.getState().undo();
		store.getState().redo();
		const data = layer.textureCanvas.getImageData();
		expect(data.data[0]).toBe(0);
	});

	it("clears redo stack on new action", () => {
		const state = store.getState();
		state.pushUndo();
		state.pushUndo();
		store.getState().undo();
		expect(store.getState().redoStack.length).toBe(1);

		store.getState().pushUndo();
		expect(store.getState().redoStack.length).toBe(0);
	});
});
