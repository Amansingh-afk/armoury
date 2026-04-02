"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useStore } from "zustand";
import { downloadBlob } from "../export/download";
import { dilateSeams } from "../export/seam-dilation";
import { encodeTGA } from "../export/tga-encoder";
import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";
import { DEFAULT_TEXTURE_SIZE } from "../painting/types";
import { buildUVOwnershipMap } from "../painting/uv-ownership";
import { createEditorStore } from "../store/editor-store";
import { ExportBar } from "./export-bar";
import { LayersPanel } from "./layers-panel";
import { StylePanel } from "./style-panel";
import { TexturePaintView } from "./texture-paint-view";
import { Toolbar, type WeaponPickerOption } from "./toolbar";
import { ModelLoadingFallback } from "./viewport";
import { ImageImportDialog, type ImageImportResult } from "./image-import-dialog";
import { Viewport } from "./viewport";
import type { StickerPreview } from "./weapon-model";
import { WeaponModel } from "./weapon-model";
import { PartContextMenu } from "./part-context-menu";

export type { WeaponPickerOption };

export interface SkinEditorProps {
	modelPath: string;
	hdriPath?: string;
	textureSize?: number;
	/** When set with onWeaponChange, shows a weapon dropdown at the left of the toolbar */
	weaponOptions?: WeaponPickerOption[];
	selectedWeaponId?: string;
	onWeaponChange?: (id: string) => void;
}

