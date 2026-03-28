"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stampBrush } from "../painting/brush";
import type { LayerStack } from "../painting/layer-stack";
import type { BrushSettings } from "../painting/types";
import { type UVIndex, findIslandAtUV } from "../painting/uv-lookup";
import type { StickerState, Tool } from "../store/editor-store";

interface TexturePaintViewProps {
	layerStack: LayerStack;
	textureVersion: number;
	brush: BrushSettings;
	activeTool: Tool;
	activeLayerId: number;
	uvEdges: Array<[number, number, number, number]>;
	showWireframe: boolean;
	sticker: StickerState | null;
	uvIndex: UVIndex | null;
	hoveredFaces: number[];
	onPushUndo: () => void;
	onBumpTexture: () => void;
	onPlaceSticker: (texX: number, texY: number) => void;
	onHoveredFacesChange: (faces: number[]) => void;
	stickerPreviewRef: React.MutableRefObject<{ x: number; y: number } | null>;
}

export function TexturePaintView({
	layerStack,
	textureVersion,
	brush,
	activeTool,
	activeLayerId,
	uvEdges,
	showWireframe,
	sticker,
	uvIndex,
	hoveredFaces,
	onPushUndo,
	onBumpTexture,
	onPlaceSticker,
	onHoveredFacesChange,
	stickerPreviewRef,
}: TexturePaintViewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const uvCacheRef = useRef<HTMLCanvasElement | null>(null);

	const [viewScale, setViewScale] = useState(1);
	const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
	const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
	const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

	const isPaintingRef = useRef(false);
	const lastPaintPosRef = useRef<{ x: number; y: number } | null>(null);
	const isPanningRef = useRef(false);
	const panStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

	const texW = layerStack.layers[0]?.textureCanvas.width ?? 2048;
	const texH = layerStack.layers[0]?.textureCanvas.height ?? 2048;

	// Resize observer
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const ro = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect;
			setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
		});
		ro.observe(container);
		return () => ro.disconnect();
	}, []);

	// Fit texture on first render only
	const hasInitRef = useRef(false);
	useEffect(() => {
		if (hasInitRef.current || canvasSize.w === 0 || canvasSize.h === 0) return;
		hasInitRef.current = true;
		const fitScale = Math.min(canvasSize.w / texW, canvasSize.h / texH) * 0.9;
		setViewScale(fitScale);
		setViewOffset({
			x: (canvasSize.w - texW * fitScale) / 2,
			y: (canvasSize.h - texH * fitScale) / 2,
		});
	}, [canvasSize.w, canvasSize.h, texW, texH]);

	// Cache UV wireframe
	useEffect(() => {
		if (uvEdges.length === 0) {
			uvCacheRef.current = null;
			return;
		}
		const cache = document.createElement("canvas");
		cache.width = texW;
		cache.height = texH;
		const ctx = cache.getContext("2d")!;
		ctx.strokeStyle = "rgba(136, 68, 255, 0.7)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (const [u1, v1, u2, v2] of uvEdges) {
			ctx.moveTo(u1 * texW, v1 * texH);
			ctx.lineTo(u2 * texW, v2 * texH);
		}
		ctx.stroke();
		uvCacheRef.current = cache;
	}, [uvEdges, texW, texH]);

	// Render composite + UV overlay
	// biome-ignore lint/correctness/useExhaustiveDependencies: textureVersion triggers redraw
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		canvas.width = canvasSize.w;
		canvas.height = canvasSize.h;
		const ctx = canvas.getContext("2d")!;
		ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

		// Checkerboard background
		ctx.fillStyle = "#1a1a1a";
		ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

		ctx.save();
		ctx.translate(viewOffset.x, viewOffset.y);
		ctx.scale(viewScale, viewScale);

		// Draw composited texture
		const composited = layerStack.composite();
		const tmpCanvas = new OffscreenCanvas(texW, texH);
		const tmpCtx = tmpCanvas.getContext("2d")!;
		tmpCtx.putImageData(composited, 0, 0);
		ctx.drawImage(tmpCanvas, 0, 0);

		// UV wireframe overlay
		if (showWireframe && uvCacheRef.current) {
			ctx.drawImage(uvCacheRef.current, 0, 0);
		}

		// Hovered island highlight
		if (hoveredFaces.length > 0 && uvIndex) {
			ctx.fillStyle = "rgba(255, 136, 0, 0.3)";
			ctx.beginPath();
			for (const faceIdx of hoveredFaces) {
				const tri = uvIndex.triangles[faceIdx];
				if (!tri) continue;
				ctx.moveTo(tri.uvA.x * texW, tri.uvA.y * texH);
				ctx.lineTo(tri.uvB.x * texW, tri.uvB.y * texH);
				ctx.lineTo(tri.uvC.x * texW, tri.uvC.y * texH);
				ctx.closePath();
			}
			ctx.fill();
		}

		ctx.restore();

		// Brush cursor
		if (mousePos && activeTool === "brush") {
			const r = (brush.size / 2) * viewScale;
			ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(mousePos.x, mousePos.y, r, 0, Math.PI * 2);
			ctx.stroke();
		}

		// Sticker preview
		if (mousePos && activeTool === "sticker" && sticker) {
			const sw = sticker.image.width * sticker.scale * viewScale;
			const sh = sticker.image.height * sticker.scale * viewScale;
			ctx.save();
			ctx.globalAlpha = 0.7;
			ctx.translate(mousePos.x, mousePos.y);
			ctx.rotate(sticker.rotation);
			ctx.drawImage(sticker.image, -sw / 2, -sh / 2, sw, sh);
			ctx.restore();
			// Crosshair
			ctx.strokeStyle = "rgba(255, 200, 0, 0.6)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(mousePos.x - 10, mousePos.y);
			ctx.lineTo(mousePos.x + 10, mousePos.y);
			ctx.moveTo(mousePos.x, mousePos.y - 10);
			ctx.lineTo(mousePos.x, mousePos.y + 10);
			ctx.stroke();
		}
	}, [textureVersion, canvasSize, viewOffset, viewScale, showWireframe, mousePos, activeTool, brush.size, layerStack, texW, texH, sticker, hoveredFaces, uvIndex]);

	// Convert screen coords to texture coords
	const screenToTex = useCallback(
		(sx: number, sy: number) => ({
			x: (sx - viewOffset.x) / viewScale,
			y: (sy - viewOffset.y) / viewScale,
		}),
		[viewOffset, viewScale],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			const rect = canvasRef.current?.getBoundingClientRect();
			if (!rect) return;
			const sx = e.clientX - rect.left;
			const sy = e.clientY - rect.top;

			// Middle or right button = pan
			if (e.button === 1 || e.button === 2) {
				isPanningRef.current = true;
				panStartRef.current = { x: e.clientX, y: e.clientY, ox: viewOffset.x, oy: viewOffset.y };
				(e.target as HTMLElement).setPointerCapture(e.pointerId);
				return;
			}

			if (activeTool === "pan" && e.button === 0) {
				isPanningRef.current = true;
				panStartRef.current = { x: e.clientX, y: e.clientY, ox: viewOffset.x, oy: viewOffset.y };
				(e.target as HTMLElement).setPointerCapture(e.pointerId);
				return;
			}

			if (activeTool === "sticker" && sticker && e.button === 0) {
				const tex = screenToTex(sx, sy);
				onPushUndo();
				onPlaceSticker(tex.x, tex.y);
				return;
			}

			if (activeTool === "brush" && e.button === 0) {
				isPaintingRef.current = true;
				(e.target as HTMLElement).setPointerCapture(e.pointerId);
				const tex = screenToTex(sx, sy);

				onPushUndo();

				const layer = layerStack.layers.find((l) => l.id === activeLayerId);
				if (layer) {
					stampBrush(layer.textureCanvas, tex.x, tex.y, brush);
					onBumpTexture();
				}
				lastPaintPosRef.current = tex;
			}
		},
		[activeTool, brush, activeLayerId, layerStack, screenToTex, viewOffset, onPushUndo, onBumpTexture, sticker, onPlaceSticker],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			const rect = canvasRef.current?.getBoundingClientRect();
			if (!rect) return;
			const sx = e.clientX - rect.left;
			const sy = e.clientY - rect.top;
			setMousePos({ x: sx, y: sy });

			if (isPanningRef.current) {
				setViewOffset({
					x: panStartRef.current.ox + (e.clientX - panStartRef.current.x),
					y: panStartRef.current.oy + (e.clientY - panStartRef.current.y),
				});
				return;
			}

			if (isPaintingRef.current && lastPaintPosRef.current) {
				const tex = screenToTex(sx, sy);
				const layer = layerStack.layers.find((l) => l.id === activeLayerId);
				if (layer) {
					// Interpolate between last and current position
					const last = lastPaintPosRef.current;
					const dx = tex.x - last.x;
					const dy = tex.y - last.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					const spacing = Math.max(1, brush.size * 0.25);
					const steps = Math.max(1, Math.ceil(dist / spacing));

					for (let s = 1; s <= steps; s++) {
						const t = s / steps;
						stampBrush(layer.textureCanvas, last.x + dx * t, last.y + dy * t, brush);
					}
					onBumpTexture();
				}
				lastPaintPosRef.current = tex;
			}

			// UV island hover detection
			if (uvIndex && !isPaintingRef.current && !isPanningRef.current) {
				const tex = screenToTex(sx, sy);
				const uvX = tex.x / texW;
				const uvY = tex.y / texH;
				const faces = findIslandAtUV(uvX, uvY, uvIndex);
				onHoveredFacesChange(faces);
			}

			// Sticker 3D preview position
			if (activeTool === "sticker" && sticker) {
				const tex = screenToTex(sx, sy);
				stickerPreviewRef.current = { x: tex.x, y: tex.y };
			} else {
				stickerPreviewRef.current = null;
			}
		},
		[activeTool, brush, activeLayerId, layerStack, screenToTex, onBumpTexture, uvIndex, texW, texH, onHoveredFacesChange, sticker, stickerPreviewRef],
	);

	const handlePointerUp = useCallback(() => {
		isPaintingRef.current = false;
		lastPaintPosRef.current = null;
		isPanningRef.current = false;
	}, []);

	// Use native wheel listener to avoid passive event issue
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;

			const factor = e.deltaY < 0 ? 1.15 : 0.87;
			setViewScale((prev) => {
				const newScale = Math.max(0.05, Math.min(10, prev * factor));
				setViewOffset((prevOff) => ({
					x: mx - (mx - prevOff.x) * (newScale / prev),
					y: my - (my - prevOff.y) * (newScale / prev),
				}));
				return newScale;
			});
		};

		canvas.addEventListener("wheel", onWheel, { passive: false });
		return () => canvas.removeEventListener("wheel", onWheel);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setMousePos(null);
		isPanningRef.current = false;
		onHoveredFacesChange([]);
		stickerPreviewRef.current = null;
	}, [onHoveredFacesChange, stickerPreviewRef]);

	return (
		<div ref={containerRef} className="relative w-full h-full overflow-hidden bg-zinc-950">
			<canvas
				ref={canvasRef}
				className={`absolute inset-0 ${activeTool === "brush" ? "cursor-crosshair" : activeTool === "sticker" ? "cursor-none" : "cursor-grab"}`}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerLeave={handleMouseLeave}
				onContextMenu={(e) => e.preventDefault()}
			/>
			<div className="absolute bottom-2 left-2 text-[10px] text-zinc-600">
				{Math.round(viewScale * 100)}% | {texW}x{texH} | Scroll: zoom | Right-drag: pan
			</div>
		</div>
	);
}
