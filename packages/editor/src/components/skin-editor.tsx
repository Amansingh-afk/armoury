"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useStore } from "zustand";
import { downloadBlob } from "../export/download";
import { dilateSeams } from "../export/seam-dilation";
import { encodeTGA } from "../export/tga-encoder";
import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";
import { DEFAULT_TEXTURE_SIZE } from "../painting/types";
import { createEditorStore } from "../store/editor-store";
import { ExportBar } from "./export-bar";
import { LayersPanel } from "./layers-panel";
import { StylePanel } from "./style-panel";
import { TexturePaintView } from "./texture-paint-view";
import { Toolbar } from "./toolbar";
import { Viewport } from "./viewport";
import { WeaponModel } from "./weapon-model";

export interface SkinEditorProps {
	modelPath: string;
	hdriPath?: string;
	textureSize?: number;
}

export function SkinEditor({
	modelPath,
	hdriPath,
	textureSize = DEFAULT_TEXTURE_SIZE,
}: SkinEditorProps) {
	const storeRef = useRef(createEditorStore(textureSize, textureSize));
	const store = storeRef.current;

	const layerStack = useStore(store, (s) => s.layerStack);
	const activeLayerId = useStore(store, (s) => s.activeLayerId);
	const undoStack = useStore(store, (s) => s.undoStack);
	const redoStack = useStore(store, (s) => s.redoStack);
	const roughness = useStore(store, (s) => s.roughness);
	const metallic = useStore(store, (s) => s.metallic);
	const wearLevel = useStore(store, (s) => s.wearLevel);
	const wearBaseColor = useStore(store, (s) => s.wearBaseColor);
	const wearSharpness = useStore(store, (s) => s.wearSharpness);
	const textureVersion = useStore(store, (s) => s.textureVersion);
	const viewMode = useStore(store, (s) => s.viewMode);
	const activeTool = useStore(store, (s) => s.activeTool);
	const brush = useStore(store, (s) => s.brush);
	const uvEdges = useStore(store, (s) => s.uvEdges);
	const sticker = useStore(store, (s) => s.sticker);
	const uvIndex = useStore(store, (s) => s.uvIndex);
	const hoveredFaces = useStore(store, (s) => s.hoveredFaces);

	const [isDragOver, setIsDragOver] = useState(false);
	const [showWireframe, setShowWireframe] = useState(true);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const stickerPreviewRef = useRef<{ x: number; y: number } | null>(null);

	const activeLayer = layerStack.layers.find((l) => l.id === activeLayerId);

	const handleImportFile = useCallback(
		async (file: File) => {
			if (!file.type.startsWith("image/")) return;
			await store.getState().importImage(file);
		},
		[store],
	);

	const handleImportClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleImportFile(file);
			e.target.value = "";
		},
		[handleImportFile],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file) handleImportFile(file);
		},
		[handleImportFile],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setIsDragOver(false);
	}, []);

	const modelName = modelPath.replace(/^.*\//, "").replace(/\.[^.]+$/, "");

	const handleExportTGA = useCallback(() => {
		const composited = layerStack.composite();
		const dilated = dilateSeams(composited, 16);
		const tga = encodeTGA(dilated);
		const blob = new Blob([tga.buffer as ArrayBuffer], { type: "application/octet-stream" });
		downloadBlob(blob, `weapon_${modelName}_albedo.tga`);
	}, [layerStack, modelName]);

	const handleExportPNG = useCallback(() => {
		const composited = layerStack.composite();
		const dilated = dilateSeams(composited, 16);
		const canvas = new OffscreenCanvas(dilated.width, dilated.height);
		const ctx = canvas.getContext("2d")!;
		ctx.putImageData(dilated, 0, 0);
		canvas.convertToBlob({ type: "image/png" }).then((blob) => {
			downloadBlob(blob, `weapon_${modelName}_albedo.png`);
		});
	}, [layerStack, modelName]);

	const handleExportRoughnessMap = useCallback(() => {
		const canvas = new OffscreenCanvas(textureSize, textureSize);
		const ctx = canvas.getContext("2d")!;
		const v = Math.round(roughness * 255);
		ctx.fillStyle = `rgb(${v},${v},${v})`;
		ctx.fillRect(0, 0, textureSize, textureSize);
		canvas.convertToBlob({ type: "image/png" }).then((blob) => {
			downloadBlob(blob, `weapon_${modelName}_roughness.png`);
		});
	}, [roughness, textureSize, modelName]);

	const handleExportNormalMap = useCallback(() => {
		const canvas = new OffscreenCanvas(textureSize, textureSize);
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = "rgb(128,128,255)";
		ctx.fillRect(0, 0, textureSize, textureSize);
		canvas.convertToBlob({ type: "image/png" }).then((blob) => {
			downloadBlob(blob, `weapon_${modelName}_normal.png`);
		});
	}, [textureSize, modelName]);

	const handlePushUndo = useCallback(() => {
		store.getState().pushUndo();
	}, [store]);

	const handleBumpTexture = useCallback(() => {
		// Trigger re-render by incrementing textureVersion
		store.setState({ textureVersion: store.getState().textureVersion + 1 });
	}, [store]);

	const handleUVEdgesReady = useCallback(
		(edges: Array<[number, number, number, number]>) => {
			store.getState().setUVEdges(edges);
		},
		[store],
	);

	const handleUVIndexReady = useCallback(
		(index: import("../painting/uv-lookup").UVIndex) => {
			store.getState().setUVIndex(index);
		},
		[store],
	);

	useKeyboardShortcuts({
		onUndo: () => store.getState().undo(),
		onRedo: () => store.getState().redo(),
	});

	const show3D = viewMode === "3d" || viewMode === "split";
	const show2D = viewMode === "2d" || viewMode === "split";

	return (
		<div className="flex h-screen w-screen flex-col bg-zinc-950">
			<Toolbar
				onUndo={() => store.getState().undo()}
				onRedo={() => store.getState().redo()}
				canUndo={undoStack.length > 0}
				canRedo={redoStack.length > 0}
				onImportImage={handleImportClick}
				showWireframe={showWireframe}
				onToggleWireframe={() => setShowWireframe((v) => !v)}
				viewMode={viewMode}
				onSetViewMode={(mode) => store.getState().setViewMode(mode)}
				activeTool={activeTool}
				onSetTool={(tool) => store.getState().setTool(tool)}
				brush={brush}
				onBrushChange={(partial) => store.getState().setBrush(partial)}
				sticker={sticker}
				onLoadSticker={(file) => store.getState().loadSticker(file)}
				onStickerScaleChange={(s) => store.getState().setStickerScale(s)}
				onStickerRotationChange={(r) => store.getState().setStickerRotation(r)}
				onClearSticker={() => store.getState().clearSticker()}
			/>
			<div className="flex flex-1 overflow-hidden">
				<LayersPanel
					layers={layerStack.layers}
					activeLayerId={activeLayerId}
					onSelectLayer={(id) => store.getState().setActiveLayer(id)}
					onAddLayer={() => store.getState().addLayer()}
					onDeleteLayer={(id) => store.getState().deleteLayer(id)}
					onToggleVisibility={(id) => store.getState().toggleLayerVisibility(id)}
					onSetOpacity={(id, opacity) => store.getState().setLayerOpacity(id, opacity)}
					onSetBlendMode={(id, mode) => store.getState().setBlendMode(id, mode)}
					onImportImage={handleImportClick}
				/>
				<div
					className="relative flex-1 min-h-0 flex"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
				>
					{isDragOver && (
						<div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-600/20 border-2 border-dashed border-blue-400 pointer-events-none">
							<span className="text-lg text-blue-300 font-medium">Drop image to add as layer</span>
						</div>
					)}
					{show3D && (
						<div className={`relative ${show2D ? "flex-1 min-w-0" : "flex-1"}`}>
							<Viewport hdriPath={hdriPath}>
								<Suspense fallback={null}>
									<WeaponModel
										modelPath={modelPath}
										layerStack={layerStack}
										roughness={roughness}
										metallic={metallic}
										textureVersion={textureVersion}
										showWireframe={showWireframe}
										hoveredFaces={hoveredFaces}
										sticker={sticker}
										stickerPreviewRef={stickerPreviewRef}
										onUVEdgesReady={handleUVEdgesReady}
										onUVIndexReady={handleUVIndexReady}
									/>
								</Suspense>
							</Viewport>
						</div>
					)}
					{show2D && (
						<div className={`relative ${show3D ? "flex-1 min-w-0 border-l border-zinc-700" : "flex-1"}`}>
							<TexturePaintView
								layerStack={layerStack}
								textureVersion={textureVersion}
								brush={brush}
								activeTool={activeTool}
								activeLayerId={activeLayerId}
								uvEdges={uvEdges}
								showWireframe={showWireframe}
								sticker={sticker}
								uvIndex={uvIndex}
								hoveredFaces={hoveredFaces}
								onPushUndo={handlePushUndo}
								onBumpTexture={handleBumpTexture}
								onPlaceSticker={(x, y) => store.getState().placeSticker(x, y)}
								onHoveredFacesChange={(faces) => store.getState().setHoveredFaces(faces)}
								stickerPreviewRef={stickerPreviewRef}
							/>
						</div>
					)}
				</div>
				<StylePanel
					roughness={roughness}
					metallic={metallic}
					onRoughnessChange={(v) => store.getState().setRoughness(v)}
					onMetallicChange={(v) => store.getState().setMetallic(v)}
					onApplyToAll={(pattern, colors) => {
						if (!activeLayer) return;
						store.getState().fillActiveLayer(pattern, colors);
					}}
					colorAdjust={activeLayer?.colorAdjust ?? null}
					onColorAdjustChange={(partial) => {
						if (!activeLayer) return;
						store.getState().setColorAdjust(activeLayer.id, partial);
					}}
					emboss={activeLayer?.emboss ?? false}
					embossStrength={activeLayer?.embossStrength ?? 0.5}
					onEmbossChange={(enabled, strength) => {
						if (!activeLayer) return;
						store.getState().setEmboss(activeLayer.id, enabled, strength);
					}}
					isImageLayer={activeLayer?.isImageLayer ?? false}
					imageTransform={activeLayer?.isImageLayer ? activeLayer.imageTransform : null}
					onImageTransformChange={(partial) => {
						if (!activeLayer) return;
						store.getState().pushUndo();
						store.getState().setImageTransform(activeLayer.id, partial);
					}}
					wearLevel={wearLevel}
					onWearLevelChange={(v) => store.getState().setWearLevel(v)}
					wearBaseColor={wearBaseColor}
					onWearBaseColorChange={(hex) => store.getState().setWearBaseColor(hex)}
					wearSharpness={wearSharpness}
					onWearSharpnessChange={(v) => store.getState().setWearSharpness(v)}
				/>
			</div>
			<ExportBar
				onExportTGA={handleExportTGA}
				onExportPNG={handleExportPNG}
				onExportRoughnessMap={handleExportRoughnessMap}
				onExportNormalMap={handleExportNormalMap}
				textureSize={textureSize}
			/>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileInputChange}
			/>
		</div>
	);
}