export function SkinEditor({
	modelPath,
	hdriPath,
	textureSize = DEFAULT_TEXTURE_SIZE,
	weaponOptions,
	selectedWeaponId,
	onWeaponChange,
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
	const uvIndex = useStore(store, (s) => s.uvIndex);
	const hoveredFaces = useStore(store, (s) => s.hoveredFaces);
	const partOverrides = useStore(store, (s) => s.partOverrides);
	const partEditMode = useStore(store, (s) => s.partEditMode);
	const selectedPart = useStore(store, (s) => s.selectedPart);

	const [isDragOver, setIsDragOver] = useState(false);
	const [showWireframe, setShowWireframe] = useState(true);
	const [meshGeometries, setMeshGeometries] = useState<Array<{ name: string; geometry: import("three").BufferGeometry }>>([]);
	const [importDialogFile, setImportDialogFile] = useState<{ file: File; mode: "image" | "sticker" } | null>(null);
	const [contextMenu, setContextMenu] = useState<{ meshName: string; x: number; y: number } | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const activeLayer = layerStack.layers.find((l) => l.id === activeLayerId);

	// Build sticker preview for 3D placement when active layer is a place-mode image
	const stickerPreview: StickerPreview | null = (() => {
		if (!activeLayer?.isImageLayer || !activeLayer.image) return null;
		if (activeLayer.imageTransform.fillMode !== "place") return null;
		return {
			image: activeLayer.image,
			scale: activeLayer.imageTransform.scale,
			rotation: activeLayer.imageTransform.rotation,
			flipX: activeLayer.imageTransform.flipX,
			flipY: activeLayer.imageTransform.flipY,
		};
	})();

	const handleStickerPlace = useCallback(
		(uvX: number, uvY: number) => {
			if (!activeLayer?.isImageLayer) return;
			store.getState().pushUndo();
			store.getState().setImageTransform(activeLayer.id, { x: uvX, y: uvY });
		},
		[store, activeLayer],
	);

	const handlePartHover = useCallback(
		(meshName: string | null) => {
			store.getState().setSelectedPart(meshName);
		},
		[store],
	);

	const handlePartRightClick = useCallback(
		(meshName: string, screenX: number, screenY: number) => {
			setContextMenu({ meshName, x: screenX, y: screenY });
		},
		[],
	);

	const handlePartOverrideUpdate = useCallback(
		(meshName: string, overrides: Partial<import("../store/editor-store").PartOverrides>) => {
			store.getState().setPartOverride(meshName, overrides);
		},
		[store],
	);

	const handlePartOverrideReset = useCallback(
		(meshName: string) => {
			store.getState().resetPartOverride(meshName);
			setContextMenu(null);
		},
		[store],
	);

	const handleImportFile = useCallback(
		(file: File) => {
			if (!file.type.startsWith("image/")) return;
			setImportDialogFile({ file, mode: "image" });
		},
		[],
	);

	const handleStickerFile = useCallback(
		(file: File) => {
			if (!file.type.startsWith("image/")) return;
			setImportDialogFile({ file, mode: "sticker" });
		},
		[],
	);

	const handleImportConfirm = useCallback(
		async (result: ImageImportResult) => {
			const mode = importDialogFile?.mode ?? "image";
			setImportDialogFile(null);
			if (mode === "sticker") {
				await store.getState().importStickerBitmap(result.bitmap, importDialogFile?.file.name ?? "sticker");
			} else {
				await store.getState().importImageBitmap(result.bitmap, importDialogFile?.file.name ?? "image");
			}
		},
		[store, importDialogFile],
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
		const composited = layerStack.compositeForExport();
		const dilated = dilateSeams(composited, 16, { preserveAlpha: true });
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

		if (partOverrides.size === 0 || meshGeometries.length === 0) {
			// No per-part overrides — export flat roughness as before
			const v = Math.round(roughness * 255);
			ctx.fillStyle = `rgb(${v},${v},${v})`;
			ctx.fillRect(0, 0, textureSize, textureSize);
		} else {
			// Per-part roughness using UV ownership map
			const ownershipMap = buildUVOwnershipMap(meshGeometries, textureSize, textureSize);
			const imageData = ctx.createImageData(textureSize, textureSize);
			const data = imageData.data;

			for (let i = 0; i < ownershipMap.length; i++) {
				const meshIdx = ownershipMap[i];
				let r: number;
				if (meshIdx >= 0 && meshIdx < meshGeometries.length) {
					const meshName = meshGeometries[meshIdx].name;
					const override = partOverrides.get(meshName);
					r = override?.roughness ?? roughness;
				} else {
					r = roughness;
				}
				const v = Math.round(r * 255);
				const p = i * 4;
				data[p] = v;
				data[p + 1] = v;
				data[p + 2] = v;
				data[p + 3] = 255;
			}
			ctx.putImageData(imageData, 0, 0);
		}

		canvas.convertToBlob({ type: "image/png" }).then((blob) => {
			downloadBlob(blob, `weapon_${modelName}_roughness.png`);
		});
	}, [roughness, textureSize, modelName, partOverrides, meshGeometries]);

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

	const getActivePlaceTransform = useCallback(() => {
		const state = store.getState();
		const layer = state.layerStack.layers.find((l) => l.id === state.activeLayerId);
		if (!layer?.isImageLayer || layer.imageTransform.fillMode !== "place") return null;
		return { layerId: layer.id, transform: { ...layer.imageTransform } };
	}, [store]);

	const handleImageTransformChange = useCallback(
		(layerId: number, partial: Partial<import("../painting/layer").ImageTransform>) => {
			store.getState().setImageTransform(layerId, partial);
		},
		[store],
	);

	useKeyboardShortcuts({
		onUndo: () => store.getState().undo(),
		onRedo: () => store.getState().redo(),
		onEscape: () => store.getState().setTool("pan"),
		getActivePlaceTransform,
		onImageTransformChange: handleImageTransformChange,
		onTogglePartEditMode: () => store.getState().togglePartEditMode(),
	});

	const show3D = viewMode === "3d" || viewMode === "split";
	const show2D = viewMode === "2d" || viewMode === "split";

	return (
		<div className="flex h-screen w-screen flex-col bg-zinc-950">
			<Toolbar
				weaponPicker={
					weaponOptions && weaponOptions.length > 0 && selectedWeaponId && onWeaponChange
						? { options: weaponOptions, selectedId: selectedWeaponId, onSelect: onWeaponChange }
						: undefined
				}
				onUndo={() => store.getState().undo()}
				onRedo={() => store.getState().redo()}
				canUndo={undoStack.length > 0}
				canRedo={redoStack.length > 0}
				onImportImage={handleImportClick}
				onImportSticker={handleStickerFile}
				showWireframe={showWireframe}
				onToggleWireframe={() => setShowWireframe((v) => !v)}
				partEditMode={partEditMode}
				onTogglePartEditMode={() => store.getState().togglePartEditMode()}
				viewMode={viewMode}
				onSetViewMode={(mode) => store.getState().setViewMode(mode)}
				activeTool={activeTool}
				onSetTool={(tool) => store.getState().setTool(tool)}
				brush={brush}
				onBrushChange={(partial) => store.getState().setBrush(partial)}
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
								<Suspense fallback={<ModelLoadingFallback />}>
									<WeaponModel
										modelPath={modelPath}
										layerStack={layerStack}
										roughness={roughness}
										metallic={metallic}
										textureVersion={textureVersion}
										showWireframe={showWireframe}
										hoveredFaces={hoveredFaces}
										onUVEdgesReady={handleUVEdgesReady}
										onUVIndexReady={handleUVIndexReady}
										stickerPreview={stickerPreview}
										onStickerPlace={handleStickerPlace}
										partOverrides={partOverrides}
										partEditMode={partEditMode}
										selectedPart={selectedPart}
										onPartHover={handlePartHover}
										onPartRightClick={handlePartRightClick}
										onMeshGeometriesReady={setMeshGeometries}
									/>
								</Suspense>
							</Viewport>
							{contextMenu && partEditMode && (
								<PartContextMenu
									meshName={contextMenu.meshName}
									screenX={contextMenu.x}
									screenY={contextMenu.y}
									overrides={partOverrides.get(contextMenu.meshName) ?? {}}
									globalRoughness={roughness}
									globalMetalness={metallic}
									globalWearLevel={wearLevel}
									onUpdate={(overrides) => handlePartOverrideUpdate(contextMenu.meshName, overrides)}
									onReset={() => handlePartOverrideReset(contextMenu.meshName)}
									onClose={() => setContextMenu(null)}
								/>
							)}
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
								uvIndex={uvIndex}
								hoveredFaces={hoveredFaces}
								onPushUndo={handlePushUndo}
								onBumpTexture={handleBumpTexture}
								onHoveredFacesChange={(faces) => store.getState().setHoveredFaces(faces)}
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
			{importDialogFile && (
				<ImageImportDialog
					file={importDialogFile.file}
					onConfirm={handleImportConfirm}
					onCancel={() => setImportDialogFile(null)}
				/>
			)}
		</div>
	);
}
