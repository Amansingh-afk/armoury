import { createStore } from "zustand/vanilla";
import { strokeBrush } from "../painting/brush";
import { type PatternType, fillPattern } from "../painting/fill";
import { STICKER_IMAGE_TRANSFORM } from "../painting/layer";
import type { BlendMode, ColorAdjust, ImageTransform } from "../painting/layer";
import { LayerStack } from "../painting/layer-stack";
import type { BrushSettings } from "../painting/types";
import type { UVIndex } from "../painting/uv-lookup";

export type Tool = "pan" | "brush";
export type ViewMode = "3d" | "2d" | "split";

interface UndoEntry {
	layerId: number;
	imageData: ImageData;
}

export interface EditorState {
	brush: BrushSettings;
	activeTool: Tool;
	layerStack: LayerStack;
	activeLayerId: number;
	undoStack: UndoEntry[];
	redoStack: UndoEntry[];
	roughness: number;
	metallic: number;
	wearLevel: number;
	wearBaseColor: string;
	wearSharpness: number;
	textureVersion: number;
	viewMode: ViewMode;
	uvEdges: Array<[number, number, number, number]>;
	uvIndex: UVIndex | null;
	hoveredFaces: number[];

	setBrush: (partial: Partial<BrushSettings>) => void;
	setTool: (tool: Tool) => void;
	addLayer: () => void;
	deleteLayer: (id: number) => void;
	setActiveLayer: (id: number) => void;
	toggleLayerVisibility: (id: number) => void;
	setLayerOpacity: (id: number, opacity: number) => void;
	reorderLayer: (id: number, toIndex: number) => void;
	renameLayer: (id: number, name: string) => void;
	pushUndo: () => void;
	undo: () => void;
	redo: () => void;
	setRoughness: (value: number) => void;
	setMetallic: (value: number) => void;
	fillActiveLayer: (pattern: PatternType, colors: string[]) => void;
	importImage: (file: File) => Promise<void>;
	importSticker: (file: File) => Promise<void>;
	importImageBitmap: (bitmap: ImageBitmap, name: string) => void;
	importStickerBitmap: (bitmap: ImageBitmap, name: string) => void;
	setImageTransform: (layerId: number, transform: Partial<ImageTransform>) => void;
	setBlendMode: (layerId: number, mode: BlendMode) => void;
	setColorAdjust: (layerId: number, partial: Partial<ColorAdjust>) => void;
	setEmboss: (layerId: number, enabled: boolean, strength?: number) => void;
	setWearLevel: (value: number) => void;
	setWearBaseColor: (hex: string) => void;
	setWearSharpness: (value: number) => void;
	setViewMode: (mode: ViewMode) => void;
	setUVEdges: (edges: Array<[number, number, number, number]>) => void;
	setUVIndex: (index: UVIndex) => void;
	setHoveredFaces: (faces: number[]) => void;
	paintStroke: (points: Array<{ x: number; y: number }>) => void;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const v = Number.parseInt(hex.slice(1), 16);
	return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

const MAX_UNDO = 30;

export function createEditorStore(textureWidth: number, textureHeight: number) {
	const layerStack = new LayerStack(textureWidth, textureHeight);

	return createStore<EditorState>((set, get) => {
		const bumpTexture = () => set((s) => ({ textureVersion: s.textureVersion + 1 }));

		return {
			brush: {
				size: 20,
				color: "#ff0000",
				opacity: 1,
				hardness: 1,
			},
			activeTool: "pan" as Tool,
			layerStack,
			activeLayerId: layerStack.layers[0].id,
			undoStack: [],
			redoStack: [],
			roughness: 0.5,
			metallic: 0,
			wearLevel: 0,
			wearBaseColor: "#2d2d30",
			wearSharpness: 0.25,
			textureVersion: 0,
			viewMode: "3d",
			uvEdges: [],
			uvIndex: null,
			hoveredFaces: [],

			setBrush: (partial) => set((state) => ({ brush: { ...state.brush, ...partial } })),

			setTool: (tool) => set({ activeTool: tool }),

			addLayer: () => {
				const layer = layerStack.addLayer();
				set({ activeLayerId: layer.id });
			},

			deleteLayer: (id) => {
				layerStack.deleteLayer(id);
				const state = get();
				if (state.activeLayerId === id && layerStack.layers.length > 0) {
					set({ activeLayerId: layerStack.layers[layerStack.layers.length - 1].id });
				}
				bumpTexture();
			},

			setActiveLayer: (id) => set({ activeLayerId: id }),

			toggleLayerVisibility: (id) => {
				const layer = layerStack.layers.find((l) => l.id === id);
				if (layer) layer.visible = !layer.visible;
				bumpTexture();
			},

			setLayerOpacity: (id, opacity) => {
				const layer = layerStack.layers.find((l) => l.id === id);
				if (layer) layer.opacity = opacity;
				bumpTexture();
			},

			reorderLayer: (id, toIndex) => {
				layerStack.reorder(id, toIndex);
				bumpTexture();
			},

			renameLayer: (id, name) => {
				const layer = layerStack.layers.find((l) => l.id === id);
				if (layer) layer.name = name;
			},

			pushUndo: () => {
				const state = get();
				const layer = layerStack.layers.find((l) => l.id === state.activeLayerId);
				if (!layer) return;
				const entry: UndoEntry = {
					layerId: layer.id,
					imageData: layer.snapshot(),
				};
				const newStack = [...state.undoStack, entry].slice(-MAX_UNDO);
				set({ undoStack: newStack, redoStack: [] });
			},

			undo: () => {
				const state = get();
				if (state.undoStack.length === 0) return;
				const entry = state.undoStack[state.undoStack.length - 1];
				const layer = layerStack.layers.find((l) => l.id === entry.layerId);
				if (!layer) return;

				const redoEntry: UndoEntry = {
					layerId: layer.id,
					imageData: layer.snapshot(),
				};

				layer.restore(entry.imageData);
				set({
					undoStack: state.undoStack.slice(0, -1),
					redoStack: [...state.redoStack, redoEntry],
				});
				bumpTexture();
			},

			redo: () => {
				const state = get();
				if (state.redoStack.length === 0) return;
				const entry = state.redoStack[state.redoStack.length - 1];
				const layer = layerStack.layers.find((l) => l.id === entry.layerId);
				if (!layer) return;

				const undoEntry: UndoEntry = {
					layerId: layer.id,
					imageData: layer.snapshot(),
				};

				layer.restore(entry.imageData);
				set({
					redoStack: state.redoStack.slice(0, -1),
					undoStack: [...state.undoStack, undoEntry],
				});
				bumpTexture();
			},

			setRoughness: (value) => set({ roughness: value }),
			setMetallic: (value) => set({ metallic: value }),

			fillActiveLayer: (pattern, colors) => {
				const state = get();
				const layer = layerStack.layers.find((l) => l.id === state.activeLayerId);
				if (!layer) return;
				const entry = { layerId: layer.id, imageData: layer.snapshot() };
				const newStack = [...state.undoStack, entry].slice(-MAX_UNDO);
				set({ undoStack: newStack, redoStack: [] });
				fillPattern(layer.textureCanvas, pattern, colors);
				bumpTexture();
			},

			importImage: async (file) => {
				const bitmap = await createImageBitmap(file);
				const layer = layerStack.addLayer();
				layer.name = file.name.replace(/\.[^.]+$/, "");
				layer.opacity = 1;
				layer.setImage(bitmap);
				layer.renderImage();
				set({ activeLayerId: layer.id });
				bumpTexture();
			},

			importSticker: async (file) => {
				const bitmap = await createImageBitmap(file);
				const layer = layerStack.addLayer();
				layer.name = `⬡ ${file.name.replace(/\.[^.]+$/, "")}`;
				layer.opacity = 1;
				layer.setImage(bitmap, STICKER_IMAGE_TRANSFORM);
				layer.renderImage();
				set({ activeLayerId: layer.id });
				bumpTexture();
			},

			importImageBitmap: (bitmap, name) => {
				const layer = layerStack.addLayer();
				layer.name = name.replace(/\.[^.]+$/, "");
				layer.opacity = 1;
				layer.setImage(bitmap);
				layer.renderImage();
				set({ activeLayerId: layer.id });
				bumpTexture();
			},

			importStickerBitmap: (bitmap, name) => {
				const layer = layerStack.addLayer();
				layer.name = `⬡ ${name.replace(/\.[^.]+$/, "")}`;
				layer.opacity = 1;
				layer.setImage(bitmap, STICKER_IMAGE_TRANSFORM);
				layer.renderImage();
				set({ activeLayerId: layer.id });
				bumpTexture();
			},

			setImageTransform: (layerId, partial) => {
				const layer = layerStack.layers.find((l) => l.id === layerId);
				if (!layer || !layer.isImageLayer) return;
				Object.assign(layer.imageTransform, partial);
				layer.renderImage();
				bumpTexture();
			},

			setBlendMode: (layerId, mode) => {
				const layer = layerStack.layers.find((l) => l.id === layerId);
				if (layer) {
					layer.blendMode = mode;
					bumpTexture();
				}
			},

			setColorAdjust: (layerId, partial) => {
				const layer = layerStack.layers.find((l) => l.id === layerId);
				if (layer) {
					Object.assign(layer.colorAdjust, partial);
					bumpTexture();
				}
			},

			setEmboss: (layerId, enabled, strength) => {
				const layer = layerStack.layers.find((l) => l.id === layerId);
				if (layer) {
					layer.emboss = enabled;
					if (strength !== undefined) layer.embossStrength = strength;
					bumpTexture();
				}
			},

			setWearLevel: (value) => {
				layerStack.setWear(value);
				set({ wearLevel: value });
				bumpTexture();
			},

			setWearBaseColor: (hex) => {
				layerStack.wearBaseColor = hexToRgb(hex);
				set({ wearBaseColor: hex });
				bumpTexture();
			},

			setWearSharpness: (value) => {
				layerStack.wearSharpness = value;
				set({ wearSharpness: value });
				bumpTexture();
			},

			setViewMode: (mode) => set({ viewMode: mode }),

			setUVEdges: (edges) => set({ uvEdges: edges }),

			setUVIndex: (index) => set({ uvIndex: index }),

			setHoveredFaces: (faces) => set({ hoveredFaces: faces }),

			paintStroke: (points) => {
				const state = get();
				const layer = layerStack.layers.find((l) => l.id === state.activeLayerId);
				if (!layer) return;
				strokeBrush(layer.textureCanvas, points, state.brush);
				bumpTexture();
			},
		};
	});
}
